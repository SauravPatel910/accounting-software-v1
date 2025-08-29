import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { SecurityConfig } from "../config/security.config";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const securityConfig = configService.get<SecurityConfig>("security");

        if (!securityConfig) {
          throw new Error("Security configuration not found");
        }

        return {
          throttlers: [
            {
              name: "short",
              ttl: securityConfig.rateLimitTtl * 1000, // Convert to milliseconds
              limit: securityConfig.rateLimitLimit,
            },
            {
              name: "medium",
              ttl: 60 * 1000, // 1 minute
              limit: 50,
            },
            {
              name: "long",
              ttl: 15 * 60 * 1000, // 15 minutes
              limit: 1000,
            },
          ],
          skipIf: (context) => {
            const request = context
              .switchToHttp()
              .getRequest<{ url: string }>();
            // Skip rate limiting for health checks
            return request.url?.includes("/health") || false;
          },
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class RateLimitModule {}
