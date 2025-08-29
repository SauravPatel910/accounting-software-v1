import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient<any>;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseAnonKey = this.configService.get<string>("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey) as SupabaseClient<any>;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);

    try {
      const response = await this.supabase.auth.getUser(token);
      const { user } = response.data;
      const { error } = response;

      if (error || !user) {
        throw new UnauthorizedException("Invalid token");
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Token validation failed");
    }
  }
}
