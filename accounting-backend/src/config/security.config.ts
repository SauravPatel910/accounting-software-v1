import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export interface SecurityConfig {
  bcryptRounds: number;
  encryptionKey?: string;
  rateLimitTtl: number;
  rateLimitLimit: number;
  corsEnabled: boolean;
  helmetEnabled: boolean;
  compressionEnabled: boolean;
  cors: {
    origin: string | string[] | boolean;
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
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
    ignoreUserAgents: string[];
  };
}

export default registerAs("security", (): SecurityConfig => {
  const values = {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || "100", 10),
    corsEnabled: process.env.CORS_ENABLED !== "false",
    helmetEnabled: process.env.HELMET_ENABLED !== "false",
    compressionEnabled: process.env.COMPRESSION_ENABLED !== "false",
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || [
        "http://localhost:3000",
        "http://localhost:5173",
      ],
      credentials: process.env.CORS_CREDENTIALS === "true",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Accept",
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-API-Key",
        "Origin",
      ],
    },
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === "production",
      crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE || "31536000", 10), // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },
    rateLimit: {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ignoreUserAgents: [],
    },
  };

  // Validation schema
  const schema = Joi.object({
    bcryptRounds: Joi.number().min(10).max(15).default(12),
    encryptionKey: Joi.string().length(32).optional(),
    rateLimitTtl: Joi.number().min(1).default(60),
    rateLimitLimit: Joi.number().min(1).default(100),
    corsEnabled: Joi.boolean().default(true),
    helmetEnabled: Joi.boolean().default(true),
    compressionEnabled: Joi.boolean().default(true),
    cors: Joi.object({
      origin: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()), Joi.boolean())
        .required(),
      credentials: Joi.boolean().required(),
      methods: Joi.array().items(Joi.string()).required(),
      allowedHeaders: Joi.array().items(Joi.string()).required(),
    }).required(),
    helmet: Joi.object({
      contentSecurityPolicy: Joi.boolean().required(),
      crossOriginEmbedderPolicy: Joi.boolean().required(),
      hsts: Joi.object({
        maxAge: Joi.number().min(0).required(),
        includeSubDomains: Joi.boolean().required(),
        preload: Joi.boolean().required(),
      }).required(),
    }).required(),
    rateLimit: Joi.object({
      skipSuccessfulRequests: Joi.boolean().required(),
      skipFailedRequests: Joi.boolean().required(),
      ignoreUserAgents: Joi.array().items(Joi.string()).required(),
    }).required(),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: SecurityConfig;
  };

  if (error) {
    throw new Error(
      `Security Configuration validation error: ${error.message}`,
    );
  }

  return value;
});
