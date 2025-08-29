import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from "class-validator";
import { Transform } from "class-transformer";

export class LoginDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }: { value: string }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  email: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }: { value: string }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  email: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "First name must not exceed 50 characters" })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Last name must not exceed 50 characters" })
  lastName?: string;

  @IsOptional()
  @IsUUID(4, { message: "Organization ID must be a valid UUID" })
  organizationId?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, {
    message: "Current password must be at least 6 characters long",
  })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  @MaxLength(128, { message: "New password must not exceed 128 characters" })
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Transform(({ value }: { value: string }) =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  @MaxLength(128, { message: "New password must not exceed 128 characters" })
  newPassword: string;
}
