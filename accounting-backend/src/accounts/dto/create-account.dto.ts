import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from "class-validator";

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE",
}

export class CreateAccountDto {
  @IsString()
  companyId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @IsUUID()
  parentAccountId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
