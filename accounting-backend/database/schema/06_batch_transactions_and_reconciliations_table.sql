-- Create batch transactions table for bulk processing
CREATE TABLE IF NOT EXISTS public.batch_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_number VARCHAR(50) NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    description TEXT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'journal_entry', 'invoice', 'payment', 'receipt', 'adjustment',
        'transfer', 'depreciation', 'accrual', 'reversal', 'opening_balance', 'closing_entry'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    total_transactions INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_transactions_company_id ON public.batch_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_status ON public.batch_transactions(status);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_type ON public.batch_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_created_by ON public.batch_transactions(created_by);

-- Create unique constraint for batch number per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_transactions_number_company
ON public.batch_transactions(batch_number, company_id);

-- Add RLS (Row Level Security)
ALTER TABLE public.batch_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view batch transactions from their company" ON public.batch_transactions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert batch transactions for their company" ON public.batch_transactions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update batch transactions from their company" ON public.batch_transactions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete batch transactions from their company" ON public.batch_transactions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_batch_transactions_updated_at
    BEFORE UPDATE ON public.batch_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create reconciliations table for transaction reconciliation
CREATE TABLE IF NOT EXISTS public.reconciliations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    statement_reference VARCHAR(100),
    reconciled_transactions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'completed', 'reviewed', 'approved'
    )),
    notes TEXT,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reconciliations
CREATE INDEX IF NOT EXISTS idx_reconciliations_account_id ON public.reconciliations(account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_company_id ON public.reconciliations(company_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_date ON public.reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON public.reconciliations(status);

-- Add RLS for reconciliations
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reconciliations
CREATE POLICY "Users can view reconciliations from their company" ON public.reconciliations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reconciliations for their company" ON public.reconciliations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reconciliations from their company" ON public.reconciliations
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reconciliations from their company" ON public.reconciliations
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Add trigger for reconciliations updated_at
CREATE TRIGGER update_reconciliations_updated_at
    BEFORE UPDATE ON public.reconciliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
