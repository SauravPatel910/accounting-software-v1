import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { CustomLoggerService } from "./logger.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate unique request ID if not present
    if (!request.headers["x-request-id"]) {
      request.headers["x-request-id"] =
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.get("user-agent"),
      ip: request.ip,
      requestId: request.headers["x-request-id"] as string,
    };

    // Log incoming request
    this.logger.http(`Incoming ${request.method} ${request.url}`, requestInfo);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;

          // Log successful response
          this.logger.http(
            `Completed ${request.method} ${request.url} ${response.statusCode} - ${duration}ms`,
            {
              ...requestInfo,
              statusCode: response.statusCode,
              duration,
              responseSize: JSON.stringify(data).length,
            },
          );
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;

          // Log error response
          this.logger.logError(
            `Error ${request.method} ${request.url} - ${duration}ms`,
            {
              ...requestInfo,
              statusCode: response.statusCode || 500,
              duration,
              error: (error as Error)?.message || String(error),
              stack: (error as Error)?.stack || undefined,
            },
          );
        },
      }),
    );
  }
}
