import { IsString, IsOptional, IsEmail, IsBoolean, IsInt, Min, Max } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string = "US";

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number = 1;

  @IsOptional()
  @IsString()
  baseCurrency?: string = "USD";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
