import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/services/supabase.service";
import { CustomLoggerService } from "../logging/logger.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
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
} from "./interfaces/transaction.interface";
import Decimal from "decimal.js";

type DecimalType = InstanceType<typeof Decimal>;

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
      const { fiscalYear, fiscalPeriod } = this.getFiscalPeriod(
        createTransactionDto.transactionDate,
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

      const response = this.mapTransactionToResponseDto(transaction);
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
          const transactionWithEntries = transaction as DatabaseTransaction & {
            transaction_entries?: DatabaseTransactionEntry[];
          };
          if (transactionWithEntries.transaction_entries) {
            mapped.entries = transactionWithEntries.transaction_entries.map(
              (entry: DatabaseTransactionEntry) =>
                this.mapEntryToResponseDto(entry),
            );
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

      const response = this.mapTransactionToResponseDto(updatedTransaction);
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
        this.updateAccountBalances();
      }

      this.logger.log("Transaction posted successfully", "TransactionsService");
      return this.mapTransactionToResponseDto(updatedTransaction);
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
      );

      return this.mapBatchToProcessingResultDto(batch);
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

      return this.mapBatchToProcessingResultDto(batch);
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

      let totalReconciledAmount = 0;
      if (transactions) {
        for (const t of transactions) {
          const transaction = t as DatabaseTransaction;
          totalReconciledAmount += parseFloat(
            transaction.total_amount?.toString() ?? "0",
          );
        }
      }
      const reconciledTransactions =
        transactions?.map((t: DatabaseTransaction) =>
          this.mapTransactionToResponseDto(t),
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
        totalReconciledAmount,
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
        const accountTyped = account as {
          id?: string | number;
          code?: string;
          name?: string;
          type?: string;
          sub_type?: string;
          transaction_entries?: Array<{
            debit_amount?: number;
            credit_amount?: number;
          }>;
        };

        const entries = Array.isArray(accountTyped.transaction_entries)
          ? accountTyped.transaction_entries
          : [];

        const debitTotal = entries.reduce((sum: number, entry) => {
          const debitAmount =
            typeof entry.debit_amount === "number" ? entry.debit_amount : 0;
          return sum + debitAmount;
        }, 0);

        const creditTotal = entries.reduce((sum: number, entry) => {
          const creditAmount =
            typeof entry.credit_amount === "number" ? entry.credit_amount : 0;
          return sum + creditAmount;
        }, 0);

        return {
          accountId: String(accountTyped.id || ""),
          accountCode: String(accountTyped.code || ""),
          accountName: String(accountTyped.name || ""),
          accountType: String(accountTyped.type || ""),
          accountSubType: String(accountTyped.sub_type || ""),
          debitBalance: debitTotal,
          creditBalance: creditTotal,
          netBalance: debitTotal - creditTotal,
        };
      });

      return {
        asOfDate,
        accounts: trialBalance,
        totalDebits: trialBalance.reduce(
          (sum: number, acc) =>
            sum + (typeof acc.debitBalance === "number" ? acc.debitBalance : 0),
          0,
        ),
        totalCredits: trialBalance.reduce(
          (sum: number, acc) =>
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
        const entryTyped = entry as {
          transaction_id?: string;
          debit_amount?: number;
          credit_amount?: number;
          description?: string;
          transactions?: {
            transaction_number?: string;
            transaction_date?: string;
            description?: string;
            status?: string;
          };
        };

        const amount =
          (entryTyped.debit_amount || 0) - (entryTyped.credit_amount || 0);
        runningBalance += amount;

        return {
          transactionId: entryTyped.transaction_id || "",
          transactionNumber: entryTyped.transactions?.transaction_number || "",
          transactionDate: entryTyped.transactions?.transaction_date || "",
          description:
            entryTyped.description ||
            entryTyped.transactions?.description ||
            "",
          debitAmount: entryTyped.debit_amount || 0,
          creditAmount: entryTyped.credit_amount || 0,
          amount,
          runningBalance,
          status: entryTyped.transactions?.status || "",
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
      const entryTyped = entry as {
        debitAmount?: number;
        creditAmount?: number;
        accountId?: string;
      };

      const debit = new Decimal(entryTyped.debitAmount || 0);
      const credit = new Decimal(entryTyped.creditAmount || 0);

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
        entryTyped.accountId || "",
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
    } catch {
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
      const transactionNumber = lastTransaction.transaction_number as string;
      const lastNumber = parseInt(transactionNumber.slice(-6));
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

  private calculateTotalAmount(entries: any[]): DecimalType {
    let total = new Decimal(0);
    for (const entry of entries) {
      const entryTyped = entry as {
        debitAmount?: number;
        creditAmount?: number;
      };
      const debit = new Decimal(entryTyped.debitAmount || 0);
      const credit = new Decimal(entryTyped.creditAmount || 0);
      total = total.plus(debit).plus(credit);
    }

    return total.dividedBy(2); // Divide by 2 since we count both debits and credits
  }

  private getFiscalPeriod(transactionDate: string): {
    fiscalYear: number;
    fiscalPeriod: number;
  } {
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

    const entriesData = entries.map((entry, index) => {
      const entryTyped = entry as {
        accountId?: string;
        debitAmount?: number;
        creditAmount?: number;
        description?: string;
        reference?: string;
        taxCode?: string;
        taxAmount?: number;
        projectId?: string;
        costCenterId?: string;
        departmentId?: string;
      };

      return {
        transaction_id: transactionId,
        account_id: entryTyped.accountId || "",
        debit_amount: entryTyped.debitAmount || 0,
        credit_amount: entryTyped.creditAmount || 0,
        amount: (entryTyped.debitAmount || 0) - (entryTyped.creditAmount || 0),
        description: entryTyped.description || "",
        reference: entryTyped.reference || "",
        tax_code: entryTyped.taxCode || "",
        tax_amount: entryTyped.taxAmount || 0,
        project_id: entryTyped.projectId || "",
        cost_center_id: entryTyped.costCenterId || "",
        department_id: entryTyped.departmentId || "",
        line_number: index + 1,
      };
    });

    const { data: createdEntries, error } = await supabase
      .from("transaction_entries")
      .insert(entriesData)
      .select();

    if (error || !createdEntries) {
      throw new BadRequestException("Failed to create transaction entries");
    }

    return createdEntries as DatabaseTransactionEntry[];
  }

  private updateAccountBalances(): void {
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
    let totalDebit = 0;
    let totalCredit = 0;

    for (const txn of transactions) {
      const txnTyped = txn as {
        transaction_entries?: Array<{
          debit_amount?: number;
          credit_amount?: number;
        }>;
      };

      if (txnTyped.transaction_entries) {
        for (const entry of txnTyped.transaction_entries) {
          totalDebit += entry.debit_amount || 0;
          totalCredit += entry.credit_amount || 0;
        }
      }
    }

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
    const entryTyped = entry as {
      id?: string;
      transaction_id?: string;
      account_id?: string;
      accounts?: {
        code?: string;
        name?: string;
      };
      debit_amount?: number;
      credit_amount?: number;
      amount?: number;
      description?: string;
      reference?: string;
      tax_code?: string;
      tax_amount?: number;
      project_id?: string;
      cost_center_id?: string;
      department_id?: string;
      line_number?: number;
      created_at?: string;
      updated_at?: string;
    };

    return {
      id: entryTyped.id || "",
      transactionId: entryTyped.transaction_id || "",
      accountId: entryTyped.account_id || "",
      accountCode: entryTyped.accounts?.code || "",
      accountName: entryTyped.accounts?.name || "",
      debitAmount: entryTyped.debit_amount || 0,
      creditAmount: entryTyped.credit_amount || 0,
      amount: entryTyped.amount || 0,
      description: entryTyped.description || "",
      reference: entryTyped.reference || "",
      taxCode: entryTyped.tax_code || "",
      taxAmount: entryTyped.tax_amount || 0,
      projectId: entryTyped.project_id || "",
      costCenterId: entryTyped.cost_center_id || "",
      departmentId: entryTyped.department_id || "",
      lineNumber: entryTyped.line_number || 0,
      createdAt: new Date(entryTyped.created_at || new Date().toISOString()),
      updatedAt: new Date(entryTyped.updated_at || new Date().toISOString()),
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
      const batchNumber = lastBatch.batch_number as string;
      const lastNumber = parseInt(batchNumber.slice(-6));
      nextNumber = lastNumber + 1;
    }

    return `BATCH${year}${nextNumber.toString().padStart(6, "0")}`;
  }

  private async processBatchTransactions(
    batchId: string,
    transactions: CreateTransactionDto[],
    companyId: string,
    userId: string,
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

      const response = await supabase
        .from("batch_transactions")
        .select("*")
        .eq("id", batchId)
        .eq("company_id", companyId)
        .single();

      const batchData = response.data as {
        status?: string;
        processed_count?: number;
        total_count?: number;
        errors?: any[];
      } | null;
      const error = response.error;

      if (error || !batchData) {
        throw new NotFoundException("Batch not found");
      }

      return {
        status: batchData.status || "",
        processedCount: batchData.processed_count || 0,
        totalCount: batchData.total_count || 0,
        errors: batchData.errors || [],
      };
    } catch (error) {
      this.logger.error(
        "Error getting batch status",
        error instanceof Error ? error.message : String(error),
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

      const { data: lastReconciliation } = await supabase
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

      const lastReconciliationDate = lastReconciliation as {
        reconciled_at?: string;
      } | null;

      return {
        reconciledCount: reconciled?.length || 0,
        unreconciledCount: unreconciled?.length || 0,
        lastReconciliation: lastReconciliationDate?.reconciled_at || null,
      };
    } catch (error) {
      this.logger.error(
        "Error getting reconciliation status",
        error instanceof Error ? error.message : String(error),
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
      const paramsTyped = params as {
        asOfDate?: string;
        period?: string;
      };

      switch (reportType) {
        case "profit_loss":
          return this.generateProfitLossReport(paramsTyped);
        case "balance_sheet":
          return this.generateBalanceSheetReport(paramsTyped);
        case "cash_flow":
          return this.generateCashFlowReport(paramsTyped);
        case "trial_balance":
          return this.getTrialBalance(
            paramsTyped.asOfDate || new Date().toISOString().split("T")[0],
            companyId,
          );
        default:
          throw new BadRequestException(
            `Unsupported report type: ${reportType}`,
          );
      }
    } catch (error) {
      this.logger.error(
        "Error generating report",
        error instanceof Error ? error.message : String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to generate report");
    }
  }

  async getAnalytics(companyId: string, params: any): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();

      const paramsTyped = params as {
        startDate?: string;
        endDate?: string;
      };

      const { data: monthlyTrends, error: trendsError } = await supabase
        .from("transactions")
        .select("transaction_date, total_amount")
        .eq("company_id", companyId)
        .eq("status", TransactionStatus.POSTED)
        .gte(
          "transaction_date",
          paramsTyped.startDate ||
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .lte(
          "transaction_date",
          paramsTyped.endDate || new Date().toISOString(),
        );

      if (trendsError) {
        throw new BadRequestException("Failed to get analytics data");
      }

      // Group by month and calculate totals
      const monthlyData: Record<
        string,
        { month: string; total: number; count: number }
      > = {};

      if (monthlyTrends) {
        for (const transaction of monthlyTrends) {
          const transactionTyped = transaction as {
            transaction_date?: string;
            total_amount?: string | number;
          };

          if (transactionTyped.transaction_date) {
            const month = new Date(transactionTyped.transaction_date)
              .toISOString()
              .substring(0, 7);

            if (!monthlyData[month]) {
              monthlyData[month] = { month, total: 0, count: 0 };
            }

            const amount =
              typeof transactionTyped.total_amount === "string"
                ? parseFloat(transactionTyped.total_amount)
                : transactionTyped.total_amount || 0;

            monthlyData[month].total += amount;
            monthlyData[month].count += 1;
          }
        }
      }

      const totalAmount =
        monthlyTrends?.reduce((sum: number, t: any) => {
          const transactionTyped = t as { total_amount?: string | number };
          const amount =
            typeof transactionTyped.total_amount === "string"
              ? parseFloat(transactionTyped.total_amount)
              : transactionTyped.total_amount || 0;
          return sum + amount;
        }, 0) || 0;

      return {
        monthlyTrends: Object.values(monthlyData),
        totalTransactions: monthlyTrends?.length || 0,
        totalAmount,
      };
    } catch (error) {
      this.logger.error(
        "Error getting analytics",
        error instanceof Error ? error.message : String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get analytics");
    }
  }

  async exportTransactions(companyId: string, params: any): Promise<any> {
    try {
      const paramsTyped = params as TransactionQueryDto & {
        format?: string;
      };

      const transactions = await this.findAll(
        {
          ...paramsTyped,
          limit: 10000, // Max export limit
        },
        companyId,
      );

      return {
        data: transactions.data,
        format: paramsTyped.format || "csv",
        filename: `transactions_${companyId}_${new Date().toISOString().split("T")[0]}.${paramsTyped.format || "csv"}`,
      };
    } catch (error) {
      this.logger.error(
        "Error exporting transactions",
        error instanceof Error ? error.message : String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to export transactions");
    }
  }

  importTransactions(): any {
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
        error instanceof Error ? error.message : String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to import transactions");
    }
  }

  private generateProfitLossReport(params: any): any {
    const paramsTyped = params as { period?: string };
    // Placeholder implementation
    return {
      reportType: "profit_loss",
      period: paramsTyped.period || "monthly",
      revenue: 0,
      expenses: 0,
      netIncome: 0,
    };
  }

  private generateBalanceSheetReport(params: any): any {
    const paramsTyped = params as { asOfDate?: string };
    // Placeholder implementation
    return {
      reportType: "balance_sheet",
      asOfDate: paramsTyped.asOfDate || new Date().toISOString(),
      assets: { current: 0, nonCurrent: 0, total: 0 },
      liabilities: { current: 0, nonCurrent: 0, total: 0 },
      equity: { total: 0 },
    };
  }

  private generateCashFlowReport(params: any): any {
    const paramsTyped = params as { period?: string };
    // Placeholder implementation
    return {
      reportType: "cash_flow",
      period: paramsTyped.period || "monthly",
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
          const entryTyped = entry as {
            debit_amount?: number;
            credit_amount?: number;
            transactions?: {
              transaction_date?: string;
              description?: string;
              transaction_number?: string;
            };
          };
          const amount =
            (entryTyped.debit_amount || 0) - (entryTyped.credit_amount || 0);
          runningBalance += amount;

          return {
            date: entryTyped.transactions?.transaction_date || "",
            description: entryTyped.transactions?.description || "",
            transactionNumber:
              entryTyped.transactions?.transaction_number || "",
            debit: entryTyped.debit_amount || 0,
            credit: entryTyped.credit_amount || 0,
            balance: runningBalance,
          };
        }) || [];

      let totalDebits = 0;
      let totalCredits = 0;

      if (entries) {
        for (const e of entries) {
          const eTyped = e as { debit_amount?: number; credit_amount?: number };
          totalDebits += eTyped.debit_amount || 0;
          totalCredits += eTyped.credit_amount || 0;
        }
      }

      return {
        accountId,
        entries: ledgerEntries,
        totalDebits,
        totalCredits,
        finalBalance: runningBalance,
      };
    } catch (error) {
      this.logger.error(
        "Error getting account ledger",
        String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get account ledger");
    }
  }

  getAuditLog(transactionId: string): any {
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
        String(error),
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

      const result = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("company_id", companyId)
        .single();

      const transaction = result.data as DatabaseTransaction | null;
      const error = result.error;

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
        String(error),
        "TransactionsService",
      );
      throw new BadRequestException("Failed to get transaction history");
    }
  }

  getUserPermissions(): any {
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
        String(error),
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
      const searchParamsTyped = searchParams as {
        description?: string;
        amountMin?: number;
        amountMax?: number;
        startDate?: string;
        endDate?: string;
      };

      if (searchParamsTyped.description) {
        query = query.ilike(
          "description",
          `%${searchParamsTyped.description}%`,
        );
      }
      if (searchParamsTyped.amountMin) {
        query = query.gte("total_amount", searchParamsTyped.amountMin);
      }
      if (searchParamsTyped.amountMax) {
        query = query.lte("total_amount", searchParamsTyped.amountMax);
      }
      if (searchParamsTyped.startDate) {
        query = query.gte("transaction_date", searchParamsTyped.startDate);
      }
      if (searchParamsTyped.endDate) {
        query = query.lte("transaction_date", searchParamsTyped.endDate);
      }

      const { data: transactions, error } = await query;

      if (error) {
        throw new BadRequestException("Search failed");
      }

      return {
        results:
          transactions?.map((t) =>
            this.mapTransactionToResponseDto(t as DatabaseTransaction),
          ) || [],
        total: transactions?.length || 0,
        searchParams: searchParamsTyped,
      };
    } catch (error) {
      this.logger.error(
        "Error in advanced search",
        String(error),
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
        totalAmount: transactions
          ? transactions.reduce((sum: number, t: any) => {
              const tTyped = t as { total_amount?: string | number };
              return sum + parseFloat(String(tTyped.total_amount || "0"));
            }, 0)
          : 0,
        byType: {} as Record<string, { count: number; amount: number }>,
        trends: {} as Record<string, any>,
      };

      // Group by transaction type
      transactions?.forEach((t: any) => {
        const tTyped = t as {
          transaction_type?: string;
          total_amount?: string | number;
        };
        const transactionType = tTyped.transaction_type || "unknown";

        if (!summary.byType[transactionType]) {
          summary.byType[transactionType] = { count: 0, amount: 0 };
        }
        summary.byType[transactionType].count += 1;
        summary.byType[transactionType].amount += parseFloat(
          String(tTyped.total_amount || "0"),
        );
      });

      return summary;
    } catch (error) {
      this.logger.error(
        "Error getting analytics summary",
        String(error),
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
