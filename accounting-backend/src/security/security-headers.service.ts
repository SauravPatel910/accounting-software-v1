import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import * as helmet from "helmet";
import { SecurityConfig } from "../config/security.config";

@Injectable()
export class SecurityHeadersService {
  private readonly securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<SecurityConfig>("security")!;
  }

  /**
   * Get helmet configuration based on environment and security settings
   */
  getHelmetConfig(): helmet.HelmetOptions {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      // Content Security Policy
      contentSecurityPolicy: this.securityConfig.helmet.contentSecurityPolicy
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
              ],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:", "https:"],
              scriptSrc: ["'self'"],
              connectSrc: [
                "'self'",
                "https://api.supabase.co",
                "wss://realtime.supabase.co",
              ],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              ...(isProduction && { upgradeInsecureRequests: [] }),
            },
          }
        : false,

      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy:
        this.securityConfig.helmet.crossOriginEmbedderPolicy,

      // HTTP Strict Transport Security
      hsts: isProduction
        ? {
            maxAge: this.securityConfig.helmet.hsts.maxAge,
            includeSubDomains:
              this.securityConfig.helmet.hsts.includeSubDomains,
            preload: this.securityConfig.helmet.hsts.preload,
          }
        : false,

      // X-Frame-Options
      frameguard: { action: "deny" },

      // X-Content-Type-Options
      noSniff: true,

      // X-DNS-Prefetch-Control
      dnsPrefetchControl: { allow: false },

      // Referrer Policy
      referrerPolicy: { policy: "same-origin" },

      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: "cross-origin" },

      // X-Permitted-Cross-Domain-Policies
      permittedCrossDomainPolicies: false,

      // Hide X-Powered-By header
      hidePoweredBy: true,
    };
  }

  /**
   * Get CORS configuration
   */
  getCorsConfig() {
    return {
      origin: this.securityConfig.cors.origin,
      credentials: this.securityConfig.cors.credentials,
      methods: this.securityConfig.cors.methods,
      allowedHeaders: this.securityConfig.cors.allowedHeaders,
      exposedHeaders: ["X-Total-Count", "X-Request-ID"],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  /**
   * Custom security headers middleware
   */
  setCustomSecurityHeaders() {
    return (req: Request, res: Response, next: () => void) => {
      // Add custom security headers
      const requestId =
        (req.headers["x-request-id"] as string) || Date.now().toString();
      res.setHeader("X-Request-ID", requestId);
      res.setHeader("X-API-Version", "1.0.0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");

      // Remove server information
      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");

      next();
    };
  }

  /**
   * Security logging middleware
   */
  securityLogger() {
    return (req: Request, res: Response, next: () => void) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
          timestamp: new Date().toISOString(),
        };

        // Log suspicious activities
        if (res.statusCode === 429) {
          console.warn("Rate limit exceeded:", logData);
        }

        if (res.statusCode >= 400) {
          console.warn("Security alert - HTTP error:", logData);
        }
      });

      next();
    };
  }
}
