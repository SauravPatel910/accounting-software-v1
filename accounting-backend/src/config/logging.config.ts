import { registerAs } from "@nestjs/config";
import * as Joi from "joi";
import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export interface LoggingConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableRotation: boolean;
  maxFiles: string;
  maxSize: string;
  datePattern: string;
  logDirectory: string;
  format: "json" | "simple" | "combined";
  enableErrorStack: boolean;
  enableTimestamp: boolean;
  enableColors: boolean;
  enableMetadata: boolean;
}

export const loggingConfig = registerAs("logging", (): LoggingConfig => {
  const config = {
    level: process.env.LOG_LEVEL || "info",
    enableConsole: process.env.LOG_ENABLE_CONSOLE === "true" || true,
    enableFile: process.env.LOG_ENABLE_FILE === "true" || true,
    enableRotation: process.env.LOG_ENABLE_ROTATION === "true" || true,
    maxFiles: process.env.LOG_MAX_FILES || "14d",
    maxSize: process.env.LOG_MAX_SIZE || "20m",
    datePattern: process.env.LOG_DATE_PATTERN || "YYYY-MM-DD",
    logDirectory: process.env.LOG_DIRECTORY || "./logs",
    format:
      (process.env.LOG_FORMAT as "json" | "simple" | "combined") || "json",
    enableErrorStack: process.env.LOG_ENABLE_ERROR_STACK === "true" || true,
    enableTimestamp: process.env.LOG_ENABLE_TIMESTAMP === "true" || true,
    enableColors:
      process.env.LOG_ENABLE_COLORS === "true" ||
      process.env.NODE_ENV !== "production",
    enableMetadata: process.env.LOG_ENABLE_METADATA === "true" || true,
  };

  // Validation schema
  const schema = Joi.object({
    level: Joi.string()
      .valid("error", "warn", "info", "http", "verbose", "debug", "silly")
      .required(),
    enableConsole: Joi.boolean().required(),
    enableFile: Joi.boolean().required(),
    enableRotation: Joi.boolean().required(),
    maxFiles: Joi.string().required(),
    maxSize: Joi.string().required(),
    datePattern: Joi.string().required(),
    logDirectory: Joi.string().required(),
    format: Joi.string().valid("json", "simple", "combined").required(),
    enableErrorStack: Joi.boolean().required(),
    enableTimestamp: Joi.boolean().required(),
    enableColors: Joi.boolean().required(),
    enableMetadata: Joi.boolean().required(),
  });

  const { error, value } = schema.validate(config) as {
    error?: Joi.ValidationError;
    value: LoggingConfig;
  };

  if (error) {
    throw new Error(`Logging configuration validation error: ${error.message}`);
  }

  return value;
});

// Winston transports factory function
export const createWinstonTransports = (
  config: LoggingConfig,
): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: config.level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          ...(config.enableColors ? [winston.format.colorize()] : []),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? ` ${JSON.stringify(meta)}`
              : "";
            return `${String(timestamp)} [${String(level)}] ${String(message)}${metaStr}`;
          }),
        ),
      }),
    );
  }

  // File transports
  if (config.enableFile) {
    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    if (config.enableRotation) {
      // Combined logs (all levels)
      transports.push(
        new DailyRotateFile({
          filename: `${config.logDirectory}/combined-%DATE%.log`,
          datePattern: config.datePattern,
          level: config.level,
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: fileFormat,
          auditFile: `${config.logDirectory}/.audit-combined.json`,
          createSymlink: true,
          symlinkName: "combined-current.log",
        }),
      );

      // Error logs only
      transports.push(
        new DailyRotateFile({
          filename: `${config.logDirectory}/error-%DATE%.log`,
          datePattern: config.datePattern,
          level: "error",
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: fileFormat,
          auditFile: `${config.logDirectory}/.audit-error.json`,
          createSymlink: true,
          symlinkName: "error-current.log",
        }),
      );
    } else {
      // Static file logs
      transports.push(
        new winston.transports.File({
          filename: `${config.logDirectory}/combined.log`,
          level: config.level,
          format: fileFormat,
        }),
      );

      transports.push(
        new winston.transports.File({
          filename: `${config.logDirectory}/error.log`,
          level: "error",
          format: fileFormat,
        }),
      );
    }
  }

  return transports;
};
