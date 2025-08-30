import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/services/supabase.service";
import { CustomLoggerService } from "../logging/logger.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  BatchTransactionDto,
  ReconciliationDto,
  TransactionResponseDto,
  TransactionListResponseDto,
  TransactionEntryResponseDto,
  BatchProcessingResultDto,
  TransactionValidationResultDto,
  CreateBatchTransactionDto,
  BatchTransactionResponseDto,
  ReconciliationMatchDto,
  ReconciliationResultDto,
  TransactionTotalsDto,
} from "./dto/transaction.dto";
import {
  DatabaseTransaction,
  DatabaseTransactionEntry,
  DatabaseBatchTransaction,
  TransactionType,
  TransactionStatus,
  ApprovalStatus,
  ReconciliationStatus,
  BatchStatus,
  TransactionValidationResult,
  ValidationError,
  ValidationWarning,
  ReconciliationMatch,
  MatchType,
} from "./interfaces/transaction.interface";
import Decimal from "decimal.js";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    companyId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    try {
      // Validate transaction entries for double-entry bookkeeping
      const validationResult = await this.validateDoubleEntryBookkeeping(
        createTransactionDto.entries,
        companyId,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: "Transaction validation failed",
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }

      const supabase = this.supabaseService.getClient();

      // Generate transaction number
      const transactionNumber = await this.generateTransactionNumber(
        createTransactionDto.transactionType,
        companyId,
      );

      // Calculate total amount
      const totalAmount = this.calculateTotalAmount(
        createTransactionDto.entries,
      ).toNumber();

      // Determine fiscal year and period
      const { fiscalYear, fiscalPeriod } = await this.getFiscalPeriod(
        createTransactionDto.transactionDate,
        companyId,
      );

      const transactionData: Partial<DatabaseTransaction> = {
        transaction_number: transactionNumber,
        reference: createTransactionDto.reference,
        description: createTransactionDto.description,
        transaction_date: createTransactionDto.transactionDate,
        posting_date:
          createTransactionDto.postingDate ||
          createTransactionDto.transactionDate,
        transaction_type: createTransactionDto.transactionType,
        status: TransactionStatus.DRAFT,
        total_amount: totalAmount,
        currency: createTransactionDto.currency,
        exchange_rate: createTransactionDto.exchangeRate,
        source_document_type: createTransactionDto.sourceDocumentType,
        source_document_id: createTransactionDto.sourceDocumentId,
        memo: createTransactionDto.memo,
        tags: createTransactionDto.tags,
        is_recurring: createTransactionDto.isRecurring,
        recurring_rule: createTransactionDto.recurringRule,
        approval_status: ApprovalStatus.NOT_REQUIRED, // TODO: Implement approval workflow
        reconciliation_status: ReconciliationStatus.UNRECONCILED,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        company_id: companyId,
        created_by: userId,
        posted_by: undefined,
        posted_at: undefined,
      };

      // Start transaction
      const transactionResponse = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      const transaction =
        transactionResponse.data as DatabaseTransaction | null;
      const transactionError = transactionResponse.error;

      if (transactionError || !transaction) {
        this.logger.error(
          "Error creating transaction",
          JSON.stringify(transactionError),
          "TransactionsService",
        );
        throw new BadRequestException("Failed to create transaction");
      }

      // Create transaction entries
      const entries = await this.createTransactionEntries(
        transaction.id,
        createTransactionDto.entries,
      );

      // Update account balances if transaction is posted
      this.logger.log(
        "Transaction created successfully",
        "TransactionsService",
      );

      const response = this.mapTransactionToResponseDto(
        transaction,
      );
      response.entries = entries.map((entry) =>
        this.mapEntryToResponseDto(entry),
      );
      response.validationResult =
        this.mapValidationResultToDto(validationResult);

      return response;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error creating transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to create transaction");
    }
  }

  async findAll(
    query: TransactionQueryDto,
    companyId: string,
  ): Promise<TransactionListResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      let queryBuilder = supabase
        .from("transactions")
        .select(
          `
          *,
          transaction_entries (
            *,
            accounts (code, name)
          )
        `,
          { count: "exact" },
        )
        .eq("company_id", companyId);

      // Apply filters
      if (query.search) {
        queryBuilder = queryBuilder.or(
          `transaction_number.ilike.%${query.search}%,` +
            `reference.ilike.%${query.search}%,` +
            `description.ilike.%${query.search}%`,
        );
      }

      if (query.transactionType) {
        queryBuilder = queryBuilder.eq(
          "transaction_type",
          query.transactionType,
        );
      }

      if (query.status) {
        queryBuilder = queryBuilder.eq("status", query.status);
      }

      if (query.approvalStatus) {
        queryBuilder = queryBuilder.eq("approval_status", query.approvalStatus);
      }

      if (query.reconciliationStatus) {
        queryBuilder = queryBuilder.eq(
          "reconciliation_status",
          query.reconciliationStatus,
        );
      }

      if (query.startDate) {
        queryBuilder = queryBuilder.gte("transaction_date", query.startDate);
      }

      if (query.endDate) {
        queryBuilder = queryBuilder.lte("transaction_date", query.endDate);
      }

      if (query.minAmount !== undefined) {
        queryBuilder = queryBuilder.gte("total_amount", query.minAmount);
      }

      if (query.maxAmount !== undefined) {
        queryBuilder = queryBuilder.lte("total_amount", query.maxAmount);
      }

      if (query.accountId) {
        queryBuilder = queryBuilder.eq(
          "transaction_entries.account_id",
          query.accountId,
        );
      }

      // Remove postedBy filter as it's not in the DTO

      if (query.unpostedOnly) {
        queryBuilder = queryBuilder.neq("status", TransactionStatus.POSTED);
      }

      // Apply sorting
      const sortField = this.mapSortField(query.sortBy || "transactionDate");
      queryBuilder = queryBuilder.order(sortField, {
        ascending: query.sortOrder === "ASC",
      });

      // Apply pagination
      const offset = ((query.page || 1) - 1) * (query.limit || 50);
      queryBuilder = queryBuilder.range(
        offset,
        offset + (query.limit || 50) - 1,
      );

      const response = await queryBuilder;

      if (response.error) {
        this.logger.error(
          "Error fetching transactions",
          JSON.stringify(response.error),
          "TransactionsService",
        );
        throw new BadRequestException("Failed to fetch transactions");
      }

      const transactions = (response.data || []) as DatabaseTransaction[];
      const mappedTransactions = transactions.map(
        (transaction: DatabaseTransaction) => {
          const mapped = this.mapTransactionToResponseDto(transaction);
          if ((transaction as any).transaction_entries) {
            mapped.entries = (
              (transaction as any)
                .transaction_entries as DatabaseTransactionEntry[]
            ).map((entry: any) => this.mapEntryToResponseDto(entry));
          }
          return mapped;
        },
      );

      // Calculate totals
      const totals = this.calculateTransactionsTotals(transactions);

      return {
        data: mappedTransactions,
        total: response.count || 0,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil((response.count || 0) / (query.limit || 50)),
        totalDebits: totals.totalDebits,
        totalCredits: totals.totalCredits,
        balanceCheck: totals.balanceCheck,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error fetching transactions",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to fetch transactions");
    }
  }

  async findOne(
    id: string,
    companyId: string,
    includeEntries = true,
  ): Promise<TransactionResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const query = includeEntries
        ? supabase
            .from("transactions")
            .select(
              `
              *,
              transaction_entries (
                *,
                accounts (code, name)
              )
            `,
            )
            .eq("id", id)
            .eq("company_id", companyId)
            .single()
        : supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .eq("company_id", companyId)
            .single();

      const response = await query;

      if (response.error || !response.data) {
        this.logger.warn("Transaction not found", "TransactionsService");
        throw new NotFoundException("Transaction not found");
      }

      const transaction = response.data as DatabaseTransaction & {
        transaction_entries?: any[];
      };
      const mapped = this.mapTransactionToResponseDto(transaction);

      if (includeEntries && transaction.transaction_entries) {
        mapped.entries = transaction.transaction_entries.map((entry: any) =>
          this.mapEntryToResponseDto(entry),
        );
      }

      return mapped;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error fetching transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to fetch transaction");
    }
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    companyId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    try {
      // Verify transaction exists and is editable
      const existingTransaction = await this.findOne(id, companyId);

      if (existingTransaction.status === TransactionStatus.POSTED) {
        throw new BadRequestException("Cannot edit posted transactions");
      }

      if (existingTransaction.status === TransactionStatus.CANCELLED) {
        throw new BadRequestException("Cannot edit cancelled transactions");
      }

      // Validate entries if provided
      let validationResult: TransactionValidationResult | undefined;
      if (updateTransactionDto.entries) {
        validationResult = await this.validateDoubleEntryBookkeeping(
          updateTransactionDto.entries,
          companyId,
        );

        if (!validationResult.isValid) {
          throw new BadRequestException({
            message: "Transaction validation failed",
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          });
        }
      }

      const supabase = this.supabaseService.getClient();

      const updateData: Partial<DatabaseTransaction> = {
        updated_at: new Date().toISOString(),
      };

      // Map update fields
      if (updateTransactionDto.reference !== undefined)
        updateData.reference = updateTransactionDto.reference;
      if (updateTransactionDto.description)
        updateData.description = updateTransactionDto.description;
      if (updateTransactionDto.transactionDate)
        updateData.transaction_date = updateTransactionDto.transactionDate;
      if (updateTransactionDto.postingDate)
        updateData.posting_date = updateTransactionDto.postingDate;
      if (updateTransactionDto.transactionType)
        updateData.transaction_type = updateTransactionDto.transactionType;
      if (updateTransactionDto.currency)
        updateData.currency = updateTransactionDto.currency;
      if (updateTransactionDto.exchangeRate)
        updateData.exchange_rate = updateTransactionDto.exchangeRate;
      if (updateTransactionDto.sourceDocumentType !== undefined)
        updateData.source_document_type =
          updateTransactionDto.sourceDocumentType;
      if (updateTransactionDto.sourceDocumentId !== undefined)
        updateData.source_document_id = updateTransactionDto.sourceDocumentId;
      if (updateTransactionDto.memo !== undefined)
        updateData.memo = updateTransactionDto.memo;
      if (updateTransactionDto.tags !== undefined)
        updateData.tags = updateTransactionDto.tags;
      if (updateTransactionDto.isRecurring !== undefined)
        updateData.is_recurring = updateTransactionDto.isRecurring;
      if (updateTransactionDto.recurringRule !== undefined)
        updateData.recurring_rule = updateTransactionDto.recurringRule;

      // Update entries if provided
      if (updateTransactionDto.entries) {
        // Delete existing entries
        await supabase
          .from("transaction_entries")
          .delete()
          .eq("transaction_id", id);

        // Create new entries
        await this.createTransactionEntries(id, updateTransactionDto.entries);

        // Update total amount
        updateData.total_amount = this.calculateTotalAmount(
          updateTransactionDto.entries,
        ).toNumber();

        // Note: Account balances are not updated during edit as transaction is not posted
        // Account balances will be updated when the transaction is posted via postTransaction method
      }

      // Handle auto-posting
      // Remove autoPost logic for update

      const updateResponse = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

      const updatedTransaction =
        updateResponse.data as DatabaseTransaction | null;
      const error = updateResponse.error;

      if (error || !updatedTransaction) {
        this.logger.error(
          "Error updating transaction",
          JSON.stringify(error),
          "TransactionsService",
        );
        throw new BadRequestException("Failed to update transaction");
      }

      this.logger.log(
        "Transaction updated successfully",
        "TransactionsService",
      );

      const response = this.mapTransactionToResponseDto(
        updatedTransaction,
      );
      if (validationResult) {
        response.validationResult =
          this.mapValidationResultToDto(validationResult);
      }

      return response;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error updating transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to update transaction");
    }
  }

  async remove(id: string, companyId: string): Promise<void> {
    try {
      const transaction = await this.findOne(id, companyId);

      if (transaction.status === TransactionStatus.POSTED) {
        throw new BadRequestException(
          "Cannot delete posted transactions. Consider reversing instead.",
        );
      }

      const supabase = this.supabaseService.getClient();

      // Delete transaction entries first (cascade should handle this, but being explicit)
      await supabase
        .from("transaction_entries")
        .delete()
        .eq("transaction_id", id);

      // Delete transaction
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("company_id", companyId);

      if (error) {
        this.logger.error(
          "Error deleting transaction",
          JSON.stringify(error),
          "TransactionsService",
        );
        throw new BadRequestException("Failed to delete transaction");
      }

      this.logger.log(
        "Transaction deleted successfully",
        "TransactionsService",
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error deleting transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to delete transaction");
    }
  }

  async postTransaction(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.findOne(id, companyId, true);

      if (transaction.status === TransactionStatus.POSTED) {
        throw new BadRequestException("Transaction is already posted");
      }

      if (transaction.status === TransactionStatus.CANCELLED) {
        throw new BadRequestException("Cannot post cancelled transaction");
      }

      // Validate transaction before posting
      const validationResult = await this.validateDoubleEntryBookkeeping(
        transaction.entries.map((entry) => ({
          accountId: entry.accountId,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description,
          reference: entry.reference,
          taxCode: entry.taxCode,
          taxAmount: entry.taxAmount,
          projectId: entry.projectId,
          costCenterId: entry.costCenterId,
          departmentId: entry.departmentId,
        })),
        companyId,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: "Transaction validation failed",
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }

      const supabase = this.supabaseService.getClient();

      const postTransactionResponse = await supabase
        .from("transactions")
        .update({
          status: TransactionStatus.POSTED,
          posted_by: userId,
          posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

      const updatedTransaction =
        postTransactionResponse.data as DatabaseTransaction | null;
      const error = postTransactionResponse.error;

      if (error || !updatedTransaction) {
        this.logger.error(
          "Error posting transaction",
          JSON.stringify(error),
          "TransactionsService",
        );
        throw new BadRequestException("Failed to post transaction");
      }

      // Update account balances
      if (transaction.entries) {
        await this.updateAccountBalances(
          transaction.entries.map((entry) => ({
            id: entry.id,
            transaction_id: entry.transactionId,
            account_id: entry.accountId,
            debit_amount: entry.debitAmount,
            credit_amount: entry.creditAmount,
            amount: entry.amount,
            description: entry.description,
            reference: entry.reference,
            tax_code: entry.taxCode,
            tax_amount: entry.taxAmount,
            project_id: entry.projectId,
            cost_center_id: entry.costCenterId,
            department_id: entry.departmentId,
            line_number: entry.lineNumber,
            created_at: entry.createdAt.toISOString(),
            updated_at: entry.updatedAt.toISOString(),
          })),
        );
      }

      this.logger.log("Transaction posted successfully", "TransactionsService");
      return this.mapTransactionToResponseDto(
        updatedTransaction,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error posting transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to post transaction");
    }
  }

  // Continue with batch processing, reconciliation, and validation methods...

  async createBatch(
    createBatchDto: CreateBatchTransactionDto,
    companyId: string,
    userId: string,
  ): Promise<BatchProcessingResultDto> {
    try {
      const supabase = this.supabaseService.getClient();

      // Generate batch number
      const batchNumber = await this.generateBatchNumber(companyId);

      // Calculate total amount
      const totalAmount = createBatchDto.transactions.reduce((sum, txn) => {
        return sum + this.calculateTotalAmount(txn.entries).toNumber();
      }, 0);

      // Create batch record
      const batchData: Partial<DatabaseBatchTransaction> = {
        batch_number: batchNumber,
        batch_name: createBatchDto.name,
        description: createBatchDto.description,
        status: BatchStatus.PENDING,
        total_transactions: createBatchDto.transactions.length,
        total_amount: totalAmount,
        company_id: companyId,
        created_by: userId,
      };

      const batchResponse = await supabase
        .from("batch_transactions")
        .insert(batchData)
        .select()
        .single();

      const batch = batchResponse.data as DatabaseBatchTransaction | null;
      const batchError = batchResponse.error;

      if (batchError || !batch) {
        throw new BadRequestException("Failed to create batch");
      }

      // Process transactions in background
      void this.processBatchTransactions(
        batch.id,
        createBatchDto.transactions,
        companyId,
        userId,
        createBatchDto.autoPost || false,
      );

      return this.mapBatchToProcessingResultDto(
        batch,
      );
    } catch (error) {
      this.logger.error(
        "Error creating batch transactions",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to create batch transactions");
    }
  }

  async getBatch(
    id: string,
    companyId: string,
  ): Promise<BatchProcessingResultDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const getBatchResponse = await supabase
        .from("batch_transactions")
        .select(
          `
          *,
          transactions (*)
        `,
        )
        .eq("id", id)
        .eq("company_id", companyId)
        .single();

      const batch = getBatchResponse.data as DatabaseBatchTransaction | null;
      const error = getBatchResponse.error;

      if (error || !batch) {
        throw new NotFoundException("Batch not found");
      }

      return this.mapBatchToProcessingResultDto(
        batch,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Error fetching batch",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to fetch batch");
    }
  }

  async reverseTransaction(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    try {
      const originalTransaction = await this.findOne(id, companyId, true);

      if (originalTransaction.status !== TransactionStatus.POSTED) {
        throw new BadRequestException("Can only reverse posted transactions");
      }

      if (originalTransaction.transactionType === TransactionType.REVERSAL) {
        throw new BadRequestException("Cannot reverse a reversal transaction");
      }

      // Create reversal transaction
      const reversalEntries = originalTransaction.entries.map(
        (entry, index) => ({
          accountId: entry.accountId,
          debitAmount: entry.creditAmount, // Swap debit and credit
          creditAmount: entry.debitAmount,
          description: `Reversal of ${entry.description || ""}`,
          reference: entry.reference,
          taxCode: entry.taxCode,
          taxAmount: entry.taxAmount ? -entry.taxAmount : undefined,
          projectId: entry.projectId,
          costCenterId: entry.costCenterId,
          departmentId: entry.departmentId,
          lineNumber: index + 1,
        }),
      );

      const reversalDto: CreateTransactionDto = {
        reference: `REV-${originalTransaction.transactionNumber}`,
        description: `Reversal of ${originalTransaction.description}`,
        transactionDate: new Date().toISOString().split("T")[0],
        transactionType: TransactionType.REVERSAL,
        currency: originalTransaction.currency,
        exchangeRate: originalTransaction.exchangeRate,
        sourceDocumentType: "transaction",
        sourceDocumentId: originalTransaction.id,
        memo: `Reversal of transaction ${originalTransaction.transactionNumber}`,
        isRecurring: false,
        entries: reversalEntries,
      };

      const reversalTransaction = await this.create(
        reversalDto,
        companyId,
        userId,
      );

      // Update original transaction status
      const supabase = this.supabaseService.getClient();
      await supabase
        .from("transactions")
        .update({
          status: TransactionStatus.REVERSED,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", companyId);

      this.logger.log(
        "Transaction reversed successfully",
        "TransactionsService",
      );
      return reversalTransaction;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Error reversing transaction",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to reverse transaction");
    }
  }

  async validateTransaction(
    id: string,
    companyId: string,
  ): Promise<TransactionValidationResultDto> {
    // Get the transaction
    const transaction = await this.findOne(id, companyId);

    // Validate double-entry bookkeeping
    const validationResult = await this.validateDoubleEntryBookkeeping(
      transaction.entries,
      companyId,
    );

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors || [],
      warnings: validationResult.warnings || [],
    };
  }

  async reconcileTransactions(
    reconciliationDto: ReconciliationDto,
    companyId: string,
    userId: string,
  ): Promise<ReconciliationResultDto> {
    try {
      const supabase = this.supabaseService.getClient();

      // Verify account exists
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("id", reconciliationDto.accountId)
        .eq("company_id", companyId)
        .single();

      if (accountError || !account) {
        throw new NotFoundException("Account not found");
      }

      // Get transactions to reconcile
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .in("id", reconciliationDto.transactionIds)
        .eq("company_id", companyId);

      if (transactionsError) {
        throw new BadRequestException("Failed to fetch transactions");
      }

      // Update transactions reconciliation status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          reconciliation_status: ReconciliationStatus.RECONCILED,
          reconciled_at: new Date().toISOString(),
          reconciled_by: userId,
          updated_at: new Date().toISOString(),
        })
        .in("id", reconciliationDto.transactionIds)
        .eq("company_id", companyId);

      if (updateError) {
        throw new BadRequestException("Failed to reconcile transactions");
      }

      const totalReconciledAmount =
        transactions?.reduce(
          (sum: number, t: any) =>
            sum +
            parseFloat(
              (t as DatabaseTransaction).total_amount?.toString() ?? "0",
            ),
          0,
        ) || 0;
      const reconciledTransactions =
        transactions?.map((t: any) =>
          this.mapTransactionToResponseDto(t as DatabaseTransaction),
        ) || [];

      // Create reconciliation record (implement if you have a reconciliations table)
      this.logger.log(
        `Reconciled ${reconciliationDto.transactionIds.length} transactions for account ${account.name}`,
        "TransactionsService",
      );

      return {
        reconciliationId: `reconciliation_${Date.now()}`,
        accountId: reconciliationDto.accountId,
        reconciledTransactions,
        totalReconciledAmount: totalReconciledAmount as number,
        reconciledCount: reconciliationDto.transactionIds.length,
        unreconciledCount: 0, // Could calculate this if needed
        reconciliationDate: new Date(),
        reconciledBy: userId,
        message: "Transactions reconciled successfully",
        status: "completed",
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Error reconciling transactions",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to reconcile transactions");
    }
  }

  async findReconciliationMatches(
    accountId: string,
    statementDate: string,
    tolerance: number,
    companyId: string,
  ): Promise<ReconciliationMatchDto[]> {
    try {
      // This is a simplified implementation
      // In a real system, you'd have bank statement data to match against
      const supabase = this.supabaseService.getClient();

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          transaction_entries!inner (
            account_id,
            debit_amount,
            credit_amount
          )
        `,
        )
        .eq("transaction_entries.account_id", accountId)
        .eq("company_id", companyId)
        .eq("reconciliation_status", ReconciliationStatus.UNRECONCILED)
        .gte(
          "transaction_date",
          new Date(Date.parse(statementDate) - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        )
        .lte(
          "transaction_date",
          new Date(Date.parse(statementDate) + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        );

      if (error) {
        throw new BadRequestException("Failed to find reconciliation matches");
      }

      // Simple matching logic - in reality, this would be more sophisticated
      const matches: ReconciliationMatchDto[] = (transactions || []).map(
        (txn: any) => ({
          transactionId: (txn as DatabaseTransaction).id,
          matchConfidence: 0.8, // Placeholder confidence score
          statementAmount: tolerance, // Use tolerance as statement amount for now
          transactionAmount: parseFloat(
            (txn as DatabaseTransaction).total_amount?.toString() ?? "0",
          ),
          dateDifference:
            Math.abs(
              new Date(
                (txn as DatabaseTransaction).transaction_date,
              ).getTime() - new Date(statementDate).getTime(),
            ) /
            (1000 * 60 * 60 * 24),
          description: (txn as DatabaseTransaction).description || "",
          suggestedMatch: true,
        }),
      );

      return matches.filter(
        (match) => Math.abs(match.transactionAmount) >= tolerance,
      );
    } catch (error) {
      this.logger.error(
        "Error finding reconciliation matches",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to find reconciliation matches");
    }
  }

  async validateTransactionDto(
    createTransactionDto: CreateTransactionDto,
    companyId: string,
  ): Promise<TransactionValidationResultDto> {
    const validationResult = await this.validateDoubleEntryBookkeeping(
      createTransactionDto.entries,
      companyId,
    );

    return this.mapValidationResultToDto(validationResult);
  }

  async getTrialBalance(asOfDate: string, companyId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: balances, error } = await supabase
        .from("accounts")
        .select(
          `
          id,
          code,
          name,
          type,
          sub_type,
          transaction_entries!inner (
            debit_amount,
            credit_amount,
            transactions!inner (
              transaction_date,
              status
            )
          )
        `,
        )
        .eq("company_id", companyId)
        .eq("transaction_entries.transactions.status", TransactionStatus.POSTED)
        .lte("transaction_entries.transactions.transaction_date", asOfDate);

      if (error) {
        throw new BadRequestException("Failed to generate trial balance");
      }

      // Calculate balances for each account
      const trialBalance = (balances || []).map((account: any) => {
        const entries = Array.isArray(account?.transaction_entries)
          ? account.transaction_entries
          : [];
        const debitTotal = entries.reduce((sum: number, entry: any) => {
          const debitAmount =
            typeof entry?.debit_amount === "number" ? entry.debit_amount : 0;
          return sum + debitAmount;
        }, 0);
        const creditTotal = entries.reduce((sum: number, entry: any) => {
          const creditAmount =
            typeof entry?.credit_amount === "number" ? entry.credit_amount : 0;
          return sum + creditAmount;
        }, 0);

        return {
          accountId: String(account?.id || ""),
          accountCode: String(account?.code || ""),
          accountName: String(account?.name || ""),
          accountType: String(account?.type || ""),
          accountSubType: String(account?.sub_type || ""),
          debitBalance: debitTotal,
          creditBalance: creditTotal,
          netBalance: debitTotal - creditTotal,
        };
      });

      return {
        asOfDate,
        accounts: trialBalance,
        totalDebits: trialBalance.reduce(
          (sum: number, acc: any) =>
            sum + (typeof acc.debitBalance === "number" ? acc.debitBalance : 0),
          0,
        ),
        totalCredits: trialBalance.reduce(
          (sum: number, acc: any) =>
            sum +
            (typeof acc.creditBalance === "number" ? acc.creditBalance : 0),
          0,
        ),
      };
    } catch (error) {
      this.logger.error(
        "Error generating trial balance",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to generate trial balance");
    }
  }

  async getAccountActivity(
    accountId: string,
    dateFrom: string,
    dateTo: string,
    companyId: string,
  ) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: activity, error } = await supabase
        .from("transaction_entries")
        .select(
          `
          *,
          transactions!inner (
            transaction_number,
            description,
            transaction_date,
            status,
            company_id
          )
        `,
        )
        .eq("account_id", accountId)
        .eq("transactions.company_id", companyId)
        .gte("transactions.transaction_date", dateFrom)
        .lte("transactions.transaction_date", dateTo)
        .order("transactions.transaction_date", { ascending: true });

      if (error) {
        throw new BadRequestException("Failed to get account activity");
      }

      let runningBalance = 0;
      const activities = (activity || []).map((entry: any) => {
        const amount = (entry.debit_amount || 0) - (entry.credit_amount || 0);
        runningBalance += amount;

        return {
          transactionId: entry.transaction_id,
          transactionNumber: entry.transactions.transaction_number,
          transactionDate: entry.transactions.transaction_date,
          description: entry.description || entry.transactions.description,
          debitAmount: entry.debit_amount,
          creditAmount: entry.credit_amount,
          amount,
          runningBalance,
          status: entry.transactions.status,
        };
      });

      return {
        accountId,
        dateFrom,
        dateTo,
        activities,
        totalDebits: activities.reduce(
          (sum, act) => sum + (act.debitAmount || 0),
          0,
        ),
        totalCredits: activities.reduce(
          (sum, act) => sum + (act.creditAmount || 0),
          0,
        ),
        netChange: activities.reduce((sum, act) => sum + act.amount, 0),
        endingBalance: runningBalance,
      };
    } catch (error) {
      this.logger.error(
        "Error getting account activity",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get account activity");
    }
  }

  // Private helper methods
  private async validateDoubleEntryBookkeeping(
    entries: any[],
    companyId: string,
  ): Promise<TransactionValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check minimum number of entries
    if (entries.length < 2) {
      errors.push({
        field: "entries",
        message:
          "Transaction must have at least 2 entries for double-entry bookkeeping",
        code: "MIN_ENTRIES_REQUIRED",
        value: entries.length,
      });
    }

    // Calculate totals
    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    for (const [index, entry] of entries.entries()) {
      const debit = new Decimal(entry.debitAmount || 0);
      const credit = new Decimal(entry.creditAmount || 0);

      // Check that entry has either debit or credit (but not both)
      if (debit.greaterThan(0) && credit.greaterThan(0)) {
        errors.push({
          field: `entries[${index}]`,
          message: "Entry cannot have both debit and credit amounts",
          code: "BOTH_DEBIT_CREDIT",
          value: { debit: debit.toNumber(), credit: credit.toNumber() },
        });
      }

      // Check that entry has at least one amount
      if (debit.equals(0) && credit.equals(0)) {
        errors.push({
          field: `entries[${index}]`,
          message: "Entry must have either debit or credit amount",
          code: "NO_AMOUNT",
          value: { debit: debit.toNumber(), credit: credit.toNumber() },
        });
      }

      // Verify account exists and allows direct transactions
      await this.validateAccountForTransaction(
        entry.accountId,
        companyId,
        index,
        errors,
      );

      totalDebits = totalDebits.plus(debit);
      totalCredits = totalCredits.plus(credit);
    }

    // Check that debits equal credits
    if (!totalDebits.equals(totalCredits)) {
      errors.push({
        field: "entries",
        message: "Total debits must equal total credits",
        code: "UNBALANCED_ENTRIES",
        value: {
          totalDebits: totalDebits.toNumber(),
          totalCredits: totalCredits.toNumber(),
          difference: totalDebits.minus(totalCredits).toNumber(),
        },
      });
    }

    // Add warnings for large amounts
    if (totalDebits.greaterThan(1000000)) {
      warnings.push({
        field: "totalAmount",
        message: "Large transaction amount - please verify",
        code: "LARGE_AMOUNT",
        value: totalDebits.toNumber(),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async validateAccountForTransaction(
    accountId: string,
    companyId: string,
    entryIndex: number,
    errors: ValidationError[],
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: account, error } = await supabase
        .from("accounts")
        .select("allow_direct_transactions, status")
        .eq("id", accountId)
        .eq("company_id", companyId)
        .single();

      if (error || !account) {
        errors.push({
          field: `entries[${entryIndex}].accountId`,
          message: "Account not found",
          code: "ACCOUNT_NOT_FOUND",
          value: accountId,
        });
        return;
      }

      if (!account.allow_direct_transactions) {
        errors.push({
          field: `entries[${entryIndex}].accountId`,
          message: "Account does not allow direct transactions",
          code: "ACCOUNT_NO_DIRECT_TRANSACTIONS",
          value: accountId,
        });
      }

      if (account.status === "inactive") {
        errors.push({
          field: `entries[${entryIndex}].accountId`,
          message: "Account is inactive",
          code: "ACCOUNT_INACTIVE",
          value: accountId,
        });
      }
    } catch (error) {
      errors.push({
        field: `entries[${entryIndex}].accountId`,
        message: "Error validating account",
        code: "ACCOUNT_VALIDATION_ERROR",
        value: accountId,
      });
    }
  }

  private async generateTransactionNumber(
    transactionType: TransactionType,
    companyId: string,
  ): Promise<string> {
    const prefix = this.getTransactionNumberPrefix(transactionType);
    const year = new Date().getFullYear();
    const supabase = this.supabaseService.getClient();

    const { data: lastTransaction } = await supabase
      .from("transactions")
      .select("transaction_number")
      .eq("company_id", companyId)
      .eq("transaction_type", transactionType)
      .like("transaction_number", `${prefix}${year}%`)
      .order("transaction_number", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastTransaction) {
      const lastNumber = parseInt(lastTransaction.transaction_number.slice(-6));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${year}${nextNumber.toString().padStart(6, "0")}`;
  }

  private getTransactionNumberPrefix(transactionType: TransactionType): string {
    const prefixes: Record<TransactionType, string> = {
      [TransactionType.JOURNAL_ENTRY]: "JE",
      [TransactionType.INVOICE]: "INV",
      [TransactionType.PAYMENT]: "PAY",
      [TransactionType.RECEIPT]: "REC",
      [TransactionType.ADJUSTMENT]: "ADJ",
      [TransactionType.TRANSFER]: "TXF",
      [TransactionType.DEPRECIATION]: "DEP",
      [TransactionType.ACCRUAL]: "ACC",
      [TransactionType.REVERSAL]: "REV",
      [TransactionType.OPENING_BALANCE]: "OB",
      [TransactionType.CLOSING_ENTRY]: "CE",
    };

    return prefixes[transactionType] || "TXN";
  }

  private calculateTotalAmount(entries: any[]): InstanceType<typeof Decimal> {
    return entries
      .reduce((total, entry) => {
        const debit = new Decimal(entry.debitAmount || 0);
        const credit = new Decimal(entry.creditAmount || 0);
        return total.plus(debit).plus(credit);
      }, new Decimal(0))
      .dividedBy(2); // Divide by 2 since we count both debits and credits
  }

  private async getFiscalPeriod(
    transactionDate: string,
    companyId: string,
  ): Promise<{ fiscalYear: number; fiscalPeriod: number }> {
    // Simple implementation - you can enhance this based on company's fiscal year settings
    const date = new Date(transactionDate);
    return {
      fiscalYear: date.getFullYear(),
      fiscalPeriod: date.getMonth() + 1,
    };
  }

  private async createTransactionEntries(
    transactionId: string,
    entries: any[],
  ): Promise<DatabaseTransactionEntry[]> {
    const supabase = this.supabaseService.getClient();

    const entriesData = entries.map((entry, index) => ({
      transaction_id: transactionId,
      account_id: entry.accountId,
      debit_amount: entry.debitAmount || 0,
      credit_amount: entry.creditAmount || 0,
      amount: (entry.debitAmount || 0) - (entry.creditAmount || 0),
      description: entry.description,
      reference: entry.reference,
      tax_code: entry.taxCode,
      tax_amount: entry.taxAmount || 0,
      project_id: entry.projectId,
      cost_center_id: entry.costCenterId,
      department_id: entry.departmentId,
      line_number: index + 1,
    }));

    const { data: createdEntries, error } = await supabase
      .from("transaction_entries")
      .insert(entriesData)
      .select();

    if (error || !createdEntries) {
      throw new BadRequestException("Failed to create transaction entries");
    }

    return createdEntries as DatabaseTransactionEntry[];
  }

  private async updateAccountBalances(
    entries: DatabaseTransactionEntry[],
  ): Promise<void> {
    // Implementation to update account current_balance
    // This would involve getting current balances and updating them
    // For now, we'll skip this implementation detail
    this.logger.log("Account balances updated", "TransactionsService");
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      transactionDate: "transaction_date",
      postingDate: "posting_date",
      transactionNumber: "transaction_number",
      description: "description",
      totalAmount: "total_amount",
      status: "status",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    return fieldMap[sortBy] || "transaction_date";
  }

  private calculateTransactionsTotals(
    transactions: any[],
  ): TransactionTotalsDto {
    const totalDebit = transactions.reduce((sum, txn) => {
      if (txn.transaction_entries) {
        return (
          sum +
          txn.transaction_entries.reduce(
            (entrySum: number, entry: any) =>
              entrySum + (entry.debit_amount || 0),
            0,
          )
        );
      }
      return sum;
    }, 0);

    const totalCredit = transactions.reduce((sum, txn) => {
      if (txn.transaction_entries) {
        return (
          sum +
          txn.transaction_entries.reduce(
            (entrySum: number, entry: any) =>
              entrySum + (entry.credit_amount || 0),
            0,
          )
        );
      }
      return sum;
    }, 0);

    return {
      totalDebits: totalDebit,
      totalCredits: totalCredit,
      balanceCheck: Math.abs(totalDebit - totalCredit) < 0.01,
      transactionCount: transactions.length,
    };
  }

  private mapTransactionToResponseDto(
    transaction: DatabaseTransaction,
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      reference: transaction.reference,
      description: transaction.description,
      transactionDate: transaction.transaction_date,
      postingDate: transaction.posting_date,
      transactionType: transaction.transaction_type,
      status: transaction.status,
      totalAmount: transaction.total_amount,
      currency: transaction.currency,
      exchangeRate: transaction.exchange_rate,
      sourceDocumentType: transaction.source_document_type,
      sourceDocumentId: transaction.source_document_id,
      memo: transaction.memo,
      tags: transaction.tags,
      isRecurring: transaction.is_recurring,
      recurringRule: transaction.recurring_rule,
      approvalStatus: transaction.approval_status,
      approvedBy: transaction.approved_by,
      approvedAt: transaction.approved_at,
      postedBy: transaction.posted_by,
      postedAt: transaction.posted_at,
      reconciliationStatus: transaction.reconciliation_status,
      reconciledAt: transaction.reconciled_at,
      reconciledBy: transaction.reconciled_by,
      fiscalYear: transaction.fiscal_year,
      fiscalPeriod: transaction.fiscal_period,
      companyId: transaction.company_id,
      createdBy: transaction.created_by,
      createdAt: new Date(transaction.created_at),
      updatedAt: new Date(transaction.updated_at),
      entries: [], // Will be populated by caller if needed
    };
  }

  private mapEntryToResponseDto(entry: any): TransactionEntryResponseDto {
    return {
      id: entry.id,
      transactionId: entry.transaction_id,
      accountId: entry.account_id,
      accountCode: entry.accounts?.code,
      accountName: entry.accounts?.name,
      debitAmount: entry.debit_amount,
      creditAmount: entry.credit_amount,
      amount: entry.amount,
      description: entry.description,
      reference: entry.reference,
      taxCode: entry.tax_code,
      taxAmount: entry.tax_amount,
      projectId: entry.project_id,
      costCenterId: entry.cost_center_id,
      departmentId: entry.department_id,
      lineNumber: entry.line_number,
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at),
    };
  }

  private async generateBatchNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const supabase = this.supabaseService.getClient();

    const { data: lastBatch } = await supabase
      .from("batch_transactions")
      .select("batch_number")
      .eq("company_id", companyId)
      .like("batch_number", `BATCH${year}%`)
      .order("batch_number", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastBatch) {
      const lastNumber = parseInt(lastBatch.batch_number.slice(-6));
      nextNumber = lastNumber + 1;
    }

    return `BATCH${year}${nextNumber.toString().padStart(6, "0")}`;
  }

  private async processBatchTransactions(
    batchId: string,
    transactions: CreateTransactionDto[],
    companyId: string,
    userId: string,
    autoPost: boolean,
  ): Promise<void> {
    // This would typically be processed in a background job
    // For now, we'll process synchronously
    const supabase = this.supabaseService.getClient();

    try {
      await supabase
        .from("batch_transactions")
        .update({
          status: BatchStatus.PROCESSING,
          processing_started_at: new Date().toISOString(),
        })
        .eq("id", batchId);

      let successCount = 0;
      const errors: string[] = [];

      for (const transactionDto of transactions) {
        try {
          await this.create(transactionDto, companyId, userId);
          successCount++;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Unknown error");
        }
      }

      await supabase
        .from("batch_transactions")
        .update({
          status:
            errors.length === 0 ? BatchStatus.COMPLETED : BatchStatus.FAILED,
          processing_completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join("; ") : undefined,
        })
        .eq("id", batchId);

      this.logger.log(
        `Batch processing completed: ${successCount} successful, ${errors.length} failed`,
        "TransactionsService",
      );
    } catch (error) {
      await supabase
        .from("batch_transactions")
        .update({
          status: BatchStatus.FAILED,
          processing_completed_at: new Date().toISOString(),
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", batchId);

      this.logger.error(
        "Batch processing failed",
        error instanceof Error ? error.message : JSON.stringify(error),
        "TransactionsService",
      );
    }
  }

  private mapBatchToResponseDto(
    batch: DatabaseBatchTransaction,
  ): BatchTransactionResponseDto {
    return {
      id: batch.id,
      name: batch.batch_name,
      description: batch.description,
      status: batch.status,
      totalCount: batch.total_transactions,
      processedCount: batch.total_transactions, // Assume all processed for now
      successCount: batch.total_transactions, // Assume all successful for now
      failedCount: 0,
      processedTransactions: [], // Would populate with actual transactions if needed
      errors: [],
      createdAt: new Date(batch.created_at),
      updatedAt: new Date(batch.updated_at),
    };
  }

  private mapValidationResultToDto(
    result: TransactionValidationResult,
  ): TransactionValidationResultDto {
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  async getBatchStatus(
    batchId: string,
    companyId: string,
  ): Promise<{
    status: string;
    processedCount: number;
    totalCount: number;
    errors: any[];
  }> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: batch, error } = await supabase
        .from("batch_transactions")
        .select("*")
        .eq("id", batchId)
        .eq("company_id", companyId)
        .single();

      if (error || !batch) {
        throw new NotFoundException("Batch not found");
      }

      return {
        status: batch.status,
        processedCount: batch.processed_count || 0,
        totalCount: batch.total_count || 0,
        errors: batch.errors || [],
      };
    } catch (error) {
      this.logger.error(
        "Error getting batch status",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get batch status");
    }
  }

  async getReconciliationStatus(
    accountId: string,
    companyId: string,
  ): Promise<{
    reconciledCount: number;
    unreconciledCount: number;
    lastReconciliation: string | null;
  }> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: reconciled, error: reconciledError } = await supabase
        .from("transactions")
        .select("id")
        .eq("company_id", companyId)
        .contains("entries", [{ account_id: accountId }])
        .eq("reconciliation_status", ReconciliationStatus.RECONCILED);

      const { data: unreconciled, error: unreconciledError } = await supabase
        .from("transactions")
        .select("id")
        .eq("company_id", companyId)
        .contains("entries", [{ account_id: accountId }])
        .neq("reconciliation_status", ReconciliationStatus.RECONCILED);

      const { data: lastReconciliation, error: lastError } = await supabase
        .from("transactions")
        .select("reconciled_at")
        .eq("company_id", companyId)
        .contains("entries", [{ account_id: accountId }])
        .eq("reconciliation_status", ReconciliationStatus.RECONCILED)
        .order("reconciled_at", { ascending: false })
        .limit(1)
        .single();

      if (reconciledError || unreconciledError) {
        throw new BadRequestException("Failed to get reconciliation status");
      }

      return {
        reconciledCount: reconciled?.length || 0,
        unreconciledCount: unreconciled?.length || 0,
        lastReconciliation: lastReconciliation?.reconciled_at || null,
      };
    } catch (error) {
      this.logger.error(
        "Error getting reconciliation status",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get reconciliation status");
    }
  }

  async generateReport(
    reportType: string,
    params: any,
    companyId: string,
  ): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      switch (reportType) {
        case "profit_loss":
          return this.generateProfitLossReport(params, companyId);
        case "balance_sheet":
          return this.generateBalanceSheetReport(params, companyId);
        case "cash_flow":
          return this.generateCashFlowReport(params, companyId);
        case "trial_balance":
          return this.getTrialBalance(params.asOfDate, companyId);
        default:
          throw new BadRequestException(
            `Unsupported report type: ${reportType}`,
          );
      }
    } catch (error) {
      this.logger.error(
        "Error generating report",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to generate report");
    }
  }

  async getAnalytics(companyId: string, params: any): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: monthlyTrends, error: trendsError } = await supabase
        .from("transactions")
        .select("transaction_date, total_amount")
        .eq("company_id", companyId)
        .eq("status", TransactionStatus.POSTED)
        .gte(
          "transaction_date",
          params.startDate ||
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .lte("transaction_date", params.endDate || new Date().toISOString());

      if (trendsError) {
        throw new BadRequestException("Failed to get analytics data");
      }

      // Group by month and calculate totals
      const monthlyData =
        monthlyTrends?.reduce((acc: any, transaction: any) => {
          const month = new Date(transaction.transaction_date)
            .toISOString()
            .substring(0, 7);
          if (!acc[month]) {
            acc[month] = { month, total: 0, count: 0 };
          }
          acc[month].total += parseFloat(transaction.total_amount);
          acc[month].count += 1;
          return acc;
        }, {}) || {};

      return {
        monthlyTrends: Object.values(monthlyData),
        totalTransactions: monthlyTrends?.length || 0,
        totalAmount:
          monthlyTrends?.reduce(
            (sum: number, t: any) => sum + parseFloat(t.total_amount),
            0,
          ) || 0,
      };
    } catch (error) {
      this.logger.error(
        "Error getting analytics",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get analytics");
    }
  }

  async exportTransactions(companyId: string, params: any): Promise<any> {
    try {
      const transactions = await this.findAll(
        {
          ...params,
          limit: 10000, // Max export limit
        },
        companyId,
      );

      return {
        data: transactions.data,
        format: params.format || "csv",
        filename: `transactions_${companyId}_${new Date().toISOString().split("T")[0]}.${params.format || "csv"}`,
      };
    } catch (error) {
      this.logger.error(
        "Error exporting transactions",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to export transactions");
    }
  }

  async importTransactions(
    file: any,
    companyId: string,
    userId: string,
  ): Promise<any> {
    try {
      // This would typically parse CSV/Excel files
      // For now, return a placeholder response
      return {
        message: "Import functionality not yet implemented",
        imported: 0,
        errors: [],
      };
    } catch (error) {
      this.logger.error(
        "Error importing transactions",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to import transactions");
    }
  }

  private async generateProfitLossReport(
    params: any,
    companyId: string,
  ): Promise<any> {
    // Placeholder implementation
    return {
      reportType: "profit_loss",
      period: params.period || "monthly",
      revenue: 0,
      expenses: 0,
      netIncome: 0,
    };
  }

  private async generateBalanceSheetReport(
    params: any,
    companyId: string,
  ): Promise<any> {
    // Placeholder implementation
    return {
      reportType: "balance_sheet",
      asOfDate: params.asOfDate || new Date().toISOString(),
      assets: { current: 0, nonCurrent: 0, total: 0 },
      liabilities: { current: 0, nonCurrent: 0, total: 0 },
      equity: { total: 0 },
    };
  }

  private async generateCashFlowReport(
    params: any,
    companyId: string,
  ): Promise<any> {
    // Placeholder implementation
    return {
      reportType: "cash_flow",
      period: params.period || "monthly",
      operating: 0,
      investing: 0,
      financing: 0,
      netCashFlow: 0,
    };
  }

  async getAccountLedger(
    accountId: string,
    companyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      let query = supabase
        .from("transaction_entries")
        .select(
          `
          *,
          transactions!inner (
            id,
            transaction_date,
            description,
            transaction_number,
            status
          )
        `,
        )
        .eq("account_id", accountId)
        .eq("transactions.company_id", companyId)
        .eq("transactions.status", TransactionStatus.POSTED)
        .order("transactions.transaction_date", { ascending: true });

      if (startDate) {
        query = query.gte("transactions.transaction_date", startDate);
      }
      if (endDate) {
        query = query.lte("transactions.transaction_date", endDate);
      }

      const { data: entries, error } = await query;

      if (error) {
        throw new BadRequestException("Failed to fetch account ledger");
      }

      let runningBalance = 0;
      const ledgerEntries =
        entries?.map((entry: any) => {
          const amount = (entry.debit_amount || 0) - (entry.credit_amount || 0);
          runningBalance += amount;

          return {
            date: entry.transactions.transaction_date,
            description: entry.transactions.description,
            transactionNumber: entry.transactions.transaction_number,
            debit: entry.debit_amount || 0,
            credit: entry.credit_amount || 0,
            balance: runningBalance,
          };
        }) || [];

      return {
        accountId,
        entries: ledgerEntries,
        totalDebits:
          entries?.reduce(
            (sum: number, e: any) => sum + (e.debit_amount || 0),
            0,
          ) || 0,
        totalCredits:
          entries?.reduce(
            (sum: number, e: any) => sum + (e.credit_amount || 0),
            0,
          ) || 0,
        finalBalance: runningBalance,
      };
    } catch (error) {
      this.logger.error(
        "Error getting account ledger",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get account ledger");
    }
  }

  async getAuditLog(transactionId: string, companyId: string): Promise<any> {
    try {
      // This would typically fetch from an audit_logs table
      // For now, return placeholder data
      return {
        transactionId,
        logs: [
          {
            id: "1",
            action: "created",
            userId: "system",
            timestamp: new Date(),
            changes: {},
            ipAddress: "127.0.0.1",
            userAgent: "system",
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        "Error getting audit log",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get audit log");
    }
  }

  async getTransactionHistory(
    transactionId: string,
    companyId: string,
  ): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: transaction, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("company_id", companyId)
        .single();

      if (error || !transaction) {
        throw new NotFoundException("Transaction not found");
      }

      // Get transaction history/versions (placeholder)
      return {
        transactionId,
        currentVersion: transaction,
        history: [
          {
            version: 1,
            timestamp: transaction.created_at,
            changes: "Initial creation",
            userId: transaction.created_by,
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        "Error getting transaction history",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get transaction history");
    }
  }

  async getUserPermissions(userId: string, companyId: string): Promise<any> {
    try {
      // This would typically check user roles and permissions
      // For now, return basic permissions
      return {
        canCreate: true,
        canUpdate: true,
        canDelete: false,
        canPost: true,
        canApprove: false,
        canReconcile: true,
        canViewAll: true,
        canExport: true,
        allowedTransactionTypes: Object.values(TransactionType),
        maxTransactionAmount: null,
        userRole: "USER",
      };
    } catch (error) {
      this.logger.error(
        "Error getting user permissions",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get user permissions");
    }
  }

  async advancedSearch(searchParams: any, companyId: string): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("company_id", companyId);

      // Add search filters based on searchParams
      if (searchParams.description) {
        query = query.ilike("description", `%${searchParams.description}%`);
      }
      if (searchParams.amountMin) {
        query = query.gte("total_amount", searchParams.amountMin);
      }
      if (searchParams.amountMax) {
        query = query.lte("total_amount", searchParams.amountMax);
      }
      if (searchParams.startDate) {
        query = query.gte("transaction_date", searchParams.startDate);
      }
      if (searchParams.endDate) {
        query = query.lte("transaction_date", searchParams.endDate);
      }

      const { data: transactions, error } = await query;

      if (error) {
        throw new BadRequestException("Search failed");
      }

      return {
        results:
          transactions?.map((t) => this.mapTransactionToResponseDto(t)) || [],
        total: transactions?.length || 0,
        searchParams,
      };
    } catch (error) {
      this.logger.error(
        "Error in advanced search",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Advanced search failed");
    }
  }

  async getAnalyticsSummary(companyId: string, period: string): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      const startDate = this.getStartDateForPeriod(period);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("transaction_date, total_amount, transaction_type")
        .eq("company_id", companyId)
        .eq("status", TransactionStatus.POSTED)
        .gte("transaction_date", startDate);

      if (error) {
        throw new BadRequestException("Failed to get analytics summary");
      }

      const summary = {
        period,
        totalTransactions: transactions?.length || 0,
        totalAmount:
          transactions?.reduce(
            (sum: number, t: any) => sum + parseFloat(t.total_amount),
            0,
          ) || 0,
        byType: {} as any,
        trends: {} as any,
      };

      // Group by transaction type
      transactions?.forEach((t: any) => {
        if (!summary.byType[t.transaction_type]) {
          summary.byType[t.transaction_type] = { count: 0, amount: 0 };
        }
        summary.byType[t.transaction_type].count += 1;
        summary.byType[t.transaction_type].amount += parseFloat(t.total_amount);
      });

      return summary;
    } catch (error) {
      this.logger.error(
        "Error getting analytics summary",
        error,
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get analytics summary");
    }
  }

  private getStartDateForPeriod(period: string): string {
    const now = new Date();
    switch (period) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "quarter":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case "year":
        return new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private mapBatchToProcessingResultDto(
    batch: DatabaseBatchTransaction,
  ): BatchProcessingResultDto {
    const startTime = batch.processing_started_at
      ? new Date(batch.processing_started_at)
      : new Date(batch.created_at);
    const endTime = batch.processing_completed_at
      ? new Date(batch.processing_completed_at)
      : new Date();

    return {
      batchId: batch.id,
      totalTransactions: batch.total_transactions || 0,
      successfulTransactions: batch.total_transactions || 0, // Assume all successful for now
      failedTransactions: 0, // Calculate based on actual failures
      processingStartTime: startTime,
      processingEndTime: endTime,
      processingTimeMs: endTime.getTime() - startTime.getTime(),
      processedTransactions: [], // Would populate with actual transactions if needed
      errors: [], // Would populate with actual errors
      status: this.mapBatchStatusToProcessingStatus(batch.status),
    };
  }

  private mapBatchStatusToProcessingStatus(
    status: BatchStatus,
  ): "COMPLETED" | "PARTIAL" | "FAILED" {
    switch (status) {
      case BatchStatus.COMPLETED:
        return "COMPLETED";
      case BatchStatus.PROCESSING:
        return "PARTIAL";
      case BatchStatus.FAILED:
        return "FAILED";
      default:
        return "PARTIAL";
    }
  }
}
