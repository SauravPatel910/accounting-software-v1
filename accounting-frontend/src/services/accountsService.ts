import { accountsApi } from "./api";
// prettier-ignore
import { AccountType, AccountSubType, AccountStatus, type AccountResponseDto, type CreateAccountDto, type UpdateAccountDto, type AccountQueryDto, type AccountListResponseDto, type AccountHierarchyDto, type GenerateAccountCodeDto, type AccountCodeResponseDto } from "../types/accounts";

// Re-export types for convenience
export type {
  AccountResponseDto,
  CreateAccountDto,
  UpdateAccountDto,
  AccountQueryDto,
  AccountListResponseDto,
  AccountHierarchyDto,
  GenerateAccountCodeDto,
  AccountCodeResponseDto,
};

export { AccountType, AccountSubType, AccountStatus };

// Account service functions
export const fetchAccounts = async (query?: AccountQueryDto): Promise<AccountListResponseDto> => {
  return accountsApi.getAll(query);
};

export const fetchAccountById = async (
  id: string,
  includeBalance?: boolean,
  balanceAsOfDate?: string
): Promise<AccountResponseDto> => {
  return accountsApi.getById(id, includeBalance, balanceAsOfDate);
};

export const createAccount = async (data: CreateAccountDto): Promise<AccountResponseDto> => {
  return accountsApi.create(data);
};

export const updateAccount = async (id: string, data: UpdateAccountDto): Promise<AccountResponseDto> => {
  return accountsApi.update(id, data);
};

export const deleteAccount = async (id: string): Promise<void> => {
  return accountsApi.delete(id);
};

export const fetchAccountHierarchy = async (
  includeBalance?: boolean,
  balanceAsOfDate?: string
): Promise<AccountHierarchyDto[]> => {
  return accountsApi.getHierarchy(includeBalance, balanceAsOfDate);
};

export const generateAccountCode = async (data: GenerateAccountCodeDto): Promise<AccountCodeResponseDto> => {
  return accountsApi.generateCode(data);
};

export const fetchAccountBalance = async (id: string, asOfDate?: string) => {
  return accountsApi.getBalance(id, asOfDate);
};

// Helper functions for account types and subtypes
export const getAccountTypeLabel = (type: AccountType): string => {
  const labels = {
    [AccountType.ASSET]: "Asset",
    [AccountType.LIABILITY]: "Liability",
    [AccountType.EQUITY]: "Equity",
    [AccountType.REVENUE]: "Revenue",
    [AccountType.EXPENSE]: "Expense",
  };
  return labels[type] || type;
};

export const getAccountSubTypeLabel = (subType: AccountSubType): string => {
  const labels = {
    [AccountSubType.CURRENT_ASSET]: "Current Asset",
    [AccountSubType.NON_CURRENT_ASSET]: "Non-Current Asset",
    [AccountSubType.FIXED_ASSET]: "Fixed Asset",
    [AccountSubType.INTANGIBLE_ASSET]: "Intangible Asset",
    [AccountSubType.CURRENT_LIABILITY]: "Current Liability",
    [AccountSubType.NON_CURRENT_LIABILITY]: "Non-Current Liability",
    [AccountSubType.LONG_TERM_LIABILITY]: "Long-Term Liability",
    [AccountSubType.OWNERS_EQUITY]: "Owner's Equity",
    [AccountSubType.RETAINED_EARNINGS]: "Retained Earnings",
    [AccountSubType.CAPITAL]: "Capital",
    [AccountSubType.OPERATING_REVENUE]: "Operating Revenue",
    [AccountSubType.NON_OPERATING_REVENUE]: "Non-Operating Revenue",
    [AccountSubType.OTHER_INCOME]: "Other Income",
    [AccountSubType.OPERATING_EXPENSE]: "Operating Expense",
    [AccountSubType.NON_OPERATING_EXPENSE]: "Non-Operating Expense",
    [AccountSubType.COST_OF_GOODS_SOLD]: "Cost of Goods Sold",
    [AccountSubType.ADMINISTRATIVE_EXPENSE]: "Administrative Expense",
    [AccountSubType.SELLING_EXPENSE]: "Selling Expense",
  };
  return labels[subType] || subType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const getAccountStatusLabel = (status: AccountStatus): string => {
  const labels = {
    [AccountStatus.ACTIVE]: "Active",
    [AccountStatus.INACTIVE]: "Inactive",
    [AccountStatus.ARCHIVED]: "Archived",
  };
  return labels[status] || status;
};

// Get subtypes for a given account type
export const getSubTypesForType = (type: AccountType): { value: AccountSubType; label: string }[] => {
  const subTypeMap = {
    [AccountType.ASSET]: [
      { value: AccountSubType.CURRENT_ASSET, label: "Current Asset" },
      { value: AccountSubType.NON_CURRENT_ASSET, label: "Non-Current Asset" },
      { value: AccountSubType.FIXED_ASSET, label: "Fixed Asset" },
      { value: AccountSubType.INTANGIBLE_ASSET, label: "Intangible Asset" },
    ],
    [AccountType.LIABILITY]: [
      { value: AccountSubType.CURRENT_LIABILITY, label: "Current Liability" },
      { value: AccountSubType.NON_CURRENT_LIABILITY, label: "Non-Current Liability" },
      { value: AccountSubType.LONG_TERM_LIABILITY, label: "Long-Term Liability" },
    ],
    [AccountType.EQUITY]: [
      { value: AccountSubType.OWNERS_EQUITY, label: "Owner's Equity" },
      { value: AccountSubType.RETAINED_EARNINGS, label: "Retained Earnings" },
      { value: AccountSubType.CAPITAL, label: "Capital" },
    ],
    [AccountType.REVENUE]: [
      { value: AccountSubType.OPERATING_REVENUE, label: "Operating Revenue" },
      { value: AccountSubType.NON_OPERATING_REVENUE, label: "Non-Operating Revenue" },
      { value: AccountSubType.OTHER_INCOME, label: "Other Income" },
    ],
    [AccountType.EXPENSE]: [
      { value: AccountSubType.OPERATING_EXPENSE, label: "Operating Expense" },
      { value: AccountSubType.NON_OPERATING_EXPENSE, label: "Non-Operating Expense" },
      { value: AccountSubType.COST_OF_GOODS_SOLD, label: "Cost of Goods Sold" },
      { value: AccountSubType.ADMINISTRATIVE_EXPENSE, label: "Administrative Expense" },
      { value: AccountSubType.SELLING_EXPENSE, label: "Selling Expense" },
    ],
  };

  return subTypeMap[type] || [];
};
