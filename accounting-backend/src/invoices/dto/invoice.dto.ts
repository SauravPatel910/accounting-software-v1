// prettier-ignore
import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max, IsUUID, IsNotEmpty, Length, IsIn } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
// prettier-ignore
import { InvoiceType, InvoiceStatus, PaymentMethod } from "../interfaces/invoice.interface";
import type { RecurringRule } from "../interfaces/invoice.interface";

export class CreateInvoiceItemDto {
  @ApiProperty({ description: "Item name" })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: "Item description" })
  @IsString()
  @IsOptional()
  itemDescription?: string;

  @ApiPropertyOptional({ description: "Item code/SKU" })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiProperty({ description: "Quantity", minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: "Unit price", minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: "Tax rate percentage",
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number = 0;

  @ApiPropertyOptional({
    description: "Discount rate percentage",
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  discountRate?: number = 0;

  @ApiPropertyOptional({ description: "Associated account ID" })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: "Sort order", minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number = 0;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: InvoiceType, description: "Type of invoice" })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiProperty({ description: "Customer ID" })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: "Customer name" })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ description: "Customer email" })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ description: "Customer address" })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiPropertyOptional({ description: "Customer phone" })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ description: "Issue date (ISO string)" })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: "Due date (ISO string)" })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: "Payment terms" })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: "Currency code", default: "USD" })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string = "USD";

  @ApiPropertyOptional({ description: "Exchange rate", minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.01)
  @IsOptional()
  exchangeRate?: number = 1;

  @ApiPropertyOptional({ description: "Invoice notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: "Terms and conditions" })
  @IsString()
  @IsOptional()
  termsConditions?: string;

  @ApiPropertyOptional({ description: "Footer text" })
  @IsString()
  @IsOptional()
  footerText?: string;

  @ApiPropertyOptional({ description: "Reference number" })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: "Purchase order number" })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: "Is recurring invoice" })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = false;

  @ApiPropertyOptional({ description: "Recurring rule configuration" })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  recurringRule?: RecurringRule;

  @ApiProperty({
    type: [CreateInvoiceItemDto],
    description: "Invoice line items",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceType, description: "Type of invoice" })
  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  @ApiPropertyOptional({ description: "Customer ID" })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: "Customer name" })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: "Customer email" })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ description: "Customer address" })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiPropertyOptional({ description: "Customer phone" })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ description: "Issue date (ISO string)" })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ description: "Due date (ISO string)" })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: "Payment terms" })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: "Currency code" })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: "Exchange rate", minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.01)
  @IsOptional()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "Invoice notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: "Terms and conditions" })
  @IsString()
  @IsOptional()
  termsConditions?: string;

  @ApiPropertyOptional({ description: "Footer text" })
  @IsString()
  @IsOptional()
  footerText?: string;

  @ApiPropertyOptional({ description: "Reference number" })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: "Purchase order number" })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: "Is recurring invoice" })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: "Recurring rule configuration" })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  recurringRule?: RecurringRule;

  @ApiPropertyOptional({
    type: [CreateInvoiceItemDto],
    description: "Invoice line items",
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus, description: "New invoice status" })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiPropertyOptional({ description: "Status change notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: "Payment amount", minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: "Payment date (ISO string)" })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ enum: PaymentMethod, description: "Payment method used" })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: "Payment reference number" })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: "Payment notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: "Related transaction ID" })
  @IsUUID()
  @IsOptional()
  transactionId?: string;
}

export class InvoiceQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination",
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: InvoiceStatus,
    description: "Filter by invoice status",
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    enum: InvoiceType,
    description: "Filter by invoice type",
  })
  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  @ApiPropertyOptional({ description: "Filter by customer ID" })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: "Filter by issue date from (ISO string)",
  })
  @IsDateString()
  @IsOptional()
  issueDateFrom?: string;

  @ApiPropertyOptional({ description: "Filter by issue date to (ISO string)" })
  @IsDateString()
  @IsOptional()
  issueDateTo?: string;

  @ApiPropertyOptional({ description: "Filter by due date from (ISO string)" })
  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: "Filter by due date to (ISO string)" })
  @IsDateString()
  @IsOptional()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: "Filter by minimum amount" })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(String(value)))
  amountMin?: number;

  @ApiPropertyOptional({ description: "Filter by maximum amount" })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseFloat(String(value)))
  amountMax?: number;

  @ApiPropertyOptional({
    description: "Search term for invoice number, customer name, or notes",
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: [
      "invoice_number",
      "issue_date",
      "due_date",
      "total_amount",
      "status",
    ],
  })
  @IsIn(["invoice_number", "issue_date", "due_date", "total_amount", "status"])
  @IsOptional()
  sortBy?: string = "created_at";

  @ApiPropertyOptional({ description: "Sort order", enum: ["asc", "desc"] })
  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}

export class SendInvoiceDto {
  @ApiPropertyOptional({
    description:
      "Email addresses to send to (will use customer email if not provided)",
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  emailAddresses?: string[];

  @ApiPropertyOptional({ description: "Custom email subject" })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: "Custom email message" })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: "Include PDF attachment" })
  @IsBoolean()
  @IsOptional()
  includePdf?: boolean = true;
}

export class GenerateRecurringInvoicesDto {
  @ApiPropertyOptional({ description: "Generate up to this date (ISO string)" })
  @IsDateString()
  @IsOptional()
  upToDate?: string;

  @ApiPropertyOptional({
    description: "Maximum number of invoices to generate",
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxCount?: number = 10;
}
