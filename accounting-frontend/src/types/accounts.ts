// Account Types and Enums
export const AccountType = {
  ASSET: "asset",
  LIABILITY: "liability",
  EQUITY: "equity",
  REVENUE: "revenue",
  EXPENSE: "expense",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const AccountSubType = {
  // Asset subtypes
  CURRENT_ASSET: "current_asset",
  NON_CURRENT_ASSET: "non_current_asset",
  FIXED_ASSET: "fixed_asset",
  INTANGIBLE_ASSET: "intangible_asset",

  // Liability subtypes
  CURRENT_LIABILITY: "current_liability",
  NON_CURRENT_LIABILITY: "non_current_liability",
  LONG_TERM_LIABILITY: "long_term_liability",

  // Equity subtypes
  OWNERS_EQUITY: "owners_equity",
  RETAINED_EARNINGS: "retained_earnings",
  CAPITAL: "capital",

  // Revenue subtypes
  OPERATING_REVENUE: "operating_revenue",
  NON_OPERATING_REVENUE: "non_operating_revenue",
  OTHER_INCOME: "other_income",

  // Expense subtypes
  OPERATING_EXPENSE: "operating_expense",
  NON_OPERATING_EXPENSE: "non_operating_expense",
  COST_OF_GOODS_SOLD: "cost_of_goods_sold",
  ADMINISTRATIVE_EXPENSE: "administrative_expense",
  SELLING_EXPENSE: "selling_expense",
} as const;

export type AccountSubType = (typeof AccountSubType)[keyof typeof AccountSubType];

export const AccountStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export interface AccountBalanceDto {
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  asOfDate: string;
  currency: string;
}

export interface AccountHierarchyDto {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  level: number;
  parentAccountId?: string;
  children?: AccountHierarchyDto[];
  balance?: AccountBalanceDto;
  isControlAccount: boolean;
  allowDirectTransactions: boolean;
  status: AccountStatus;
}

export interface AccountResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: AccountType;
  subType: AccountSubType;
  parentAccountId?: string;
  level: number;
  isControlAccount: boolean;
  allowDirectTransactions: boolean;
  currency: string;
  openingBalance: number;
  openingBalanceDate?: string;
  currentBalance: number;
  taxCode?: string;
  isTaxable: boolean;
  isDepreciable: boolean;
  depreciationRate?: number;
  depreciationMethod?: string;
  status: AccountStatus;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  balance?: AccountBalanceDto;
  children?: AccountHierarchyDto[];
}

export interface CreateAccountDto {
  code: string;
  name: string;
  description?: string;
  type: AccountType;
  subType: AccountSubType;
  parentAccountId?: string;
  level?: number;
  isControlAccount?: boolean;
  allowDirectTransactions?: boolean;
  currency?: string;
  openingBalance?: number;
  openingBalanceDate?: string;
  taxCode?: string;
  isTaxable?: boolean;
  isDepreciable?: boolean;
  depreciationRate?: number;
  depreciationMethod?: string;
  status?: AccountStatus;
}

export interface UpdateAccountDto {
  code?: string;
  name?: string;
  description?: string;
  type?: AccountType;
  subType?: AccountSubType;
  parentAccountId?: string;
  isControlAccount?: boolean;
  allowDirectTransactions?: boolean;
  currency?: string;
  taxCode?: string;
  isTaxable?: boolean;
  isDepreciable?: boolean;
  depreciationRate?: number;
  depreciationMethod?: string;
  status?: AccountStatus;
}

export interface AccountQueryDto {
  search?: string;
  type?: AccountType;
  subType?: AccountSubType;
  status?: AccountStatus;
  parentAccountId?: string;
  level?: number;
  includeInactive?: boolean;
  includeBalance?: boolean;
  hierarchical?: boolean;
  balanceAsOfDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AccountListResponseDto {
  accounts: AccountResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenerateAccountCodeDto {
  type: AccountType;
  subType: AccountSubType;
  parentAccountId?: string;
  prefix?: string;
}

export interface AccountCodeResponseDto {
  suggestedCode: string;
  nextAvailableCode: string;
  codePattern: string;
  isAvailable: boolean;
}

export interface AccountImportDto {
  code: string;
  name: string;
  description?: string;
  type: string;
  subType: string;
  parentAccountCode?: string;
  openingBalance?: number;
  currency?: string;
}

export interface AccountValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  account?: AccountResponseDto;
}

export interface BulkAccountOperationDto {
  accountIds: string[];
  status?: AccountStatus;
  newParentAccountId?: string;
}
