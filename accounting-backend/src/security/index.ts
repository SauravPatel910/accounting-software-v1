// Security module exports
export { SecurityModule } from "./security.module";
export { SecurityHeadersService } from "./security-headers.service";
export { PasswordService } from "./password.service";
export { RateLimitModule } from "./rate-limit.module";

// Security decorators
export * from "./decorators/throttle.decorator";

// Security types and interfaces
export interface SecurityConfig {
  cors: {
    origin: string[] | string | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  rateLimit: {
    shortTerm: {
      ttl: number;
      limit: number;
    };
    mediumTerm: {
      ttl: number;
      limit: number;
    };
    longTerm: {
      ttl: number;
      limit: number;
    };
  };
  bcrypt: {
    saltRounds: number;
  };
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}
