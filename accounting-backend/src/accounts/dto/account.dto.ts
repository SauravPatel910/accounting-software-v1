// prettier-ignore
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsNotEmpty, MaxLength, MinLength, Min, Max, IsDateString } from "class-validator";
import { Transform } from "class-transformer";

export enum AccountType {
  ASSET = "asset",
  LIABILITY = "liability",
  EQUITY = "equity",
  REVENUE = "revenue",
  EXPENSE = "expense",
}

export enum AccountSubType {
  // Asset subtypes
  CURRENT_ASSET = "current_asset",
  NON_CURRENT_ASSET = "non_current_asset",
  FIXED_ASSET = "fixed_asset",
  INTANGIBLE_ASSET = "intangible_asset",

  // Liability subtypes
  CURRENT_LIABILITY = "current_liability",
  NON_CURRENT_LIABILITY = "non_current_liability",
  LONG_TERM_LIABILITY = "long_term_liability",

  // Equity subtypes
  OWNERS_EQUITY = "owners_equity",
  RETAINED_EARNINGS = "retained_earnings",
  CAPITAL = "capital",

  // Revenue subtypes
  OPERATING_REVENUE = "operating_revenue",
  NON_OPERATING_REVENUE = "non_operating_revenue",
  OTHER_INCOME = "other_income",

  // Expense subtypes
  OPERATING_EXPENSE = "operating_expense",
  NON_OPERATING_EXPENSE = "non_operating_expense",
  COST_OF_GOODS_SOLD = "cost_of_goods_sold",
  ADMINISTRATIVE_EXPENSE = "administrative_expense",
  SELLING_EXPENSE = "selling_expense",
}

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEnum(AccountSubType)
  subType: AccountSubType;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  parentAccountId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  level?: number = 0;

  @IsBoolean()
  @IsOptional()
  isControlAccount?: boolean = false;

  @IsBoolean()
  @IsOptional()
  allowDirectTransactions?: boolean = true;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  @MinLength(3)
  currency?: string = "INR";

  @IsNumber()
  @IsOptional()
  @Min(0)
  openingBalance?: number = 0;

  @IsDateString()
  @IsOptional()
  openingBalanceDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxCode?: string;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isDepreciable?: boolean = false;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  depreciationRate?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  depreciationMethod?: string;

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus = AccountStatus.ACTIVE;
}

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsEnum(AccountSubType)
  @IsOptional()
  subType?: AccountSubType;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  parentAccountId?: string;

  @IsBoolean()
  @IsOptional()
  isControlAccount?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDirectTransactions?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  @MinLength(3)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxCode?: string;

  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;

  @IsBoolean()
  @IsOptional()
  isDepreciable?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  depreciationRate?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  depreciationMethod?: string;

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}

export class AccountBalanceDto {
  @IsNumber()
  debitBalance: number;

  @IsNumber()
  creditBalance: number;

  @IsNumber()
  netBalance: number;

  @IsDateString()
  asOfDate: string;

  @IsString()
  @MaxLength(3)
  currency: string;
}

export class AccountHierarchyDto {
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

export class AccountResponseDto {
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

export class AccountQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsEnum(AccountSubType)
  @IsOptional()
  subType?: AccountSubType;

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  parentAccountId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  level?: number;

  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean = false;

  @IsBoolean()
  @IsOptional()
  includeBalance?: boolean = false;

  @IsBoolean()
  @IsOptional()
  hierarchical?: boolean = false;

  @IsDateString()
  @IsOptional()
  balanceAsOfDate?: string;

  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsString()
  @IsOptional()
  sortBy?: string = "code";

  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc" = "asc";
}

export class AccountListResponseDto {
  accounts: AccountResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GenerateAccountCodeDto {
  @IsEnum(AccountType)
  type: AccountType;

  @IsEnum(AccountSubType)
  subType: AccountSubType;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  parentAccountId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  prefix?: string;
}

export class AccountCodeResponseDto {
  suggestedCode: string;
  nextAvailableCode: string;
  codePattern: string;
  isAvailable: boolean;
}

export class BulkAccountOperationDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  accountIds: string[];

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  newParentAccountId?: string;
}

export class AccountImportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  subType: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  parentAccountCode?: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number = 0;

  @IsString()
  @IsOptional()
  currency?: string = "INR";
}

export class AccountValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  account?: AccountResponseDto;
}
