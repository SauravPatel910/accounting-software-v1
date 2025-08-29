// prettier-ignore
import { IsString, IsEmail, IsOptional, IsObject, IsEnum, IsUrl, IsPhoneNumber, IsBoolean, IsNumber, Min, Max, IsNotEmpty, MaxLength, MinLength, ValidateNested, IsDateString } from "class-validator";
import { Type, Transform } from "class-transformer";

export enum CompanyStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
  TRIAL = "trial",
}

export enum SubscriptionTier {
  FREE = "free",
  BASIC = "basic",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
}

export enum BillingCycle {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
}

export class CompanyAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street1: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  street2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;
}

export class CompanySettingsDto {
  @IsString()
  @IsOptional()
  @MaxLength(3)
  @MinLength(3)
  defaultCurrency?: string = "USD";

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string = "UTC";

  @IsString()
  @IsOptional()
  @MaxLength(20)
  dateFormat?: string = "YYYY-MM-DD";

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numberFormat?: string = "1,234.56";

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number = 1;

  @IsBoolean()
  @IsOptional()
  multiCurrencyEnabled?: boolean = false;

  @IsBoolean()
  @IsOptional()
  autoBackupEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  emailNotificationsEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  invoiceAutoNumbering?: boolean = true;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  invoiceNumberPrefix?: string = "INV";

  @IsNumber()
  @IsOptional()
  @Min(1)
  nextInvoiceNumber?: number = 1;
}

export class CompanyPreferencesDto {
  @IsObject()
  @IsOptional()
  theme?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  dashboard?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  reports?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  notifications?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  ui?: Record<string, unknown>;
}

export class SubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(1)
  maxUsers: number;

  @IsNumber()
  @Min(1)
  maxStorage: number;

  @IsNumber()
  @Min(100)
  apiRateLimit: number;

  @IsBoolean()
  @IsOptional()
  advancedFeaturesEnabled?: boolean = false;

  @IsBoolean()
  @IsOptional()
  customBrandingEnabled?: boolean = false;

  @IsBoolean()
  @IsOptional()
  prioritySupportEnabled?: boolean = false;
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ValidateNested()
  @Type(() => CompanyAddressDto)
  @IsOptional()
  address?: CompanyAddressDto;

  @ValidateNested()
  @Type(() => CompanySettingsDto)
  @IsOptional()
  settings?: CompanySettingsDto;

  @ValidateNested()
  @Type(() => CompanyPreferencesDto)
  @IsOptional()
  preferences?: CompanyPreferencesDto;

  @ValidateNested()
  @Type(() => SubscriptionDto)
  @IsOptional()
  subscription?: SubscriptionDto;

  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus = CompanyStatus.TRIAL;
}

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ValidateNested()
  @Type(() => CompanyAddressDto)
  @IsOptional()
  address?: CompanyAddressDto;

  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;
}

export class UpdateCompanySettingsDto {
  @ValidateNested()
  @Type(() => CompanySettingsDto)
  settings: CompanySettingsDto;
}

export class UpdateCompanyPreferencesDto {
  @ValidateNested()
  @Type(() => CompanyPreferencesDto)
  preferences: CompanyPreferencesDto;
}

export class UpdateSubscriptionDto {
  @ValidateNested()
  @Type(() => SubscriptionDto)
  subscription: SubscriptionDto;
}

export class CompanyResponseDto {
  id: string;
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  address?: CompanyAddressDto;
  settings?: CompanySettingsDto;
  preferences?: CompanyPreferencesDto;
  subscription?: SubscriptionDto;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @IsEnum(SubscriptionTier)
  @IsOptional()
  subscriptionTier?: SubscriptionTier;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

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
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}

export class CompanyListResponseDto {
  companies: CompanyResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
