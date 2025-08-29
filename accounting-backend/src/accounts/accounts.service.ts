import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/services/supabase.service";
import { CustomLoggerService } from "../logging/logger.service";
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  AccountQueryDto,
  AccountListResponseDto,
  AccountHierarchyDto,
  AccountBalanceDto,
  GenerateAccountCodeDto,
  AccountCodeResponseDto,
  BulkAccountOperationDto,
  AccountType,
  AccountSubType,
  AccountStatus,
} from "./dto/account.dto";
import type {
  DatabaseAccount,
  TransactionEntry,
} from "./interfaces/database-account.interface";
import Decimal from "decimal.js";

@Injectable()
export class AccountsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    createAccountDto: CreateAccountDto,
    companyId: string,
  ): Promise<AccountResponseDto> {
    try {
      // Validate account code uniqueness
      await this.validateAccountCodeUniqueness(
        createAccountDto.code,
        companyId,
      );

      // Validate parent account if specified
      if (createAccountDto.parentAccountId) {
        await this.validateParentAccount(
          createAccountDto.parentAccountId,
          companyId,
        );
        createAccountDto.level =
          (await this.calculateAccountLevel(createAccountDto.parentAccountId)) +
          1;
      }

      // Validate account hierarchy rules
      await this.validateAccountHierarchy(createAccountDto, companyId);

      const supabase = this.supabaseService.getClient();

      const accountData = {
        code: createAccountDto.code,
        name: createAccountDto.name,
        description: createAccountDto.description,
        type: createAccountDto.type,
        sub_type: createAccountDto.subType,
        parent_account_id: createAccountDto.parentAccountId,
        level: createAccountDto.level || 0,
        is_control_account: createAccountDto.isControlAccount || false,
        allow_direct_transactions:
          createAccountDto.allowDirectTransactions ?? true,
        currency: createAccountDto.currency || "INR",
        opening_balance: new Decimal(
          createAccountDto.openingBalance || 0,
        ).toNumber(),
        opening_balance_date: createAccountDto.openingBalanceDate,
        current_balance: new Decimal(
          createAccountDto.openingBalance || 0,
        ).toNumber(),
        tax_code: createAccountDto.taxCode,
        is_taxable: createAccountDto.isTaxable || false,
        is_depreciable: createAccountDto.isDepreciable || false,
        depreciation_rate: createAccountDto.depreciationRate,
        depreciation_method: createAccountDto.depreciationMethod,
        status: createAccountDto.status || AccountStatus.ACTIVE,
        company_id: companyId,
      };

      const response = await supabase
        .from("accounts")
        .insert(accountData)
        .select()
        .single();

      if (response.error || !response.data) {
        this.logger.error(
          "Error creating account",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to create account");
      }

      this.logger.log("Account created successfully", "AccountsService");
      return this.mapToResponseDto(response.data as DatabaseAccount);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error creating account",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to create account");
    }
  }

  async findAll(
    query: AccountQueryDto,
    companyId: string,
  ): Promise<AccountListResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      let queryBuilder = supabase
        .from("accounts")
        .select("*", { count: "exact" })
        .eq("company_id", companyId);

      // Apply filters
      if (query.search) {
        queryBuilder = queryBuilder.or(
          `code.ilike.%${query.search}%,name.ilike.%${query.search}%`,
        );
      }

      if (query.type) {
        queryBuilder = queryBuilder.eq("type", query.type);
      }

      if (query.subType) {
        queryBuilder = queryBuilder.eq("sub_type", query.subType);
      }

      if (query.parentAccountId) {
        queryBuilder = queryBuilder.eq(
          "parent_account_id",
          query.parentAccountId,
        );
      }

      if (query.level !== undefined) {
        queryBuilder = queryBuilder.eq("level", query.level);
      }

      if (!query.includeInactive) {
        queryBuilder = queryBuilder.neq("status", AccountStatus.INACTIVE);
      }

      if (query.status) {
        queryBuilder = queryBuilder.eq("status", query.status);
      }

      // Apply sorting
      const sortField = this.mapSortField(query.sortBy || "code");
      queryBuilder = queryBuilder.order(sortField, {
        ascending: query.sortOrder === "asc",
      });

      // Apply pagination for non-hierarchical queries
      if (!query.hierarchical) {
        const offset = ((query.page || 1) - 1) * (query.limit || 50);
        queryBuilder = queryBuilder.range(
          offset,
          offset + (query.limit || 50) - 1,
        );
      }

      const response = await queryBuilder;

      if (response.error) {
        this.logger.error(
          "Error fetching accounts",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to fetch accounts");
      }

      const accounts = (response.data || []) as DatabaseAccount[];
      let responseAccounts: AccountResponseDto[] = [];

      if (query.hierarchical) {
        // Build hierarchical structure
        const hierarchicalAccounts = await this.buildAccountHierarchy(
          accounts,
          query.includeBalance || false,
          query.balanceAsOfDate,
        );
        responseAccounts = hierarchicalAccounts.map((account) =>
          this.mapHierarchyToResponse(account),
        );
      } else {
        responseAccounts = await Promise.all(
          accounts.map(async (account) => {
            const mapped = this.mapToResponseDto(account);
            if (query.includeBalance) {
              mapped.balance = await this.calculateAccountBalance(
                account.id,
                query.balanceAsOfDate,
              );
            }
            return mapped;
          }),
        );
      }

      return {
        accounts: responseAccounts,
        total: response.count || 0,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil((response.count || 0) / (query.limit || 50)),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error fetching accounts",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to fetch accounts");
    }
  }

  async findOne(
    id: string,
    companyId: string,
    includeBalance = false,
    balanceAsOfDate?: string,
  ): Promise<AccountResponseDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const response = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .eq("company_id", companyId)
        .single();

      if (response.error || !response.data) {
        this.logger.warn("Account not found", "AccountsService");
        throw new NotFoundException("Account not found");
      }

      const account = response.data as DatabaseAccount;
      const responseDto = this.mapToResponseDto(account);

      if (includeBalance) {
        responseDto.balance = await this.calculateAccountBalance(
          id,
          balanceAsOfDate,
        );
      }

      return responseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error fetching account",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to fetch account");
    }
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    companyId: string,
  ): Promise<AccountResponseDto> {
    try {
      // Verify account exists
      await this.findOne(id, companyId);

      // Validate account code uniqueness if changed
      if (updateAccountDto.code) {
        await this.validateAccountCodeUniqueness(
          updateAccountDto.code,
          companyId,
          id,
        );
      }

      // Validate parent account if changed
      if (updateAccountDto.parentAccountId) {
        await this.validateParentAccount(
          updateAccountDto.parentAccountId,
          companyId,
        );
        // Prevent circular references
        await this.validateNoCircularReference(
          id,
          updateAccountDto.parentAccountId,
          companyId,
        );
      }

      const supabase = this.supabaseService.getClient();

      const updateData: Partial<DatabaseAccount> = {};

      if (updateAccountDto.code) updateData.code = updateAccountDto.code;
      if (updateAccountDto.name) updateData.name = updateAccountDto.name;
      if (updateAccountDto.description !== undefined)
        updateData.description = updateAccountDto.description;
      if (updateAccountDto.type) updateData.type = updateAccountDto.type;
      if (updateAccountDto.subType)
        updateData.sub_type = updateAccountDto.subType;
      if (updateAccountDto.parentAccountId !== undefined) {
        updateData.parent_account_id = updateAccountDto.parentAccountId;
        if (updateAccountDto.parentAccountId) {
          updateData.level =
            (await this.calculateAccountLevel(
              updateAccountDto.parentAccountId,
            )) + 1;
        } else {
          updateData.level = 0;
        }
      }
      if (updateAccountDto.isControlAccount !== undefined)
        updateData.is_control_account = updateAccountDto.isControlAccount;
      if (updateAccountDto.allowDirectTransactions !== undefined)
        updateData.allow_direct_transactions =
          updateAccountDto.allowDirectTransactions;
      if (updateAccountDto.currency)
        updateData.currency = updateAccountDto.currency;
      if (updateAccountDto.taxCode !== undefined)
        updateData.tax_code = updateAccountDto.taxCode;
      if (updateAccountDto.isTaxable !== undefined)
        updateData.is_taxable = updateAccountDto.isTaxable;
      if (updateAccountDto.isDepreciable !== undefined)
        updateData.is_depreciable = updateAccountDto.isDepreciable;
      if (updateAccountDto.depreciationRate !== undefined)
        updateData.depreciation_rate = updateAccountDto.depreciationRate;
      if (updateAccountDto.depreciationMethod !== undefined)
        updateData.depreciation_method = updateAccountDto.depreciationMethod;
      if (updateAccountDto.status) updateData.status = updateAccountDto.status;

      updateData.updated_at = new Date().toISOString();

      const response = await supabase
        .from("accounts")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();

      if (response.error || !response.data) {
        this.logger.error(
          "Error updating account",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to update account");
      }

      this.logger.log("Account updated successfully", "AccountsService");
      return this.mapToResponseDto(response.data as DatabaseAccount);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error updating account",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to update account");
    }
  }

  async remove(id: string, companyId: string): Promise<void> {
    try {
      // Verify account exists
      await this.findOne(id, companyId);

      // Check if account has child accounts
      const hasChildren = await this.hasChildAccounts(id, companyId);
      if (hasChildren) {
        throw new BadRequestException(
          "Cannot delete account with child accounts",
        );
      }

      // Check if account has transactions
      const hasTransactions = await this.hasTransactions(id, companyId);
      if (hasTransactions) {
        throw new BadRequestException(
          "Cannot delete account with existing transactions",
        );
      }

      const supabase = this.supabaseService.getClient();

      const response = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("company_id", companyId);

      if (response.error) {
        this.logger.error(
          "Error deleting account",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to delete account");
      }

      this.logger.log("Account deleted successfully", "AccountsService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error deleting account",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to delete account");
    }
  }

  async generateAccountCode(
    generateDto: GenerateAccountCodeDto,
    companyId: string,
  ): Promise<AccountCodeResponseDto> {
    try {
      const codePattern = this.getAccountCodePattern(
        generateDto.type,
        generateDto.subType,
      );
      const prefix = generateDto.prefix || codePattern.prefix;

      const supabase = this.supabaseService.getClient();

      // Find existing accounts with similar pattern
      const response = await supabase
        .from("accounts")
        .select("code")
        .eq("company_id", companyId)
        .eq("type", generateDto.type)
        .eq("sub_type", generateDto.subType)
        .like("code", `${prefix}%`)
        .order("code", { ascending: false });

      if (response.error) {
        this.logger.error(
          "Error generating account code",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to generate account code");
      }

      const accounts = (response.data || []) as { code: string }[];
      const nextNumber = this.calculateNextAccountNumber(accounts, prefix);
      const suggestedCode = `${prefix}${nextNumber.toString().padStart(codePattern.digits, "0")}`;

      // Check if suggested code is available
      const isAvailable = await this.isAccountCodeAvailable(
        suggestedCode,
        companyId,
      );

      return {
        suggestedCode,
        nextAvailableCode: isAvailable
          ? suggestedCode
          : await this.findNextAvailableCode(
              prefix,
              companyId,
              codePattern.digits,
            ),
        codePattern: `${prefix}${"0".repeat(codePattern.digits)}`,
        isAvailable,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error generating account code",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to generate account code");
    }
  }

  async getAccountHierarchy(
    companyId: string,
    includeBalance = false,
    balanceAsOfDate?: string,
  ): Promise<AccountHierarchyDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const response = await supabase
        .from("accounts")
        .select("*")
        .eq("company_id", companyId)
        .neq("status", AccountStatus.ARCHIVED)
        .order("code", { ascending: true });

      if (response.error) {
        this.logger.error(
          "Error fetching account hierarchy",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to fetch account hierarchy");
      }

      const accounts = (response.data || []) as DatabaseAccount[];
      return this.buildAccountHierarchy(
        accounts,
        includeBalance,
        balanceAsOfDate,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error fetching account hierarchy",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to fetch account hierarchy");
    }
  }

  async calculateAccountBalance(
    accountId: string,
    asOfDate?: string,
  ): Promise<AccountBalanceDto> {
    try {
      const supabase = this.supabaseService.getClient();

      let query = supabase
        .from("transaction_entries")
        .select("debit_amount, credit_amount")
        .eq("account_id", accountId);

      if (asOfDate) {
        query = query.lte("created_at", asOfDate);
      }

      const response = await query;

      if (response.error) {
        this.logger.error(
          "Error calculating account balance",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to calculate account balance");
      }

      const entries = (response.data || []) as TransactionEntry[];
      const debitTotal = new Decimal(
        entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0),
      );

      const creditTotal = new Decimal(
        entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0),
      );

      const netBalance = debitTotal.minus(creditTotal);

      return {
        debitBalance: debitTotal.toNumber(),
        creditBalance: creditTotal.toNumber(),
        netBalance: netBalance.toNumber(),
        asOfDate: asOfDate || new Date().toISOString(),
        currency: "INR", // TODO: Get from account currency
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Unexpected error calculating account balance",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to calculate account balance");
    }
  }

  async bulkOperation(
    operation: BulkAccountOperationDto,
    companyId: string,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // Verify all accounts exist and belong to company
      for (const accountId of operation.accountIds) {
        await this.findOne(accountId, companyId);
      }

      const updateData: Partial<DatabaseAccount> = {};

      if (operation.status) {
        updateData.status = operation.status;
      }

      if (operation.newParentAccountId !== undefined) {
        if (operation.newParentAccountId) {
          await this.validateParentAccount(
            operation.newParentAccountId,
            companyId,
          );
        }
        updateData.parent_account_id = operation.newParentAccountId;
      }

      updateData.updated_at = new Date().toISOString();

      const response = await supabase
        .from("accounts")
        .update(updateData)
        .in("id", operation.accountIds)
        .eq("company_id", companyId);

      if (response.error) {
        this.logger.error(
          "Error performing bulk operation",
          JSON.stringify(response.error),
          "AccountsService",
        );
        throw new BadRequestException("Failed to perform bulk operation");
      }

      this.logger.log(
        "Bulk operation completed successfully",
        "AccountsService",
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Unexpected error performing bulk operation",
        error instanceof Error ? error.message : JSON.stringify(error),
        "AccountsService",
      );
      throw new BadRequestException("Failed to perform bulk operation");
    }
  }

  // Private helper methods
  private async validateAccountCodeUniqueness(
    code: string,
    companyId: string,
    excludeId?: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from("accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("code", code);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException("Failed to validate account code");
    }

    if (data && data.length > 0) {
      throw new ConflictException("Account code already exists");
    }
  }

  private async validateParentAccount(
    parentAccountId: string,
    companyId: string,
  ): Promise<void> {
    const parentAccount = await this.findOne(parentAccountId, companyId);

    if (
      !parentAccount.isControlAccount &&
      parentAccount.allowDirectTransactions
    ) {
      throw new BadRequestException(
        "Parent account must be a control account or not allow direct transactions",
      );
    }
  }

  private async validateNoCircularReference(
    accountId: string,
    parentAccountId: string,
    companyId: string,
  ): Promise<void> {
    let currentParentId = parentAccountId;
    const visitedIds = new Set<string>();

    while (currentParentId) {
      if (visitedIds.has(currentParentId)) {
        throw new BadRequestException(
          "Circular reference detected in account hierarchy",
        );
      }

      if (currentParentId === accountId) {
        throw new BadRequestException("Account cannot be its own parent");
      }

      visitedIds.add(currentParentId);

      const parent = await this.findOne(currentParentId, companyId);
      currentParentId = parent.parentAccountId || "";
    }
  }

  private async validateAccountHierarchy(
    createDto: CreateAccountDto,
    companyId: string,
  ): Promise<void> {
    // Validate that account type and subtype are compatible
    const compatibleSubTypes = this.getCompatibleSubTypes(createDto.type);
    if (!compatibleSubTypes.includes(createDto.subType)) {
      throw new BadRequestException(
        `SubType ${createDto.subType} is not compatible with type ${createDto.type}`,
      );
    }

    // If parent is specified, validate type compatibility
    if (createDto.parentAccountId) {
      const parent = await this.findOne(createDto.parentAccountId, companyId);
      if (parent.type !== createDto.type) {
        throw new BadRequestException(
          "Child account type must match parent account type",
        );
      }
    }
  }

  private async calculateAccountLevel(
    parentAccountId: string,
  ): Promise<number> {
    const supabase = this.supabaseService.getClient();

    const response = await supabase
      .from("accounts")
      .select("level")
      .eq("id", parentAccountId)
      .single();

    if (response.error || !response.data) {
      return 0;
    }

    const parent = response.data as { level: number };
    return parent.level;
  }

  private async hasChildAccounts(
    accountId: string,
    companyId: string,
  ): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("parent_account_id", accountId)
      .limit(1);

    return !error && data && data.length > 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async hasTransactions(
    accountId: string,
    companyId: string,
  ): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("transaction_entries")
      .select("id")
      .eq("account_id", accountId)
      .limit(1);

    return !error && data && data.length > 0;
  }

  private async buildAccountHierarchy(
    accounts: DatabaseAccount[],
    includeBalance: boolean,
    balanceAsOfDate?: string,
  ): Promise<AccountHierarchyDto[]> {
    const accountMap = new Map<string, AccountHierarchyDto>();
    const rootAccounts: AccountHierarchyDto[] = [];

    // First pass: create all account objects
    for (const account of accounts) {
      const hierarchyDto: AccountHierarchyDto = {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type as AccountType,
        subType: account.sub_type as AccountSubType,
        level: account.level,
        parentAccountId: account.parent_account_id,
        children: [],
        isControlAccount: account.is_control_account,
        allowDirectTransactions: account.allow_direct_transactions,
        status: account.status as AccountStatus,
      };

      if (includeBalance) {
        hierarchyDto.balance = await this.calculateAccountBalance(
          account.id,
          balanceAsOfDate,
        );
      }

      accountMap.set(account.id, hierarchyDto);
    }

    // Second pass: build hierarchy
    for (const account of accountMap.values()) {
      if (account.parentAccountId) {
        const parent = accountMap.get(account.parentAccountId);
        if (parent) {
          parent.children!.push(account);
        }
      } else {
        rootAccounts.push(account);
      }
    }

    return rootAccounts;
  }

  private getAccountCodePattern(
    type: AccountType,
    subType: AccountSubType,
  ): { prefix: string; digits: number } {
    const patterns: Record<
      AccountType,
      Record<string, { prefix: string; digits: number }>
    > = {
      [AccountType.ASSET]: {
        [AccountSubType.CURRENT_ASSET]: { prefix: "11", digits: 3 },
        [AccountSubType.NON_CURRENT_ASSET]: { prefix: "12", digits: 3 },
        [AccountSubType.FIXED_ASSET]: { prefix: "13", digits: 3 },
        [AccountSubType.INTANGIBLE_ASSET]: { prefix: "14", digits: 3 },
      },
      [AccountType.LIABILITY]: {
        [AccountSubType.CURRENT_LIABILITY]: { prefix: "21", digits: 3 },
        [AccountSubType.NON_CURRENT_LIABILITY]: { prefix: "22", digits: 3 },
        [AccountSubType.LONG_TERM_LIABILITY]: { prefix: "23", digits: 3 },
      },
      [AccountType.EQUITY]: {
        [AccountSubType.OWNERS_EQUITY]: { prefix: "31", digits: 3 },
        [AccountSubType.RETAINED_EARNINGS]: { prefix: "32", digits: 3 },
        [AccountSubType.CAPITAL]: { prefix: "33", digits: 3 },
      },
      [AccountType.REVENUE]: {
        [AccountSubType.OPERATING_REVENUE]: { prefix: "41", digits: 3 },
        [AccountSubType.NON_OPERATING_REVENUE]: { prefix: "42", digits: 3 },
        [AccountSubType.OTHER_INCOME]: { prefix: "43", digits: 3 },
      },
      [AccountType.EXPENSE]: {
        [AccountSubType.COST_OF_GOODS_SOLD]: { prefix: "51", digits: 3 },
        [AccountSubType.OPERATING_EXPENSE]: { prefix: "52", digits: 3 },
        [AccountSubType.ADMINISTRATIVE_EXPENSE]: { prefix: "53", digits: 3 },
        [AccountSubType.SELLING_EXPENSE]: { prefix: "54", digits: 3 },
        [AccountSubType.NON_OPERATING_EXPENSE]: { prefix: "55", digits: 3 },
      },
    };

    return patterns[type]?.[subType] || { prefix: "99", digits: 3 };
  }

  private calculateNextAccountNumber(
    existingAccounts: { code: string }[],
    prefix: string,
  ): number {
    if (!existingAccounts || existingAccounts.length === 0) {
      return 1;
    }

    const numbers = existingAccounts
      .map((account) => account.code)
      .filter((code: string) => code.startsWith(prefix))
      .map((code: string) => {
        const numberPart = code.substring(prefix.length);
        return parseInt(numberPart, 10);
      })
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a);

    return numbers.length > 0 ? numbers[0] + 1 : 1;
  }

  private async isAccountCodeAvailable(
    code: string,
    companyId: string,
  ): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("code", code)
      .limit(1);

    return !error && (!data || data.length === 0);
  }

  private async findNextAvailableCode(
    prefix: string,
    companyId: string,
    digits: number,
  ): Promise<string> {
    let number = 1;
    while (number < 999999) {
      const code = `${prefix}${number.toString().padStart(digits, "0")}`;
      if (await this.isAccountCodeAvailable(code, companyId)) {
        return code;
      }
      number++;
    }
    throw new BadRequestException("No available account codes found");
  }

  private getCompatibleSubTypes(type: AccountType): AccountSubType[] {
    const compatibility: Record<AccountType, AccountSubType[]> = {
      [AccountType.ASSET]: [
        AccountSubType.CURRENT_ASSET,
        AccountSubType.NON_CURRENT_ASSET,
        AccountSubType.FIXED_ASSET,
        AccountSubType.INTANGIBLE_ASSET,
      ],
      [AccountType.LIABILITY]: [
        AccountSubType.CURRENT_LIABILITY,
        AccountSubType.NON_CURRENT_LIABILITY,
        AccountSubType.LONG_TERM_LIABILITY,
      ],
      [AccountType.EQUITY]: [
        AccountSubType.OWNERS_EQUITY,
        AccountSubType.RETAINED_EARNINGS,
        AccountSubType.CAPITAL,
      ],
      [AccountType.REVENUE]: [
        AccountSubType.OPERATING_REVENUE,
        AccountSubType.NON_OPERATING_REVENUE,
        AccountSubType.OTHER_INCOME,
      ],
      [AccountType.EXPENSE]: [
        AccountSubType.COST_OF_GOODS_SOLD,
        AccountSubType.OPERATING_EXPENSE,
        AccountSubType.ADMINISTRATIVE_EXPENSE,
        AccountSubType.SELLING_EXPENSE,
        AccountSubType.NON_OPERATING_EXPENSE,
      ],
    };

    return compatibility[type] || [];
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      code: "code",
      name: "name",
      type: "type",
      subType: "sub_type",
      level: "level",
      status: "status",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    return fieldMap[sortBy] || "code";
  }

  private mapToResponseDto(account: DatabaseAccount): AccountResponseDto {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      description: account.description,
      type: account.type as AccountType,
      subType: account.sub_type as AccountSubType,
      parentAccountId: account.parent_account_id,
      level: account.level,
      isControlAccount: account.is_control_account,
      allowDirectTransactions: account.allow_direct_transactions,
      currency: account.currency,
      openingBalance: account.opening_balance,
      openingBalanceDate: account.opening_balance_date,
      currentBalance: account.current_balance,
      taxCode: account.tax_code,
      isTaxable: account.is_taxable,
      isDepreciable: account.is_depreciable,
      depreciationRate: account.depreciation_rate,
      depreciationMethod: account.depreciation_method,
      status: account.status as AccountStatus,
      companyId: account.company_id,
      createdAt: new Date(account.created_at),
      updatedAt: new Date(account.updated_at),
    };
  }

  private mapHierarchyToResponse(
    hierarchy: AccountHierarchyDto,
  ): AccountResponseDto {
    return {
      id: hierarchy.id,
      code: hierarchy.code,
      name: hierarchy.name,
      description: "", // Not available in hierarchy DTO
      type: hierarchy.type,
      subType: hierarchy.subType,
      parentAccountId: hierarchy.parentAccountId,
      level: hierarchy.level,
      isControlAccount: hierarchy.isControlAccount,
      allowDirectTransactions: hierarchy.allowDirectTransactions,
      currency: "INR", // Default for hierarchy
      openingBalance: 0, // Not available in hierarchy DTO
      openingBalanceDate: "", // Not available in hierarchy DTO
      currentBalance: hierarchy.balance?.netBalance || 0,
      taxCode: "", // Not available in hierarchy DTO
      isTaxable: false, // Not available in hierarchy DTO
      isDepreciable: false, // Not available in hierarchy DTO
      depreciationRate: 0, // Not available in hierarchy DTO
      depreciationMethod: "", // Not available in hierarchy DTO
      status: hierarchy.status,
      companyId: "", // Not available in hierarchy DTO
      createdAt: new Date(), // Not available in hierarchy DTO
      updatedAt: new Date(), // Not available in hierarchy DTO
      balance: hierarchy.balance,
      children: hierarchy.children,
    };
  }
}
