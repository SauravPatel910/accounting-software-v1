import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../../shared/services/supabase.service";
import { JwtPayload, UserData, SupabaseUser } from "../types/auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    const secret = configService.get<string>("jwt.secret");
    if (!secret) {
      throw new Error("JWT secret is not configured");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserData> {
    try {
      // Get user from Supabase
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", payload.sub)
        .eq("is_active", true)
        .single();

      if (error || !user) {
        throw new UnauthorizedException("User not found or inactive");
      }

      // Type assertion for Supabase user data
      const supabaseUser = user as SupabaseUser;

      // Transform to UserData format
      const userData: UserData = {
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

      return userData;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
