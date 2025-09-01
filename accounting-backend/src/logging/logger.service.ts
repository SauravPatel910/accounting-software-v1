import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import * as winston from "winston";
import { LoggingConfig } from "../config/logging.config";

export interface LogMetadata {
  userId?: string;
  companyId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: Error | string;
  stack?: string;
  context?: string;
  [key: string]: string | number | boolean | Error | Date | undefined;
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;
  private readonly config: LoggingConfig;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<LoggingConfig>("logging")!;
    this.logger = winston.createLogger();
  }

  // NestJS LoggerService interface implementation
  log(message: any, context?: string): void {
    this.info(String(message), { context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logError(String(message), { context, stack: trace });
  }

  warn(message: any, context?: string): void {
    this.warning(String(message), { context });
  }

  debug(message: any, context?: string): void {
    this.logDebug(String(message), { context });
  }

  verbose(message: any, context?: string): void {
    this.logVerbose(String(message), { context });
  }

  // Custom logging methods with metadata support
  info(message: string, meta?: LogMetadata): void {
    this.logger.info(message, this.formatMetadata(meta));
  }

  warning(message: string, meta?: LogMetadata): void {
    this.logger.warn(message, this.formatMetadata(meta));
  }

  logError(message: string, meta?: LogMetadata): void {
    this.logger.error(message, this.formatMetadata(meta));
  }

  logDebug(message: string, meta?: LogMetadata): void {
    this.logger.debug(message, this.formatMetadata(meta));
  }

  logVerbose(message: string, meta?: LogMetadata): void {
    this.logger.verbose(message, this.formatMetadata(meta));
  }

  http(message: string, meta?: LogMetadata): void {
    this.logger.http(message, this.formatMetadata(meta));
  }

  // Specialized logging methods
  logRequest(req: Request, res: Response, duration: number): void {
    const meta: LogMetadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("User-Agent") || "Unknown",
      requestId: (req.headers["x-request-id"] as string) || "Unknown",
    };

    const level =
      res.statusCode >= 400 ? "error" : res.statusCode >= 300 ? "warn" : "http";
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;

    this.logger.log(level, message, this.formatMetadata(meta));
  }

  logSecurityEvent(event: string, meta?: LogMetadata): void {
    this.warning(`Security Event: ${event}`, {
      ...meta,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  logBusinessEvent(event: string, meta?: LogMetadata): void {
    this.info(`Business Event: ${event}`, {
      ...meta,
      businessEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformance(
    operation: string,
    duration: number,
    meta?: LogMetadata,
  ): void {
    const level = duration > 5000 ? "warn" : duration > 1000 ? "info" : "debug";

    this.logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...this.formatMetadata(meta),
      performance: true,
      operation,
      duration,
    });
  }

  logAuth(event: string, userId?: string, meta?: LogMetadata): void {
    this.info(`Auth Event: ${event}`, {
      ...meta,
      userId,
      authEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabase(operation: string, table?: string, meta?: LogMetadata): void {
    this.logDebug(`Database: ${operation}${table ? ` on ${table}` : ""}`, {
      ...meta,
      databaseOperation: operation,
      table,
      timestamp: new Date().toISOString(),
    });
  }

  logApiCall(
    endpoint: string,
    method: string,
    duration: number,
    meta?: LogMetadata,
  ): void {
    this.http(`API Call: ${method} ${endpoint} - ${duration}ms`, {
      ...meta,
      apiCall: true,
      endpoint,
      method,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  private formatMetadata(meta?: LogMetadata): LogMetadata {
    if (!this.config.enableMetadata || !meta) {
      return {};
    }

    // Filter out undefined values and add common metadata
    const filtered: LogMetadata = {};

    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined && value !== null) {
        // Only allow safe types in metadata
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value instanceof Date ||
          value instanceof Error
        ) {
          filtered[key] = value;
        } else {
          // Convert complex objects to strings
          filtered[key] = String(value);
        }
      }
    }

    return {
      ...filtered,
      service: "accounting-backend",
      environment: process.env.NODE_ENV || "development",
      pid: process.pid,
    };
  }

  // Method to get the underlying Winston logger
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  // Method to set context for all subsequent logs
  setContext(context: string): CustomLoggerService {
    const newLoggerService = new CustomLoggerService(this.configService);

    // Create a new logger instance with context metadata
    const contextLogger = winston.createLogger({
      level: this.logger.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: this.logger.transports,
      defaultMeta: { context },
    });

    // Replace the internal logger using object property access
    Object.defineProperty(newLoggerService, "logger", {
      value: contextLogger,
      writable: false,
      enumerable: false,
    });

    return newLoggerService;
  }
}
