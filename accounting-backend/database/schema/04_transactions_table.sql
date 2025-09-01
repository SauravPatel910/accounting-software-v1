-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'journal_entry', 'invoice', 'payment', 'receipt', 'adjustment',
        'transfer', 'depreciation', 'accrual', 'reversal', 'opening_balance', 'closing_entry'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending', 'posted', 'cancelled', 'reversed', 'voided'
    )),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1.0,
    source_document_type VARCHAR(50),
    source_document_id UUID,
    memo TEXT,
    tags TEXT[], -- PostgreSQL array for tags
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_rule JSONB, -- Store recurring rule as JSON
    approval_status VARCHAR(20) NOT NULL DEFAULT 'not_required' CHECK (approval_status IN (
        'not_required', 'pending', 'approved', 'rejected'
    )),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID NOT NULL REFERENCES auth.users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'unreconciled' CHECK (reconciliation_status IN (
        'unreconciled', 'partial', 'reconciled', 'disputed'
    )),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES auth.users(id),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_number ON public.transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_posted_by ON public.transactions(posted_by);
CREATE INDEX IF NOT EXISTS idx_transactions_fiscal ON public.transactions(fiscal_year, fiscal_period);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciliation ON public.transactions(reconciliation_status);

-- Create unique constraint for transaction number per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_number_company
ON public.transactions(transaction_number, company_id);

-- Add RLS (Row Level Security)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view transactions from their company" ON public.transactions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transactions for their company" ON public.transactions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transactions from their company" ON public.transactions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transactions from their company" ON public.transactions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
