import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("database", (): DatabaseConfig => {
  const values = {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    name: process.env.DB_NAME || "accounting_db",
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    retryAttempts: 5,
    retryDelay: 3000,
    autoLoadEntities: true,
  };

  // Validation schema
  const schema = Joi.object({
    url: Joi.string().uri().optional(),
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    synchronize: Joi.boolean().default(false),
    logging: Joi.boolean().default(false),
    ssl: Joi.alternatives()
      .try(
        Joi.boolean(),
        Joi.object({
          rejectUnauthorized: Joi.boolean(),
        }),
      )
      .default(false),
    retryAttempts: Joi.number().min(1).default(5),
    retryDelay: Joi.number().min(1000).default(3000),
    autoLoadEntities: Joi.boolean().default(true),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: DatabaseConfig;
  };

  if (error) {
    throw new Error(
      `Database Configuration validation error: ${error.message}`,
    );
  }

  return value;
});

export interface DatabaseConfig {
  url?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean | { rejectUnauthorized: boolean };
  retryAttempts: number;
  retryDelay: number;
  autoLoadEntities: boolean;
}
