export interface DatabaseAccount {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  sub_type?: string;
  parent_account_id?: string;
  level: number;
  is_control_account: boolean;
  allow_direct_transactions: boolean;
  currency: string;
  opening_balance: number;
  opening_balance_date?: string;
  current_balance: number;
  tax_code?: string;
  is_taxable: boolean;
  is_depreciable: boolean;
  depreciation_rate?: number;
  depreciation_method?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionEntry {
  id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  created_at: string;
}
