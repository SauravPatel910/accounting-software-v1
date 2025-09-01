import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SecurityHeadersService } from "./security-headers.service";
import { PasswordService } from "./password.service";
import { RateLimitModule } from "./rate-limit.module";

@Module({
  imports: [ConfigModule, RateLimitModule],
  providers: [SecurityHeadersService, PasswordService],
  exports: [SecurityHeadersService, PasswordService, RateLimitModule],
})
export class SecurityModule {}
