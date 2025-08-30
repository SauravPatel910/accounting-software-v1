import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { TransactionsService } from "./transactions.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  TransactionResponseDto,
  CreateBatchTransactionDto,
  BatchProcessingResultDto,
  ReconciliationDto,
  ReconciliationResultDto,
  TransactionReportDto,
  UserTransactionPermissionsDto,
  TransactionListResponseDto,
  TransactionAuditLogDto,
  ReconciliationMatchDto,
  TransactionValidationResultDto,
} from "./dto/transaction.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/types/auth.types";
import type { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Create a new transaction" })
  @ApiResponse({
    status: 201,
    description: "Transaction created successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(
      createTransactionDto,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({
    summary: "Get all transactions with filtering and pagination",
  })
  @ApiResponse({
    status: 200,
    description: "Transactions retrieved successfully",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["DRAFT", "POSTED", "VOID"],
  })
  async findAll(
    @Query() query: TransactionQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionListResponseDto> {
    return this.transactionsService.findAll(query, req.user.companyId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Get a transaction by ID" })
  @ApiResponse({
    status: 200,
    description: "Transaction found",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(id, req.user.companyId);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Update a transaction" })
  @ApiResponse({
    status: 200,
    description: "Transaction updated successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async update(
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(
      id,
      updateTransactionDto,
      req.user.companyId,
    );
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Delete a transaction" })
  @ApiResponse({ status: 200, description: "Transaction deleted successfully" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async remove(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.transactionsService.remove(id, req.user.companyId);
  }

  @Post(":id/post")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Post a transaction to the ledger" })
  @ApiResponse({
    status: 200,
    description: "Transaction posted successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({
    status: 400,
    description: "Transaction already posted or invalid",
  })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async postTransaction(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.postTransaction(
      id,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Post(":id/reverse")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reverse a posted transaction" })
  @ApiResponse({
    status: 200,
    description: "Transaction reversed successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({ status: 400, description: "Transaction cannot be reversed" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async reverseTransaction(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionResponseDto> {
    return await this.transactionsService.reverseTransaction(
      id,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Post(":id/validate")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate a transaction without posting" })
  @ApiResponse({ status: 200, description: "Validation completed" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async validateTransaction(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionValidationResultDto> {
    return this.transactionsService.validateTransaction(id, req.user.companyId);
  }

  // Batch Operations
  @Post("batch")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Create multiple transactions in batch" })
  @ApiResponse({
    status: 201,
    description: "Batch processing completed",
    type: BatchProcessingResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid batch data" })
  async createBatch(
    @Body() createBatchDto: CreateBatchTransactionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BatchProcessingResultDto> {
    return await this.transactionsService.createBatch(
      createBatchDto,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get("batch/:id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Get batch processing result" })
  @ApiResponse({
    status: 200,
    description: "Batch result found",
    type: BatchProcessingResultDto,
  })
  @ApiResponse({ status: 404, description: "Batch not found" })
  @ApiParam({ name: "id", description: "Batch ID" })
  async getBatch(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<BatchProcessingResultDto> {
    return await this.transactionsService.getBatch(id, req.user.companyId);
  }

  @Get("batch/:id/status")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Get batch processing status" })
  @ApiResponse({ status: 200, description: "Batch status retrieved" })
  @ApiParam({ name: "id", description: "Batch ID" })
  async getBatchStatus(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: string; [key: string]: any }> {
    return this.transactionsService.getBatchStatus(id, req.user.companyId);
  }

  // Reconciliation Operations
  @Post("reconcile")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Reconcile transactions with bank statement" })
  @ApiResponse({
    status: 200,
    description: "Reconciliation completed",
    type: ReconciliationResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid reconciliation data" })
  async reconcileTransactions(
    @Body() reconciliationDto: ReconciliationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReconciliationResultDto> {
    return await this.transactionsService.reconcileTransactions(
      reconciliationDto,
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get("reconcile/matches/:accountId")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Find potential reconciliation matches" })
  @ApiResponse({ status: 200, description: "Potential matches found" })
  @ApiParam({ name: "accountId", description: "Account ID" })
  @ApiQuery({ name: "startDate", required: true, type: String })
  @ApiQuery({ name: "endDate", required: true, type: String })
  @ApiQuery({ name: "amount", required: true, type: Number })
  async findReconciliationMatches(
    @Param("accountId") accountId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("amount") amount: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReconciliationMatchDto[]> {
    return await this.transactionsService.findReconciliationMatches(
      accountId,
      endDate, // Use endDate as statementDate
      amount, // Use amount as tolerance
      req.user.companyId,
    );
  }

  @Get("reconcile/status/:accountId")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Get reconciliation status for an account" })
  @ApiResponse({ status: 200, description: "Reconciliation status retrieved" })
  @ApiParam({ name: "accountId", description: "Account ID" })
  async getReconciliationStatus(
    @Param("accountId") accountId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    reconciledCount: number;
    unreconciledCount: number;
    lastReconciliation: string | null;
  }> {
    return this.transactionsService.getReconciliationStatus(
      accountId,
      req.user.companyId,
    );
  }

  // Reporting Operations
  @Post("reports/generate")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)
  @ApiOperation({ summary: "Generate transaction report" })
  @ApiResponse({ status: 200, description: "Report generated successfully" })
  async generateReport(
    @Body() reportDto: TransactionReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.transactionsService.generateReport(
      reportDto.format || "trial_balance",
      reportDto,
      req.user.companyId,
    );
  }

  @Get("reports/trial-balance")
  @Roles(
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.MANAGER,
    UserRole.READ_ONLY,
  )
  @ApiOperation({ summary: "Get trial balance report" })
  @ApiResponse({ status: 200, description: "Trial balance generated" })
  @ApiQuery({ name: "asOfDate", required: false, type: String })
  async getTrialBalance(
    @Query("asOfDate") asOfDate: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.transactionsService.getTrialBalance(
      asOfDate,
      req.user.companyId,
    );
  }

  @Get("reports/account-ledger/:accountId")
  @Roles(
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.MANAGER,
    UserRole.READ_ONLY,
  )
  @ApiOperation({ summary: "Get account ledger report" })
  @ApiResponse({ status: 200, description: "Account ledger generated" })
  @ApiParam({ name: "accountId", description: "Account ID" })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async getAccountLedger(
    @Param("accountId") accountId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.transactionsService.getAccountLedger(
      accountId,
      req.user.companyId,
      startDate,
      endDate,
    );
  }

  // Audit and History Operations
  @Get(":id/audit-log")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)
  @ApiOperation({ summary: "Get transaction audit log" })
  @ApiResponse({ status: 200, description: "Audit log retrieved" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async getAuditLog(
    @Param("id") id: string,
  ): Promise<TransactionAuditLogDto[]> {
    return this.transactionsService.getAuditLog(id) as Promise<
      TransactionAuditLogDto[]
    >;
  }

  @Get(":id/history")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Get transaction change history" })
  @ApiResponse({ status: 200, description: "Transaction history retrieved" })
  @ApiParam({ name: "id", description: "Transaction ID" })
  async getTransactionHistory(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<any[]> {
    return this.transactionsService.getTransactionHistory(
      id,
      req.user.companyId,
    ) as Promise<any[]>;
  }

  // User Permissions
  @Get("permissions")
  @ApiOperation({ summary: "Get current user transaction permissions" })
  @ApiResponse({
    status: 200,
    description: "User permissions retrieved",
    type: UserTransactionPermissionsDto,
  })
  async getUserPermissions(): Promise<UserTransactionPermissionsDto> {
    return this.transactionsService.getUserPermissions() as Promise<UserTransactionPermissionsDto>;
  }

  // Search and Filter Operations
  @Get("search/advanced")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  @ApiOperation({ summary: "Advanced transaction search" })
  @ApiResponse({ status: 200, description: "Search results retrieved" })
  @ApiQuery({ name: "query", required: true, type: String })
  @ApiQuery({ name: "filters", required: false, type: String })
  async advancedSearch(
    @Query("query") query: string,
    @Query("filters") filters: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TransactionListResponseDto> {
    const parsedFilters: Record<string, any> = filters
      ? (JSON.parse(filters) as Record<string, any>)
      : {};
    const searchParams = { query, ...parsedFilters };
    return this.transactionsService.advancedSearch(
      searchParams,
      req.user.companyId,
    ) as Promise<TransactionListResponseDto>;
  }

  @Get("analytics/summary")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)
  @ApiOperation({ summary: "Get transaction analytics summary" })
  @ApiResponse({ status: 200, description: "Analytics summary retrieved" })
  @ApiQuery({
    name: "period",
    required: false,
    enum: ["daily", "weekly", "monthly", "yearly"],
  })
  async getAnalyticsSummary(
    @Query("period") period: string = "monthly",
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.transactionsService.getAnalyticsSummary(
      period,
      req.user.companyId,
    );
  }

  // Import/Export Operations
  @Post("import")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: "Import transactions from file" })
  @ApiResponse({ status: 200, description: "Import completed" })
  importTransactions(): any {
    return this.transactionsService.importTransactions();
  }

  @Get("export")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)
  @ApiOperation({ summary: "Export transactions" })
  @ApiResponse({ status: 200, description: "Export completed" })
  @ApiQuery({ name: "format", required: false, enum: ["csv", "excel", "pdf"] })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async exportTransactions(
    @Query("format") format: string = "csv",
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.transactionsService.exportTransactions(req.user.companyId, {
      format,
      startDate,
      endDate,
    });
  }
}
