import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("security", (): SecurityConfig => {
  const values = {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || "100", 10),
    corsEnabled: true,
    helmetEnabled: true,
    compressionEnabled: true,
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

export interface SecurityConfig {
  bcryptRounds: number;
  encryptionKey?: string;
  rateLimitTtl: number;
  rateLimitLimit: number;
  corsEnabled: boolean;
  helmetEnabled: boolean;
  compressionEnabled: boolean;
}
