// prettier-ignore
import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../shared/services/supabase.service";
// prettier-ignore
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from "./dto/auth.dto";
// prettier-ignore
import { AuthResponse, JwtPayload, UserData, UserRole, SupabaseUser } from "./types/auth.types";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, organizationId } =
      registerDto;

    try {
      // Check if user already exists
      const { data: existingUser } = await this.supabaseService
        .getClient()
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        throw new ConflictException("User with this email already exists");
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              organization_id: organizationId,
            },
          },
        });

      if (authError) {
        throw new BadRequestException(authError.message);
      }

      if (!authData.user) {
        throw new BadRequestException("Failed to create user");
      }

      // Create user record in our users table
      const userResult = await this.supabaseService
        .getAdminClient()
        .from("users")
        .insert([
          {
            id: authData.user.id,
            email,
            role: UserRole.USER, // Default role
            organization_id: organizationId,
            first_name: firstName,
            last_name: lastName,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (userResult.error || !userResult.data) {
        throw new BadRequestException("Failed to create user profile");
      }

      const supabaseUser = userResult.data as SupabaseUser;
      const userData = this.transformToUserData(supabaseUser);
      const tokens = await this.generateTokens(userData);

      return {
        user: userData,
        ...tokens,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException("Registration failed");
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Get user profile
      const userResult = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .eq("is_active", true)
        .single();

      if (userResult.error || !userResult.data) {
        throw new UnauthorizedException("User not found or inactive");
      }

      const supabaseUser = userResult.data as SupabaseUser;
      const userData = this.transformToUserData(supabaseUser);
      const tokens = await this.generateTokens(userData);

      return {
        user: userData,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Login failed");
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Verify refresh token with Supabase
      const { data: authData, error: authError } = await this.supabaseService
        .getClient()
        .auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (authError || !authData.user) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Get user profile
      const userResult = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .eq("is_active", true)
        .single();

      if (userResult.error || !userResult.data) {
        throw new UnauthorizedException("User not found or inactive");
      }

      const supabaseUser = userResult.data as SupabaseUser;
      const userData = this.transformToUserData(supabaseUser);
      const tokens = await this.generateTokens(userData);

      return {
        user: userData,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Token refresh failed");
    }
  }

  async logout(): Promise<void> {
    try {
      // Sign out from Supabase
      await this.supabaseService.getClient().auth.signOut();
    } catch (error) {
      // Log error but don't throw - logout should always succeed
      console.error("Logout error:", error);
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      // Get user email first
      const { data: user } = await this.supabaseService
        .getClient()
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Verify current password by attempting login
      const { error: verifyError } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email: (user as { email: string }).email,
          password: currentPassword,
        });

      if (verifyError) {
        throw new UnauthorizedException("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await this.supabaseService
        .getClient()
        .auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw new BadRequestException(updateError.message);
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException("Password change failed");
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    try {
      const { error } = await this.supabaseService
        .getClient()
        .auth.resetPasswordForEmail(email, {
          redirectTo: `${this.configService.get("app.frontendUrl")}/reset-password`,
        });

      if (error) {
        throw new BadRequestException(error.message);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Password reset request failed");
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { newPassword } = resetPasswordDto;

    try {
      // This would be handled by Supabase Auth in the frontend
      // Backend validation if needed
      const { error } = await this.supabaseService.getClient().auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new BadRequestException(error.message);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Password reset failed");
    }
  }

  private async generateTokens(user: UserData): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>("jwt.refreshExpiresIn"),
    });

    const expiresIn = this.configService.get<number>("jwt.expiresIn") || 3600;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private transformToUserData(supabaseUser: SupabaseUser): UserData {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.role,
      organizationId: supabaseUser.organization_id,
      firstName: supabaseUser.first_name,
      lastName: supabaseUser.last_name,
      isActive: supabaseUser.is_active,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at),
    };
  }
}
