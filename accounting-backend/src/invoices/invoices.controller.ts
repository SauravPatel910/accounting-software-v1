// prettier-ignore
import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from "@nestjs/common";
// prettier-ignore
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";
// prettier-ignore
import { CreateInvoiceDto, UpdateInvoiceStatusDto, RecordPaymentDto, InvoiceQueryDto } from "./dto/invoice.dto";
import { InvoiceResponseDto } from "./interfaces/invoice.interface";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    companyId: string;
    email: string;
  };
}

@ApiTags("invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new invoice" })
  @ApiResponse({
    status: 201,
    description: "The invoice has been successfully created.",
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;
    const userId = req.user.sub;
    return this.invoicesService.create(createInvoiceDto, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all invoices" })
  @ApiResponse({
    status: 200,
    description: "List of invoices retrieved successfully.",
  })
  async findAll(
    @Query() query: InvoiceQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const companyId = req.user.companyId;
    return this.invoicesService.findAll(query, companyId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an invoice by ID" })
  @ApiResponse({
    status: 200,
    description: "The invoice has been successfully retrieved.",
  })
  @ApiResponse({ status: 404, description: "Invoice not found." })
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;
    return this.invoicesService.findOne(id, companyId);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update invoice status" })
  @ApiResponse({
    status: 200,
    description: "Invoice status has been successfully updated.",
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "Invoice not found." })
  async updateStatus(
    @Param("id") id: string,
    @Body() statusDto: UpdateInvoiceStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;
    return this.invoicesService.updateStatus(id, statusDto, companyId);
  }

  @Post(":id/payments")
  @ApiOperation({ summary: "Record a payment for an invoice" })
  @ApiResponse({
    status: 200,
    description: "Payment has been successfully recorded.",
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "Invoice not found." })
  async recordPayment(
    @Param("id") id: string,
    @Body() paymentDto: RecordPaymentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;
    return this.invoicesService.recordPayment(id, paymentDto, companyId);
  }

  @Get("stats/summary")
  @ApiOperation({ summary: "Get invoice statistics summary" })
  @ApiResponse({
    status: 200,
    description: "Invoice statistics retrieved successfully.",
  })
  getStats(): {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  } {
    // Simple placeholder stats
    return {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
  }
}
