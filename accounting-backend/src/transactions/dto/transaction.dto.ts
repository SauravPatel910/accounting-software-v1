// prettier-ignore
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsBoolean, Min, Max, ArrayMinSize, IsObject, IsUUID, Matches, Length, IsDateString, IsIn } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
// prettier-ignore
import { TransactionType, TransactionStatus, ApprovalStatus, ReconciliationStatus, BatchStatus, ValidationError, ValidationWarning } from "../interfaces/transaction.interface";
import type { RecurringRule } from "../interfaces/transaction.interface";
import { UserRole } from "../../auth/types/auth.types";

// Response DTOs - Define these first to avoid forward reference issues
export class ValidationErrorDto implements ValidationError {
  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  value?: any;
}

export class ValidationWarningDto implements ValidationWarning {
  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  value?: any;
}

export class TransactionValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty({ type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty({ type: [ValidationWarningDto] })
  warnings: ValidationWarningDto[];
}

export class TransactionEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  accountCode?: string;

  @ApiProperty()
  accountName?: string;

  @ApiProperty()
  debitAmount: number;

  @ApiProperty()
  creditAmount: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  reference?: string;

  @ApiProperty()
  taxCode?: string;

  @ApiProperty()
  taxAmount?: number;

  @ApiProperty()
  projectId?: string;

  @ApiProperty()
  costCenterId?: string;

  @ApiProperty()
  departmentId?: string;

  @ApiProperty()
  lineNumber: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionNumber: string;

  @ApiProperty()
  reference?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty()
  postingDate: string;

  @ApiProperty({ enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  exchangeRate: number;

  @ApiProperty()
  sourceDocumentType?: string;

  @ApiProperty()
  sourceDocumentId?: string;

  @ApiProperty()
  memo?: string;

  @ApiProperty()
  tags?: string[];

  @ApiProperty()
  isRecurring: boolean;

  @ApiProperty()
  recurringRule?: RecurringRule;

  @ApiProperty({ enum: ApprovalStatus })
  approvalStatus: ApprovalStatus;

  @ApiProperty()
  approvedBy?: string;

  @ApiProperty()
  approvedAt?: string;

  @ApiProperty()
  postedBy: string;

  @ApiProperty()
  postedAt?: string;

  @ApiProperty({ enum: ReconciliationStatus })
  reconciliationStatus: ReconciliationStatus;

  @ApiProperty()
  reconciledAt?: string;

  @ApiProperty()
  reconciledBy?: string;

  @ApiProperty()
  fiscalYear: number;

  @ApiProperty()
  fiscalPeriod: number;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [TransactionEntryResponseDto] })
  entries: TransactionEntryResponseDto[];

  @ApiProperty({ type: TransactionValidationResultDto })
  validationResult?: TransactionValidationResultDto;
}

// Entry DTOs
export class CreateTransactionEntryDto {
  @ApiProperty({ description: "Account ID for the entry" })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: "Debit amount", example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debitAmount: number;

  @ApiProperty({ description: "Credit amount", example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditAmount: number;

  @ApiPropertyOptional({ description: "Entry description" })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: "Entry reference" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: "Tax code" })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  taxCode?: string;

  @ApiPropertyOptional({ description: "Tax amount" })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: "Project ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: "Cost center ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: "Department ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: "Line number for ordering", example: 1 })
  @IsNumber()
  @Min(1)
  lineNumber: number;
}

export class UpdateTransactionEntryDto {
  @ApiPropertyOptional({ description: "Entry ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: "Account ID for the entry" })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: "Debit amount", example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debitAmount: number;

  @ApiProperty({ description: "Credit amount", example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditAmount: number;

  @ApiPropertyOptional({ description: "Entry description" })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: "Entry reference" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: "Tax code" })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  taxCode?: string;

  @ApiPropertyOptional({ description: "Tax amount" })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: "Project ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: "Cost center ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: "Department ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: "Line number for ordering", example: 1 })
  @IsNumber()
  @Min(1)
  lineNumber: number;
}

// Transaction DTOs
export class CreateTransactionDto {
  @ApiPropertyOptional({ description: "Transaction reference number" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  reference?: string;

  @ApiProperty({ description: "Transaction description" })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: "Transaction date (ISO string)",
    example: "2024-01-15",
  })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: "Posting date (ISO string)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  postingDate?: string;

  @ApiProperty({ enum: TransactionType, description: "Type of transaction" })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ description: "Currency code (ISO 4217)", example: "INR" })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: "Currency must be a 3-letter ISO code" })
  currency: string;

  @ApiPropertyOptional({
    description: "Exchange rate to base currency",
    example: 1.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "Source document type" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  sourceDocumentType?: string;

  @ApiPropertyOptional({ description: "Source document ID" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sourceDocumentId?: string;

  @ApiPropertyOptional({ description: "Transaction memo" })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  memo?: string;

  @ApiPropertyOptional({ description: "Transaction tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Is this a recurring transaction",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: "Recurring rule if applicable" })
  @IsOptional()
  @IsObject()
  recurringRule?: RecurringRule;

  @ApiProperty({
    type: [CreateTransactionEntryDto],
    description: "Transaction entries",
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: "At least 2 entries required for double-entry bookkeeping",
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionEntryDto)
  entries: CreateTransactionEntryDto[];
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: "Transaction reference number" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  reference?: string;

  @ApiPropertyOptional({ description: "Transaction description" })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: "Transaction date (ISO string)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: "Posting date (ISO string)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  postingDate?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: "Type of transaction",
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: "Currency code (ISO 4217)",
    example: "INR",
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: "Currency must be a 3-letter ISO code" })
  currency?: string;

  @ApiPropertyOptional({
    description: "Exchange rate to base currency",
    example: 1.0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "Source document type" })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  sourceDocumentType?: string;

  @ApiPropertyOptional({ description: "Source document ID" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sourceDocumentId?: string;

  @ApiPropertyOptional({ description: "Transaction memo" })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  memo?: string;

  @ApiPropertyOptional({ description: "Transaction tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Is this a recurring transaction" })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: "Recurring rule if applicable" })
  @IsOptional()
  @IsObject()
  recurringRule?: RecurringRule;

  @ApiPropertyOptional({
    type: [UpdateTransactionEntryDto],
    description: "Transaction entries",
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, {
    message: "At least 2 entries required for double-entry bookkeeping",
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateTransactionEntryDto)
  entries?: UpdateTransactionEntryDto[];
}

// Query DTOs
export class TransactionQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: "Sort field",
    example: "transactionDate",
  })
  @IsOptional()
  @IsString()
  @IsIn(["transactionDate", "createdAt", "transactionNumber", "totalAmount"])
  sortBy?: string = "transactionDate";

  @ApiPropertyOptional({ description: "Sort order", enum: ["ASC", "DESC"] })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @ApiPropertyOptional({ description: "Search term" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: "Filter by transaction type",
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: "Filter by status",
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: "Filter by start date (ISO string)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Filter by end date (ISO string)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Filter by minimum amount" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ description: "Filter by maximum amount" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ description: "Filter by account ID" })
  @IsOptional()
  @IsString()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: "Filter by currency", example: "INR" })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: "Filter by tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    enum: ApprovalStatus,
    description: "Filter by approval status",
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({
    enum: ReconciliationStatus,
    description: "Filter by reconciliation status",
  })
  @IsOptional()
  @IsEnum(ReconciliationStatus)
  reconciliationStatus?: ReconciliationStatus;

  @ApiPropertyOptional({ description: "Filter by fiscal year" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fiscalYear?: number;

  @ApiPropertyOptional({ description: "Filter by fiscal period" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  fiscalPeriod?: number;

  @ApiPropertyOptional({
    description: "Include only unposted transactions",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  unpostedOnly?: boolean;

  @ApiPropertyOptional({
    description: "Include only posted transactions",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  postedOnly?: boolean;
}

// Batch processing DTOs
export class BatchTransactionDto {
  @ApiProperty({ description: "Batch description" })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    type: [CreateTransactionDto],
    description: "Transactions to process",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionDto)
  transactions: CreateTransactionDto[];

  @ApiPropertyOptional({
    description: "Process even if some transactions fail",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean = false;

  @ApiPropertyOptional({
    description: "Validate only without processing",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean = false;
}

export class BatchProcessingResultDto {
  @ApiProperty()
  batchId: string;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  successfulTransactions: number;

  @ApiProperty()
  failedTransactions: number;

  @ApiProperty()
  processingStartTime: Date;

  @ApiProperty()
  processingEndTime: Date;

  @ApiProperty()
  processingTimeMs: number;

  @ApiProperty({ type: [TransactionResponseDto] })
  processedTransactions: TransactionResponseDto[];

  @ApiProperty({ type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty()
  status: "COMPLETED" | "PARTIAL" | "FAILED";
}

// Reconciliation DTOs
export class ReconciliationDto {
  @ApiProperty({ description: "Account ID for reconciliation" })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: "Reconciliation date (ISO string)",
    example: "2024-01-31",
  })
  @IsDateString()
  reconciliationDate: string;

  @ApiProperty({ description: "Statement ending balance" })
  @IsNumber({ maxDecimalPlaces: 2 })
  statementBalance: number;

  @ApiProperty({ description: "Transaction IDs to reconcile", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsUUID(undefined, { each: true })
  transactionIds: string[];

  @ApiPropertyOptional({ description: "Reconciliation notes" })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}

// Audit and Report DTOs
export class TransactionAuditLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  changes: any;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;
}

export class TransactionReportDto {
  @ApiPropertyOptional({
    description: "Report start date (ISO string)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Report end date (ISO string)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Group by field",
    enum: ["account", "type", "date", "currency"],
  })
  @IsOptional()
  @IsEnum(["account", "type", "date", "currency"])
  groupBy?: string;

  @ApiPropertyOptional({
    description: "Include only specific transaction types",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  transactionTypes?: TransactionType[];

  @ApiPropertyOptional({
    description: "Include only specific accounts",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  accountIds?: string[];

  @ApiPropertyOptional({
    description: "Report format",
    enum: ["JSON", "CSV", "PDF"],
  })
  @IsOptional()
  @IsEnum(["JSON", "CSV", "PDF"])
  format?: string = "JSON";
}

// Permission-based DTOs
export class UserTransactionPermissionsDto {
  @ApiProperty()
  canCreate: boolean;

  @ApiProperty()
  canUpdate: boolean;

  @ApiProperty()
  canDelete: boolean;

  @ApiProperty()
  canPost: boolean;

  @ApiProperty()
  canApprove: boolean;

  @ApiProperty()
  canReconcile: boolean;

  @ApiProperty()
  canViewAll: boolean;

  @ApiProperty()
  canExport: boolean;

  @ApiProperty({ type: [String] })
  allowedTransactionTypes: TransactionType[];

  @ApiProperty()
  maxTransactionAmount?: number;

  @ApiProperty({ enum: UserRole })
  userRole: UserRole;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  totalDebits?: number;

  @ApiPropertyOptional()
  totalCredits?: number;

  @ApiPropertyOptional()
  balanceCheck?: boolean;
}

export class CreateBatchTransactionDto {
  @ApiProperty({ description: "Batch name" })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: "Batch description" })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiProperty({ type: [CreateTransactionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionDto)
  transactions: CreateTransactionDto[];

  @ApiPropertyOptional({ description: "Auto-post after processing" })
  @IsOptional()
  @IsBoolean()
  autoPost?: boolean;
}

export class BatchTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ enum: BatchStatus })
  status: BatchStatus;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  processedCount: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [TransactionResponseDto] })
  processedTransactions: TransactionResponseDto[];

  @ApiProperty()
  errors: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReconciliationMatchDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  matchConfidence: number;

  @ApiProperty()
  statementAmount: number;

  @ApiProperty()
  transactionAmount: number;

  @ApiProperty()
  dateDifference: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  suggestedMatch: boolean;
}

export class ReconciliationResultDto {
  @ApiProperty()
  reconciliationId: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty({ type: [TransactionResponseDto] })
  reconciledTransactions: TransactionResponseDto[];

  @ApiProperty()
  totalReconciledAmount: number;

  @ApiProperty()
  reconciledCount: number;

  @ApiProperty()
  unreconciledCount: number;

  @ApiProperty()
  reconciliationDate: Date;

  @ApiProperty()
  reconciledBy: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: string;
}

export class TransactionTotalsDto {
  @ApiProperty()
  totalDebits: number;

  @ApiProperty()
  totalCredits: number;

  @ApiProperty()
  balanceCheck: boolean;

  @ApiProperty()
  transactionCount: number;
}
