export enum InvoiceStatus {
  DRAFT = "draft",
  PENDING = "pending",
  SENT = "sent",
  VIEWED = "viewed",
  PARTIAL = "partial",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum InvoiceType {
  STANDARD = "standard",
  RECURRING = "recurring",
  CREDIT_NOTE = "credit_note",
  DEBIT_NOTE = "debit_note",
  ESTIMATE = "estimate",
  QUOTE = "quote",
}

export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
  OVERDUE = "overdue",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  CHECK = "check",
  BANK_TRANSFER = "bank_transfer",
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  STRIPE = "stripe",
  OTHER = "other",
}

export interface DatabaseInvoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  customer_phone?: string;
  issue_date: string;
  due_date: string;
  payment_terms?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  exchange_rate: number;
  notes?: string;
  terms_conditions?: string;
  footer_text?: string;
  is_recurring: boolean;
  recurring_rule?: RecurringRule;
  next_invoice_date?: string;
  parent_invoice_id?: string;
  reference_number?: string;
  purchase_order_number?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  cancelled_at?: string;
}

export interface DatabaseInvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  item_description?: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  account_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DatabasePayment {
  id: string;
  invoice_id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  transaction_id?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringRule {
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  interval: number;
  end_type: "never" | "after_count" | "on_date";
  end_count?: number;
  end_date?: string;
  days_of_week?: number[];
  day_of_month?: number;
  month_of_year?: number;
}

export interface InvoiceWithItems extends DatabaseInvoice {
  items: DatabaseInvoiceItem[];
  payments: DatabasePayment[];
}

export interface InvoiceResponseDto {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  customer: {
    id: string;
    name: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  dates: {
    issueDate: string;
    dueDate: string;
    sentAt?: string;
    viewedAt?: string;
    paidAt?: string;
  };
  amounts: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  };
  currency: string;
  exchangeRate: number;
  paymentTerms?: string;
  notes?: string;
  termsConditions?: string;
  footerText?: string;
  isRecurring: boolean;
  recurringRule?: RecurringRule;
  referenceNumber?: string;
  purchaseOrderNumber?: string;
  items: InvoiceItemResponseDto[];
  payments: PaymentResponseDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItemResponseDto {
  id: string;
  itemName: string;
  itemDescription?: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  accountId?: string;
  sortOrder: number;
}

export interface PaymentResponseDto {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  transactionId?: string;
  createdBy: string;
  createdAt: string;
}
