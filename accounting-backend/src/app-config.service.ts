import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AppConfig,
  DatabaseConfig,
  SupabaseConfig,
  JwtConfig,
  SecurityConfig,
  EmailConfig,
  FileUploadConfig,
  BusinessConfig,
} from "./config";

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get app(): AppConfig {
    return this.configService.get<AppConfig>("app")!;
  }

  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>("database")!;
  }

  get supabase(): SupabaseConfig {
    return this.configService.get<SupabaseConfig>("supabase")!;
  }

  get jwt(): JwtConfig {
    return this.configService.get<JwtConfig>("jwt")!;
  }

  get security(): SecurityConfig {
    return this.configService.get<SecurityConfig>("security")!;
  }

  get email(): EmailConfig {
    return this.configService.get<EmailConfig>("email")!;
  }

  get fileUpload(): FileUploadConfig {
    return this.configService.get<FileUploadConfig>("fileUpload")!;
  }

  get business(): BusinessConfig {
    return this.configService.get<BusinessConfig>("business")!;
  }

  // Convenience methods for commonly used values
  get isDevelopment(): boolean {
    return this.app.nodeEnv === "development";
  }

  get isProduction(): boolean {
    return this.app.nodeEnv === "production";
  }

  get isTest(): boolean {
    return this.app.nodeEnv === "test";
  }

  get port(): number {
    return this.app.port;
  }

  get globalPrefix(): string {
    return this.app.apiPrefix;
  }

  get corsOrigins(): string[] {
    return this.app.allowedOrigins;
  }
}
