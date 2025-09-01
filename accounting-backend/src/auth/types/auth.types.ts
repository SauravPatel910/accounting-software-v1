export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  ACCOUNTANT = "accountant",
  USER = "user",
  READ_ONLY = "read_only",
}

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
