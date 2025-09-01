-- Create transaction entries table
CREATE TABLE IF NOT EXISTS public.transaction_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    amount DECIMAL(15,2) NOT NULL, -- Net amount (debit - credit)
    description TEXT,
    reference VARCHAR(100),
    tax_code VARCHAR(20),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    project_id UUID, -- For future project tracking
    cost_center_id VARCHAR(50),
    department_id VARCHAR(50),
    line_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure that entries have either debit or credit, but not both
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_entries_transaction_id ON public.transaction_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_account_id ON public.transaction_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_amount ON public.transaction_entries(amount);
CREATE INDEX IF NOT EXISTS idx_transaction_entries_line_number ON public.transaction_entries(transaction_id, line_number);

-- Create composite index for transaction balancing queries
CREATE INDEX IF NOT EXISTS idx_transaction_entries_balancing
ON public.transaction_entries(transaction_id, debit_amount, credit_amount);

-- Add RLS (Row Level Security)
ALTER TABLE public.transaction_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view transaction entries from their company" ON public.transaction_entries
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM public.transactions t
            WHERE t.company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert transaction entries for their company" ON public.transaction_entries
    FOR INSERT WITH CHECK (
        transaction_id IN (
            SELECT id FROM public.transactions t
            WHERE t.company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update transaction entries from their company" ON public.transaction_entries
    FOR UPDATE USING (
        transaction_id IN (
            SELECT id FROM public.transactions t
            WHERE t.company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete transaction entries from their company" ON public.transaction_entries
    FOR DELETE USING (
        transaction_id IN (
            SELECT id FROM public.transactions t
            WHERE t.company_id IN (
                SELECT company_id FROM public.user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_transaction_entries_updated_at
    BEFORE UPDATE ON public.transaction_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate double-entry bookkeeping
CREATE OR REPLACE FUNCTION validate_double_entry_bookkeeping()
RETURNS TRIGGER AS $$
DECLARE
    total_debits DECIMAL(15,2);
    total_credits DECIMAL(15,2);
BEGIN
    -- Calculate totals for the transaction
    SELECT
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM public.transaction_entries
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);

    -- Check if debits equal credits
    IF total_debits != total_credits THEN
        RAISE EXCEPTION 'Transaction entries must balance: debits (%) must equal credits (%)',
            total_debits, total_credits;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate balanced entries
-- Note: This trigger is disabled by default to allow API-level validation
-- Uncomment to enable database-level validation
-- CREATE TRIGGER validate_transaction_balance
--     AFTER INSERT OR UPDATE OR DELETE ON public.transaction_entries
--     FOR EACH ROW EXECUTE FUNCTION validate_double_entry_bookkeeping();
