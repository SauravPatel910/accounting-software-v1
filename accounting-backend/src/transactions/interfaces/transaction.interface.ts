export interface DatabaseTransaction {
  id: string;
  transaction_number: string;
  reference: string;
  description: string;
  transaction_date: string;
  posting_date: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  total_amount: number;
  currency: string;
  exchange_rate: number;
  source_document_type?: string;
  source_document_id?: string;
  memo?: string;
  tags?: string[];
  is_recurring: boolean;
  recurring_rule?: RecurringRule;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  posted_by: string;
  posted_at?: string;
  reconciliation_status: ReconciliationStatus;
  reconciled_at?: string;
  reconciled_by?: string;
  fiscal_year: number;
  fiscal_period: number;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTransactionEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  amount: number;
  description?: string;
  reference?: string;
  tax_code?: string;
  tax_amount?: number;
  project_id?: string;
  cost_center_id?: string;
  department_id?: string;
  line_number: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBatchTransaction {
  id: string;
  batch_number: string;
  batch_name: string;
  description?: string;
  transaction_type: TransactionType;
  status: BatchStatus;
  total_transactions: number;
  total_amount: number;
  currency: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  error_message?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface RecurringRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  occurrences?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
}

export interface ReconciliationMatch {
  transactionId: string;
  bankStatementId?: string;
  matchType: MatchType;
  confidence: number;
  matchedAmount: number;
  dateDifference: number;
  descriptionSimilarity: number;
}

export enum TransactionType {
  JOURNAL_ENTRY = "journal_entry",
  INVOICE = "invoice",
  PAYMENT = "payment",
  RECEIPT = "receipt",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
  DEPRECIATION = "depreciation",
  ACCRUAL = "accrual",
  REVERSAL = "reversal",
  OPENING_BALANCE = "opening_balance",
  CLOSING_ENTRY = "closing_entry",
}

export enum TransactionStatus {
  DRAFT = "draft",
  PENDING = "pending",
  POSTED = "posted",
  CANCELLED = "cancelled",
  REVERSED = "reversed",
  VOIDED = "voided",
}

export enum ApprovalStatus {
  NOT_REQUIRED = "not_required",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum ReconciliationStatus {
  UNRECONCILED = "unreconciled",
  PARTIAL = "partial",
  RECONCILED = "reconciled",
  DISPUTED = "disputed",
}

export enum BatchStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RecurrenceFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
}

export enum MatchType {
  EXACT = "exact",
  AMOUNT_ONLY = "amount_only",
  DATE_ONLY = "date_only",
  FUZZY = "fuzzy",
  MANUAL = "manual",
}

export interface TransactionTotals {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  currency: string;
}

export interface TransactionSummary {
  totalCount: number;
  totalAmount: number;
  byStatus: Record<TransactionStatus, number>;
  byType: Record<TransactionType, number>;
  byPeriod: { period: string; count: number; amount: number }[];
}
