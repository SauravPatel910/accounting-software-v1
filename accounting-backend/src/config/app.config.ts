import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("app", (): AppConfig => {
  const values = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    apiPrefix: process.env.API_PREFIX || "api/v1",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:5173", "http://localhost:3000"],
  };

  // Validation schema
  const schema = Joi.object({
    nodeEnv: Joi.string()
      .valid("development", "production", "test")
      .default("development"),
    port: Joi.number().port().default(3000),
    apiPrefix: Joi.string().default("api/v1"),
    frontendUrl: Joi.string().uri().required(),
    allowedOrigins: Joi.array().items(Joi.string().uri()).required(),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: AppConfig;
  };

  if (error) {
    throw new Error(`App Configuration validation error: ${error.message}`);
  }

  return value;
});

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  allowedOrigins: string[];
}
