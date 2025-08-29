-- Create useful views and functions for transaction reporting

-- View for transaction balances by account
CREATE OR REPLACE VIEW public.transaction_balances AS
SELECT
    a.id as account_id,
    a.code as account_code,
    a.name as account_name,
    a.type as account_type,
    a.company_id,
    COALESCE(SUM(te.debit_amount), 0) as total_debits,
    COALESCE(SUM(te.credit_amount), 0) as total_credits,
    COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) as net_balance
FROM public.accounts a
LEFT JOIN public.transaction_entries te ON a.id = te.account_id
LEFT JOIN public.transactions t ON te.transaction_id = t.id
WHERE t.status = 'posted' OR t.status IS NULL
GROUP BY a.id, a.code, a.name, a.type, a.company_id;

-- View for trial balance
CREATE OR REPLACE VIEW public.trial_balance AS
SELECT
    tb.*,
    CASE
        WHEN tb.net_balance > 0 THEN tb.net_balance
        ELSE 0
    END as debit_balance,
    CASE
        WHEN tb.net_balance < 0 THEN ABS(tb.net_balance)
        ELSE 0
    END as credit_balance
FROM public.transaction_balances tb
ORDER BY tb.account_code;

-- Function to get account balance as of a specific date
CREATE OR REPLACE FUNCTION get_account_balance_as_of_date(
    p_account_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    account_id UUID,
    total_debits DECIMAL(15,2),
    total_credits DECIMAL(15,2),
    net_balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_account_id,
        COALESCE(SUM(te.debit_amount), 0) as total_debits,
        COALESCE(SUM(te.credit_amount), 0) as total_credits,
        COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) as net_balance
    FROM public.transaction_entries te
    INNER JOIN public.transactions t ON te.transaction_id = t.id
    WHERE te.account_id = p_account_id
      AND t.transaction_date <= p_as_of_date
      AND t.status = 'posted';
END;
$$ LANGUAGE plpgsql;

-- Function to get trial balance as of a specific date
CREATE OR REPLACE FUNCTION get_trial_balance_as_of_date(
    p_company_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    account_id UUID,
    account_code VARCHAR,
    account_name VARCHAR,
    account_type VARCHAR,
    total_debits DECIMAL(15,2),
    total_credits DECIMAL(15,2),
    net_balance DECIMAL(15,2),
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(te.debit_amount), 0) as total_debits,
        COALESCE(SUM(te.credit_amount), 0) as total_credits,
        COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) as net_balance,
        CASE
            WHEN COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) > 0
            THEN COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0)
            ELSE 0
        END as debit_balance,
        CASE
            WHEN COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) < 0
            THEN ABS(COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0))
            ELSE 0
        END as credit_balance
    FROM public.accounts a
    LEFT JOIN public.transaction_entries te ON a.id = te.account_id
    LEFT JOIN public.transactions t ON te.transaction_id = t.id
        AND t.transaction_date <= p_as_of_date
        AND t.status = 'posted'
    WHERE a.company_id = p_company_id
    GROUP BY a.id, a.code, a.name, a.type
    ORDER BY a.code;
END;
$$ LANGUAGE plpgsql;

-- Function to get account activity for a date range
CREATE OR REPLACE FUNCTION get_account_activity(
    p_account_id UUID,
    p_date_from DATE,
    p_date_to DATE
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_number VARCHAR,
    transaction_date DATE,
    description TEXT,
    debit_amount DECIMAL(15,2),
    credit_amount DECIMAL(15,2),
    amount DECIMAL(15,2),
    running_balance DECIMAL(15,2)
) AS $$
DECLARE
    running_total DECIMAL(15,2) := 0;
    rec RECORD;
BEGIN
    -- Get starting balance
    SELECT COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0)
    INTO running_total
    FROM public.transaction_entries te
    INNER JOIN public.transactions t ON te.transaction_id = t.id
    WHERE te.account_id = p_account_id
      AND t.transaction_date < p_date_from
      AND t.status = 'posted';

    -- Return activity with running balance
    FOR rec IN (
        SELECT
            t.id,
            t.transaction_number,
            t.transaction_date,
            COALESCE(te.description, t.description) as description,
            te.debit_amount,
            te.credit_amount,
            te.amount
        FROM public.transaction_entries te
        INNER JOIN public.transactions t ON te.transaction_id = t.id
        WHERE te.account_id = p_account_id
          AND t.transaction_date BETWEEN p_date_from AND p_date_to
          AND t.status = 'posted'
        ORDER BY t.transaction_date, t.created_at
    ) LOOP
        running_total := running_total + rec.amount;

        RETURN QUERY SELECT
            rec.id,
            rec.transaction_number,
            rec.transaction_date,
            rec.description,
            rec.debit_amount,
            rec.credit_amount,
            rec.amount,
            running_total;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate transaction balance
CREATE OR REPLACE FUNCTION validate_transaction_balance(p_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_debits DECIMAL(15,2);
    total_credits DECIMAL(15,2);
BEGIN
    SELECT
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM public.transaction_entries
    WHERE transaction_id = p_transaction_id;

    RETURN total_debits = total_credits;
END;
$$ LANGUAGE plpgsql;

-- Function to get unbalanced transactions
CREATE OR REPLACE FUNCTION get_unbalanced_transactions(p_company_id UUID)
RETURNS TABLE (
    transaction_id UUID,
    transaction_number VARCHAR,
    total_debits DECIMAL(15,2),
    total_credits DECIMAL(15,2),
    difference DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.transaction_number,
        COALESCE(SUM(te.debit_amount), 0) as total_debits,
        COALESCE(SUM(te.credit_amount), 0) as total_credits,
        COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) as difference
    FROM public.transactions t
    LEFT JOIN public.transaction_entries te ON t.id = te.transaction_id
    WHERE t.company_id = p_company_id
    GROUP BY t.id, t.transaction_number
    HAVING COALESCE(SUM(te.debit_amount), 0) != COALESCE(SUM(te.credit_amount), 0)
    ORDER BY t.transaction_number;
END;
$$ LANGUAGE plpgsql;

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_balances_company_account
ON public.transaction_entries(account_id)
WHERE EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id AND t.status = 'posted'
);

-- Create materialized view for faster reporting (optional)
-- This can be refreshed periodically for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.account_balances_materialized AS
SELECT * FROM public.transaction_balances;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balances_mat_account_company
ON public.account_balances_materialized(account_id, company_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_account_balances()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.account_balances_materialized;
END;
$$ LANGUAGE plpgsql;
