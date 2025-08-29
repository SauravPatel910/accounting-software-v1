-- ==============================================
-- ACCOUNTS MODULE DATABASE SCHEMA
-- Chart of Accounts Implementation
-- ==============================================

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Account identification
    code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Account classification
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    sub_type VARCHAR(50) NOT NULL CHECK (sub_type IN (
        -- Asset subtypes
        'current_asset', 'non_current_asset', 'fixed_asset', 'intangible_asset',
        -- Liability subtypes
        'current_liability', 'non_current_liability', 'long_term_liability',
        -- Equity subtypes
        'owners_equity', 'retained_earnings', 'capital',
        -- Revenue subtypes
        'operating_revenue', 'non_operating_revenue', 'other_income',
        -- Expense subtypes
        'cost_of_goods_sold', 'operating_expense', 'administrative_expense',
        'selling_expense', 'non_operating_expense'
    )),

    -- Account hierarchy
    parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 10),

    -- Account properties
    is_control_account BOOLEAN NOT NULL DEFAULT FALSE,
    allow_direct_transactions BOOLEAN NOT NULL DEFAULT TRUE,

    -- Financial properties
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    opening_balance_date DATE,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    -- Tax and compliance
    tax_code VARCHAR(50),
    is_taxable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Depreciation (for fixed assets)
    is_depreciable BOOLEAN NOT NULL DEFAULT FALSE,
    depreciation_rate DECIMAL(5,2) CHECK (depreciation_rate >= 0 AND depreciation_rate <= 100),
    depreciation_method VARCHAR(50),

    -- Status and metadata
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(company_id, code);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(company_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_sub_type ON accounts(company_id, sub_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_level ON accounts(level);
CREATE INDEX IF NOT EXISTS idx_accounts_hierarchy ON accounts(company_id, parent_account_id, level);

-- Create unique constraint for account codes within company
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_company_code_unique
ON accounts(company_id, code) WHERE status != 'archived';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy for viewing accounts (all authenticated users can view their company's accounts)
CREATE POLICY accounts_select_policy ON accounts
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Policy for inserting accounts (admin and accountant only)
CREATE POLICY accounts_insert_policy ON accounts
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id
            FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'accountant')
        )
    );

-- Policy for updating accounts (admin and accountant only)
CREATE POLICY accounts_update_policy ON accounts
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id
            FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'accountant')
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id
            FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'accountant')
        )
    );

-- Policy for deleting accounts (admin only)
CREATE POLICY accounts_delete_policy ON accounts
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id
            FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ==============================================
-- VALIDATION FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to validate account hierarchy
CREATE OR REPLACE FUNCTION validate_account_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_type VARCHAR(20);
    parent_level INTEGER;
    max_level INTEGER := 10;
BEGIN
    -- If parent account is specified
    IF NEW.parent_account_id IS NOT NULL THEN
        -- Get parent account details
        SELECT type, level INTO parent_type, parent_level
        FROM accounts
        WHERE id = NEW.parent_account_id AND company_id = NEW.company_id;

        -- Check if parent exists
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Parent account does not exist or belongs to different company';
        END IF;

        -- Check if parent account type matches
        IF parent_type != NEW.type THEN
            RAISE EXCEPTION 'Child account type must match parent account type. Parent: %, Child: %', parent_type, NEW.type;
        END IF;

        -- Set level based on parent level
        NEW.level := parent_level + 1;

        -- Check maximum level depth
        IF NEW.level > max_level THEN
            RAISE EXCEPTION 'Account hierarchy cannot exceed % levels', max_level;
        END IF;

        -- Check if parent allows child accounts (control accounts)
        IF NOT EXISTS (
            SELECT 1 FROM accounts
            WHERE id = NEW.parent_account_id
            AND company_id = NEW.company_id
            AND (is_control_account = TRUE OR allow_direct_transactions = FALSE)
        ) THEN
            RAISE EXCEPTION 'Parent account must be a control account or not allow direct transactions';
        END IF;
    ELSE
        -- Root level account
        NEW.level := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create hierarchy validation trigger
CREATE TRIGGER trigger_validate_account_hierarchy
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION validate_account_hierarchy();

-- Function to prevent circular references
CREATE OR REPLACE FUNCTION prevent_circular_account_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id UUID;
    visited_ids UUID[];
    max_depth INTEGER := 50;
    depth_counter INTEGER := 0;
BEGIN
    -- Only check if parent_account_id is being set
    IF NEW.parent_account_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Prevent self-reference
    IF NEW.id = NEW.parent_account_id THEN
        RAISE EXCEPTION 'Account cannot be its own parent';
    END IF;

    -- Check for circular reference
    current_parent_id := NEW.parent_account_id;
    visited_ids := ARRAY[NEW.id];

    WHILE current_parent_id IS NOT NULL AND depth_counter < max_depth LOOP
        -- Check if we've seen this ID before (circular reference)
        IF current_parent_id = ANY(visited_ids) THEN
            RAISE EXCEPTION 'Circular reference detected in account hierarchy';
        END IF;

        -- Add to visited list
        visited_ids := visited_ids || current_parent_id;

        -- Get next parent
        SELECT parent_account_id INTO current_parent_id
        FROM accounts
        WHERE id = current_parent_id AND company_id = NEW.company_id;

        depth_counter := depth_counter + 1;
    END LOOP;

    IF depth_counter >= max_depth THEN
        RAISE EXCEPTION 'Account hierarchy depth limit exceeded';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create circular reference prevention trigger
CREATE TRIGGER trigger_prevent_circular_account_reference
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_account_reference();

-- Function to validate account deletion
CREATE OR REPLACE FUNCTION validate_account_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if account has child accounts
    IF EXISTS (
        SELECT 1 FROM accounts
        WHERE parent_account_id = OLD.id
        AND company_id = OLD.company_id
    ) THEN
        RAISE EXCEPTION 'Cannot delete account that has child accounts';
    END IF;

    -- Check if account has transactions (would be in transaction_entries table)
    -- This check will be enabled when transaction_entries table is created
    /*
    IF EXISTS (
        SELECT 1 FROM transaction_entries
        WHERE account_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Cannot delete account that has transaction entries';
    END IF;
    */

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create deletion validation trigger
CREATE TRIGGER trigger_validate_account_deletion
    BEFORE DELETE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION validate_account_deletion();

-- Function to update current balance (will be called by transaction processing)
CREATE OR REPLACE FUNCTION update_account_balance(
    p_account_id UUID,
    p_debit_amount DECIMAL(15,2) DEFAULT 0,
    p_credit_amount DECIMAL(15,2) DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    account_type VARCHAR(20);
    balance_change DECIMAL(15,2);
BEGIN
    -- Get account type
    SELECT type INTO account_type
    FROM accounts
    WHERE id = p_account_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found: %', p_account_id;
    END IF;

    -- Calculate balance change based on account type
    -- Assets and Expenses: Debit increases, Credit decreases
    -- Liabilities, Equity, and Revenue: Credit increases, Debit decreases
    IF account_type IN ('asset', 'expense') THEN
        balance_change := p_debit_amount - p_credit_amount;
    ELSE
        balance_change := p_credit_amount - p_debit_amount;
    END IF;

    -- Update current balance
    UPDATE accounts
    SET current_balance = current_balance + balance_change,
        updated_at = NOW()
    WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VIEWS FOR REPORTING AND ANALYSIS
-- ==============================================

-- Account hierarchy view with calculated balances
CREATE OR REPLACE VIEW account_hierarchy_view AS
WITH RECURSIVE account_tree AS (
    -- Base case: root accounts (no parent)
    SELECT
        id,
        company_id,
        code,
        name,
        type,
        sub_type,
        parent_account_id,
        level,
        is_control_account,
        allow_direct_transactions,
        current_balance,
        status,
        ARRAY[code] AS path,
        code AS sort_path
    FROM accounts
    WHERE parent_account_id IS NULL

    UNION ALL

    -- Recursive case: child accounts
    SELECT
        a.id,
        a.company_id,
        a.code,
        a.name,
        a.type,
        a.sub_type,
        a.parent_account_id,
        a.level,
        a.is_control_account,
        a.allow_direct_transactions,
        a.current_balance,
        a.status,
        at.path || a.code,
        at.sort_path || '.' || a.code
    FROM accounts a
    INNER JOIN account_tree at ON a.parent_account_id = at.id
    WHERE a.status != 'archived'
)
SELECT
    id,
    company_id,
    code,
    name,
    type,
    sub_type,
    parent_account_id,
    level,
    is_control_account,
    allow_direct_transactions,
    current_balance,
    status,
    path,
    sort_path
FROM account_tree
ORDER BY company_id, sort_path;

-- Account summary by type view
CREATE OR REPLACE VIEW account_type_summary AS
SELECT
    company_id,
    type,
    sub_type,
    COUNT(*) as account_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
    SUM(current_balance) as total_balance,
    SUM(CASE WHEN status = 'active' THEN current_balance ELSE 0 END) as active_balance
FROM accounts
WHERE status != 'archived'
GROUP BY company_id, type, sub_type
ORDER BY company_id, type, sub_type;

-- ==============================================
-- UTILITY FUNCTIONS
-- ==============================================

-- Function to get next available account code
CREATE OR REPLACE FUNCTION get_next_account_code(
    p_company_id UUID,
    p_type VARCHAR(20),
    p_sub_type VARCHAR(50),
    p_prefix VARCHAR(10) DEFAULT NULL
)
RETURNS VARCHAR(10) AS $$
DECLARE
    code_prefix VARCHAR(10);
    next_number INTEGER;
    next_code VARCHAR(10);
    code_patterns JSONB := '{
        "asset": {
            "current_asset": "11",
            "non_current_asset": "12",
            "fixed_asset": "13",
            "intangible_asset": "14"
        },
        "liability": {
            "current_liability": "21",
            "non_current_liability": "22",
            "long_term_liability": "23"
        },
        "equity": {
            "owners_equity": "31",
            "retained_earnings": "32",
            "capital": "33"
        },
        "revenue": {
            "operating_revenue": "41",
            "non_operating_revenue": "42",
            "other_income": "43"
        },
        "expense": {
            "cost_of_goods_sold": "51",
            "operating_expense": "52",
            "administrative_expense": "53",
            "selling_expense": "54",
            "non_operating_expense": "55"
        }
    }'::JSONB;
BEGIN
    -- Determine code prefix
    IF p_prefix IS NOT NULL THEN
        code_prefix := p_prefix;
    ELSE
        code_prefix := code_patterns->p_type->>p_sub_type;
        IF code_prefix IS NULL THEN
            code_prefix := '99'; -- Default fallback
        END IF;
    END IF;

    -- Find next available number
    SELECT COALESCE(
        MAX(
            CASE
                WHEN code ~ ('^' || code_prefix || '[0-9]+$')
                THEN substring(code from (length(code_prefix) + 1))::INTEGER
                ELSE 0
            END
        ) + 1,
        1
    ) INTO next_number
    FROM accounts
    WHERE company_id = p_company_id
    AND code LIKE code_prefix || '%';

    -- Generate next code
    next_code := code_prefix || LPAD(next_number::TEXT, 3, '0');

    -- Ensure uniqueness (in case of concurrent operations)
    WHILE EXISTS (
        SELECT 1 FROM accounts
        WHERE company_id = p_company_id AND code = next_code
    ) LOOP
        next_number := next_number + 1;
        next_code := code_prefix || LPAD(next_number::TEXT, 3, '0');
    END LOOP;

    RETURN next_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check account code availability
CREATE OR REPLACE FUNCTION is_account_code_available(
    p_company_id UUID,
    p_code VARCHAR(10),
    p_exclude_account_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM accounts
        WHERE company_id = p_company_id
        AND code = p_code
        AND (p_exclude_account_id IS NULL OR id != p_exclude_account_id)
        AND status != 'archived'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get account balance as of specific date
CREATE OR REPLACE FUNCTION get_account_balance_as_of_date(
    p_account_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    net_balance DECIMAL(15,2)
) AS $$
BEGIN
    -- This function will be fully implemented when transaction_entries table exists
    -- For now, return current balance
    RETURN QUERY
    SELECT
        CASE WHEN a.current_balance >= 0 THEN a.current_balance ELSE 0::DECIMAL(15,2) END,
        CASE WHEN a.current_balance < 0 THEN ABS(a.current_balance) ELSE 0::DECIMAL(15,2) END,
        a.current_balance
    FROM accounts a
    WHERE a.id = p_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate account type and subtype compatibility
CREATE OR REPLACE FUNCTION validate_account_type_subtype(
    p_type VARCHAR(20),
    p_sub_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_combinations JSONB := '{
        "asset": ["current_asset", "non_current_asset", "fixed_asset", "intangible_asset"],
        "liability": ["current_liability", "non_current_liability", "long_term_liability"],
        "equity": ["owners_equity", "retained_earnings", "capital"],
        "revenue": ["operating_revenue", "non_operating_revenue", "other_income"],
        "expense": ["cost_of_goods_sold", "operating_expense", "administrative_expense", "selling_expense", "non_operating_expense"]
    }'::JSONB;
BEGIN
    RETURN (valid_combinations->p_type) ? p_sub_type;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- SEED DATA FOR COMMON ACCOUNT STRUCTURE
-- ==============================================

-- Function to create default chart of accounts for a company
CREATE OR REPLACE FUNCTION create_default_chart_of_accounts(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Only create if no accounts exist for this company
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE company_id = p_company_id) THEN

        -- ASSETS
        INSERT INTO accounts (company_id, code, name, type, sub_type, is_control_account, allow_direct_transactions) VALUES
        (p_company_id, '1000', 'Assets', 'asset', 'current_asset', TRUE, FALSE),
        (p_company_id, '1100', 'Current Assets', 'asset', 'current_asset', TRUE, FALSE),
        (p_company_id, '1110', 'Cash and Bank', 'asset', 'current_asset', FALSE, TRUE),
        (p_company_id, '1120', 'Accounts Receivable', 'asset', 'current_asset', FALSE, TRUE),
        (p_company_id, '1130', 'Inventory', 'asset', 'current_asset', FALSE, TRUE),
        (p_company_id, '1200', 'Non-Current Assets', 'asset', 'non_current_asset', TRUE, FALSE),
        (p_company_id, '1210', 'Fixed Assets', 'asset', 'fixed_asset', TRUE, FALSE),
        (p_company_id, '1211', 'Equipment', 'asset', 'fixed_asset', FALSE, TRUE),
        (p_company_id, '1212', 'Furniture & Fixtures', 'asset', 'fixed_asset', FALSE, TRUE);

        -- LIABILITIES
        INSERT INTO accounts (company_id, code, name, type, sub_type, is_control_account, allow_direct_transactions) VALUES
        (p_company_id, '2000', 'Liabilities', 'liability', 'current_liability', TRUE, FALSE),
        (p_company_id, '2100', 'Current Liabilities', 'liability', 'current_liability', TRUE, FALSE),
        (p_company_id, '2110', 'Accounts Payable', 'liability', 'current_liability', FALSE, TRUE),
        (p_company_id, '2120', 'Accrued Expenses', 'liability', 'current_liability', FALSE, TRUE),
        (p_company_id, '2200', 'Long-term Liabilities', 'liability', 'long_term_liability', TRUE, FALSE),
        (p_company_id, '2210', 'Long-term Debt', 'liability', 'long_term_liability', FALSE, TRUE);

        -- EQUITY
        INSERT INTO accounts (company_id, code, name, type, sub_type, is_control_account, allow_direct_transactions) VALUES
        (p_company_id, '3000', 'Equity', 'equity', 'owners_equity', TRUE, FALSE),
        (p_company_id, '3100', 'Owners Equity', 'equity', 'owners_equity', FALSE, TRUE),
        (p_company_id, '3200', 'Retained Earnings', 'equity', 'retained_earnings', FALSE, TRUE);

        -- REVENUE
        INSERT INTO accounts (company_id, code, name, type, sub_type, is_control_account, allow_direct_transactions) VALUES
        (p_company_id, '4000', 'Revenue', 'revenue', 'operating_revenue', TRUE, FALSE),
        (p_company_id, '4100', 'Sales Revenue', 'revenue', 'operating_revenue', FALSE, TRUE),
        (p_company_id, '4200', 'Service Revenue', 'revenue', 'operating_revenue', FALSE, TRUE),
        (p_company_id, '4300', 'Other Income', 'revenue', 'other_income', FALSE, TRUE);

        -- EXPENSES
        INSERT INTO accounts (company_id, code, name, type, sub_type, is_control_account, allow_direct_transactions) VALUES
        (p_company_id, '5000', 'Expenses', 'expense', 'operating_expense', TRUE, FALSE),
        (p_company_id, '5100', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', FALSE, TRUE),
        (p_company_id, '5200', 'Operating Expenses', 'expense', 'operating_expense', TRUE, FALSE),
        (p_company_id, '5210', 'Salaries and Wages', 'expense', 'operating_expense', FALSE, TRUE),
        (p_company_id, '5220', 'Rent Expense', 'expense', 'operating_expense', FALSE, TRUE),
        (p_company_id, '5230', 'Utilities Expense', 'expense', 'operating_expense', FALSE, TRUE),
        (p_company_id, '5240', 'Office Supplies', 'expense', 'administrative_expense', FALSE, TRUE);

        -- Update hierarchy levels
        UPDATE accounts SET level = 0 WHERE company_id = p_company_id AND code IN ('1000', '2000', '3000', '4000', '5000');
        UPDATE accounts SET level = 1, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1000')
        WHERE company_id = p_company_id AND code IN ('1100', '1200');
        UPDATE accounts SET level = 1, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2000')
        WHERE company_id = p_company_id AND code IN ('2100', '2200');
        UPDATE accounts SET level = 2, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1100')
        WHERE company_id = p_company_id AND code IN ('1110', '1120', '1130');
        UPDATE accounts SET level = 2, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1200')
        WHERE company_id = p_company_id AND code = '1210';
        UPDATE accounts SET level = 3, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '1210')
        WHERE company_id = p_company_id AND code IN ('1211', '1212');
        UPDATE accounts SET level = 2, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2100')
        WHERE company_id = p_company_id AND code IN ('2110', '2120');
        UPDATE accounts SET level = 2, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '2200')
        WHERE company_id = p_company_id AND code = '2210';
        UPDATE accounts SET level = 1, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '3000')
        WHERE company_id = p_company_id AND code IN ('3100', '3200');
        UPDATE accounts SET level = 1, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '4000')
        WHERE company_id = p_company_id AND code IN ('4100', '4200', '4300');
        UPDATE accounts SET level = 1, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '5000')
        WHERE company_id = p_company_id AND code IN ('5100', '5200');
        UPDATE accounts SET level = 2, parent_account_id = (SELECT id FROM accounts WHERE company_id = p_company_id AND code = '5200')
        WHERE company_id = p_company_id AND code IN ('5210', '5220', '5230', '5240');

    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON accounts TO authenticated;
GRANT ALL ON account_hierarchy_view TO authenticated;
GRANT ALL ON account_type_summary TO authenticated;
