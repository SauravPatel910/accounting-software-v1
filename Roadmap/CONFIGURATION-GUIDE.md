# Environment Configuration Guide

This document explains how to configure the NestJS backend application using environment variables and the configuration system.

## Environment Files

The application supports multiple environment configurations:

- `.env` - Default environment (copied from .env.example)
- `.env.development` - Development-specific settings
- `.env.production` - Production-specific settings

## Configuration Modules

### 1. App Configuration (`app.config.ts`)

Controls basic application settings:

```typescript
// Usage in service
constructor(private configService: AppConfigService) {}

// Access configuration
const port = this.configService.app.port;
const nodeEnv = this.configService.app.nodeEnv;
const corsOrigins = this.configService.app.allowedOrigins;
```

**Environment Variables:**

- `NODE_ENV` - Application environment (development, production, test)
- `PORT` - Server port (default: 3000)
- `API_PREFIX` - Global API prefix (default: api/v1)
- `FRONTEND_URL` - Frontend application URL
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

### 2. Database Configuration (`database.config.ts`)

Database connection settings:

```typescript
// Usage
const dbConfig = this.configService.database;
```

**Environment Variables:**

- `DATABASE_URL` - Full database connection string
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### 3. Supabase Configuration (`supabase.config.ts`)

Supabase connection and auth settings:

```typescript
// Usage
const supabaseConfig = this.configService.supabase;
```

**Environment Variables:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### 4. JWT Configuration (`jwt.config.ts`)

JSON Web Token settings:

```typescript
// Usage
const jwtConfig = this.configService.jwt;
```

**Environment Variables:**

- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `JWT_EXPIRATION_TIME` - JWT token expiration (e.g., '7d', '24h')
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 characters)
- `JWT_REFRESH_EXPIRATION_TIME` - Refresh token expiration

### 5. Security Configuration (`security.config.ts`)

Security-related settings:

```typescript
// Usage
const securityConfig = this.configService.security;
```

**Environment Variables:**

- `BCRYPT_ROUNDS` - Password hashing rounds (10-15)
- `ENCRYPTION_KEY` - Encryption key (32 characters)
- `RATE_LIMIT_TTL` - Rate limit window in seconds
- `RATE_LIMIT_LIMIT` - Max requests per window

### 6. Email Configuration (`email.config.ts`)

Email service settings:

```typescript
// Usage
const emailConfig = this.configService.email;
```

**Environment Variables:**

- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Use TLS (true/false)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### 7. File Upload Configuration (`file-upload.config.ts`)

File handling settings:

```typescript
// Usage
const fileConfig = this.configService.fileUpload;
```

**Environment Variables:**

- `MAX_FILE_SIZE` - Maximum file size in bytes
- `UPLOAD_DESTINATION` - Upload directory path

### 8. Business Configuration (`business.config.ts`)

Business logic settings:

```typescript
// Usage
const businessConfig = this.configService.business;
```

**Environment Variables:**

- `DEFAULT_CURRENCY` - Default currency code (e.g., USD)
- `DECIMAL_PRECISION` - Decimal places for calculations
- `FISCAL_YEAR_START_MONTH` - Fiscal year start month (1-12)

## Using Configuration in Services

### Method 1: Using AppConfigService (Recommended)

```typescript
import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../app-config.service";

@Injectable()
export class MyService {
  constructor(private configService: AppConfigService) {}

  someMethod() {
    const port = this.configService.port;
    const isDev = this.configService.isDevelopment;
    const dbConfig = this.configService.database;
  }
}
```

### Method 2: Using ConfigService Directly

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config";

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    const appConfig = this.configService.get<AppConfig>("app");
    const port = appConfig.port;
  }
}
```

## Validation

All configuration values are validated using Joi schemas. Invalid configurations will prevent the application from starting with descriptive error messages.

### Example Validation Error:

```
Error: JWT Configuration validation error: "secret" length must be at least 32 characters long
```

## Environment Setup

### Development Setup:

1. Copy `.env.example` to `.env`
2. Update values for your local environment
3. Generate secure JWT secrets (32+ characters)
4. Configure your Supabase project details

### Production Setup:

1. Set environment variables in your deployment platform
2. Use strong, unique secrets for JWT
3. Configure production database settings
4. Enable appropriate security measures

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (32+ characters, random)
3. **Rotate secrets regularly** in production
4. **Use environment-specific configurations**
5. **Validate all configuration values**
6. **Monitor configuration errors** in production

## Troubleshooting

### Common Issues:

1. **JWT Configuration Error**
   - Ensure JWT secrets are at least 32 characters long
   - Check both JWT_SECRET and JWT_REFRESH_SECRET

2. **Database Connection Error**
   - Verify database credentials
   - Check network connectivity
   - Ensure database exists

3. **Supabase Connection Error**
   - Verify Supabase URL and keys
   - Check project settings in Supabase dashboard

4. **CORS Issues**
   - Update ALLOWED_ORIGINS with your frontend URL
   - Verify FRONTEND_URL is correct

### Debug Configuration:

Add this to any service to debug configuration:

```typescript
console.log("Current Configuration:", {
  environment: this.configService.app.nodeEnv,
  port: this.configService.app.port,
  database: {
    host: this.configService.database.host,
    name: this.configService.database.name,
  },
  // Don't log secrets in production!
});
```

## Next Steps

After setting up configuration:

1. ✅ Environment configuration complete
2. ⏳ Set up Supabase integration
3. ⏳ Implement authentication module
4. ⏳ Add database models and services
5. ⏳ Create API endpoints
