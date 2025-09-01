// prettier-ignore
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { SupabaseService } from "../shared/services/supabase.service";
import Decimal from "decimal.js";
// prettier-ignore
import { CreateInvoiceDto, InvoiceQueryDto, UpdateInvoiceStatusDto, RecordPaymentDto } from "./dto/invoice.dto";
// prettier-ignore
import { DatabaseInvoice, InvoiceResponseDto, InvoiceStatus, PaymentStatus, InvoiceType } from "./interfaces/invoice.interface";

interface InvoiceItem {
  quantity?: number;
  unitPrice?: number;
  itemName?: string;
  itemDescription?: string;
  itemCode?: string;
  accountId?: string;
  sortOrder?: number;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    companyId: string,
    userId: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber(
        companyId,
        createInvoiceDto.invoiceType,
      );

      // Calculate totals
      const { totalAmount } = this.calculateInvoiceTotals(
        createInvoiceDto.items,
      );

      // Create invoice data
      const invoiceData: Partial<DatabaseInvoice> = {
        invoice_number: invoiceNumber,
        invoice_type: createInvoiceDto.invoiceType,
        status: InvoiceStatus.DRAFT,
        payment_status: PaymentStatus.UNPAID,
        customer_id: createInvoiceDto.customerId,
        customer_name: createInvoiceDto.customerName,
        customer_email: createInvoiceDto.customerEmail,
        issue_date: createInvoiceDto.issueDate,
        due_date: createInvoiceDto.dueDate,
        total_amount: totalAmount.toNumber(),
        amount_paid: 0,
        amount_due: totalAmount.toNumber(),
        currency: createInvoiceDto.currency || "USD",
        notes: createInvoiceDto.notes,
        company_id: companyId,
        created_by: userId,
      };

      // Create invoice
      const invoiceResult = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceResult.error) {
        throw new BadRequestException("Failed to create invoice");
      }

      const createdInvoice = invoiceResult.data as DatabaseInvoice;
      return this.mapToResponseDto(createdInvoice);
    } catch {
      throw new BadRequestException("Failed to create invoice");
    }
  }

  async findAll(
    query: InvoiceQueryDto,
    companyId: string,
  ): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const supabase = this.supabaseService.getClient();
      const { page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      let queryBuilder = supabase
        .from("invoices")
        .select("*")
        .eq("company_id", companyId);

      if (query.status) {
        queryBuilder = queryBuilder.eq("status", query.status);
      }

      const countResult = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId);

      const total = countResult.count || 0;

      const invoicesResult = await queryBuilder
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (invoicesResult.error) {
        throw new BadRequestException("Failed to fetch invoices");
      }

      const invoices = (invoicesResult.data || []).map((invoice: any) =>
        this.mapToResponseDto(invoice as DatabaseInvoice),
      );

      return {
        invoices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      throw new BadRequestException("Failed to fetch invoices");
    }
  }

  async findOne(id: string, companyId: string): Promise<InvoiceResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const invoiceResult = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .eq("company_id", companyId)
        .single();

      if (invoiceResult.error || !invoiceResult.data) {
        throw new NotFoundException("Invoice not found");
      }

      return this.mapToResponseDto(invoiceResult.data as DatabaseInvoice);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to fetch invoice");
    }
  }

  async updateStatus(
    id: string,
    statusDto: UpdateInvoiceStatusDto,
    companyId: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const updateData: Partial<DatabaseInvoice> = {
        status: statusDto.status,
        updated_at: new Date().toISOString(),
      };

      const updateResult = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", companyId);

      if (updateResult.error) {
        throw new BadRequestException("Failed to update invoice status");
      }

      return this.findOne(id, companyId);
    } catch {
      throw new BadRequestException("Failed to update invoice status");
    }
  }

  async recordPayment(
    id: string,
    paymentDto: RecordPaymentDto,
    companyId: string,
  ): Promise<InvoiceResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      await this.findOne(id, companyId);
      const paymentAmount = new Decimal(paymentDto.amount);

      if (paymentAmount.lte(0)) {
        throw new BadRequestException(
          "Payment amount must be greater than zero",
        );
      }

      const updateData: Partial<DatabaseInvoice> = {
        amount_paid: paymentAmount.toNumber(),
        payment_status: PaymentStatus.PAID,
        status: InvoiceStatus.PAID,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updateResult = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", companyId);

      if (updateResult.error) {
        throw new BadRequestException("Failed to record payment");
      }

      return this.findOne(id, companyId);
    } catch {
      throw new BadRequestException("Failed to record payment");
    }
  }

  private generateInvoiceNumber(
    companyId: string,
    invoiceType: InvoiceType,
  ): string {
    const year = new Date().getFullYear();
    const prefix = this.getInvoicePrefix(invoiceType);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${year}-${timestamp}`;
  }

  private getInvoicePrefix(invoiceType: InvoiceType): string {
    switch (invoiceType) {
      case InvoiceType.STANDARD:
        return "INV";
      case InvoiceType.RECURRING:
        return "REC";
      case InvoiceType.CREDIT_NOTE:
        return "CN";
      case InvoiceType.DEBIT_NOTE:
        return "DN";
      case InvoiceType.ESTIMATE:
        return "EST";
      case InvoiceType.QUOTE:
        return "QUO";
      default:
        return "INV";
    }
  }

  private calculateInvoiceTotals(items: InvoiceItem[]): {
    totalAmount: InstanceType<typeof Decimal>;
  } {
    let total = new Decimal(0);

    for (const item of items) {
      const quantity = new Decimal(item.quantity || 0);
      const unitPrice = new Decimal(item.unitPrice || 0);
      total = total.plus(quantity.times(unitPrice));
    }

    return { totalAmount: total };
  }

  private mapToResponseDto(invoice: DatabaseInvoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      status: invoice.status,
      paymentStatus: invoice.payment_status,
      customer: {
        id: invoice.customer_id,
        name: invoice.customer_name,
        email: invoice.customer_email,
        address: invoice.customer_address,
        phone: invoice.customer_phone,
      },
      dates: {
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        sentAt: invoice.sent_at,
        viewedAt: invoice.viewed_at,
        paidAt: invoice.paid_at,
      },
      amounts: {
        subtotal: invoice.subtotal || 0,
        taxAmount: invoice.tax_amount || 0,
        discountAmount: invoice.discount_amount || 0,
        totalAmount: invoice.total_amount,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
      },
      currency: invoice.currency,
      exchangeRate: invoice.exchange_rate,
      paymentTerms: invoice.payment_terms,
      notes: invoice.notes,
      termsConditions: invoice.terms_conditions,
      footerText: invoice.footer_text,
      isRecurring: invoice.is_recurring,
      recurringRule: invoice.recurring_rule,
      referenceNumber: invoice.reference_number,
      purchaseOrderNumber: invoice.purchase_order_number,
      items: [],
      payments: [],
      createdBy: invoice.created_by,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
    };
  }
}
