import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap, catchError } from "rxjs";
import { Request } from "express";
import { AuditLogsService } from "./audit-logs.service";
import { AUDIT_LOG_KEY, AuditOptions } from "./decorators/audit-log.decorator";
import { AuditResult, AuditSeverity } from "./dto/audit-log.dto";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const startTime = Date.now();

    // Extract entity information
    const { entityId, additionalData } = this.extractEntityInfo(
      request,
      auditOptions,
    );

    return next.handle().pipe(
      tap((response) => {
        if (auditOptions.logOnSuccess) {
          void this.logAuditEvent(
            auditOptions,
            request,
            user,
            entityId,
            response,
            AuditResult.SUCCESS,
            null,
            Date.now() - startTime,
            additionalData,
          );
        }
      }),
      catchError((error: Error) => {
        if (auditOptions.logOnError) {
          void this.logAuditEvent(
            auditOptions,
            request,
            user,
            entityId,
            null,
            AuditResult.FAILURE,
            error.message || "Unknown error",
            Date.now() - startTime,
            additionalData,
          );
        }
        throw error;
      }),
    );
  }

  private async logAuditEvent(
    options: AuditOptions,
    request: AuthenticatedRequest,
    user: AuthenticatedRequest["user"],
    entityId: string | undefined,
    response: unknown,
    result: AuditResult,
    errorMessage: string | null,
    duration: number,
    additionalData: Record<string, unknown>,
  ): Promise<void> {
    try {
      const auditData = {
        action: options.action,
        entityType: options.entityType,
        entityId: entityId || "unknown",
        userId: user?.userId,
        companyId: user?.companyId || "system",
        description:
          options.description || `${options.action} ${options.entityType}`,
        context: {
          userAgent: String(request.headers["user-agent"] || "unknown"),
          ipAddress: this.getClientIp(request),
          method: request.method,
          url: request.url,
          duration,
          requestId: String(request.headers["x-request-id"] || ""),
        },
        result,
        severity:
          result === AuditResult.FAILURE
            ? AuditSeverity.HIGH
            : options.severity,
        errorMessage: errorMessage || undefined,
        additionalData: {
          ...additionalData,
          requestBody: options.includeRequestBody
            ? this.sanitizeData(request.body, options.sensitiveFields)
            : undefined,
          responseBody: options.includeResponseBody
            ? this.sanitizeData(response, options.sensitiveFields)
            : undefined,
          headers: options.includeHeaders
            ? this.sanitizeHeaders(request.headers)
            : undefined,
        },
        isSystemGenerated: true,
      };

      await this.auditLogsService.logAction(auditData);
    } catch (error) {
      // Log error but don't throw to avoid breaking the main request
      console.error("Failed to log audit event:", error);
    }
  }

  private extractEntityInfo(
    request: AuthenticatedRequest,
    options: AuditOptions,
  ): { entityId?: string; additionalData: Record<string, unknown> } {
    let entityId: string | undefined;
    let additionalData: Record<string, unknown> = {};

    if (options.customExtractor) {
      const extracted = options.customExtractor(request);
      entityId = extracted.entityId;
      additionalData = extracted.additionalData || {};
    } else {
      // Try to extract entity ID from common patterns
      const params = request.params as Record<string, unknown> | undefined;
      const body = request.body as Record<string, unknown> | undefined;

      const rawEntityId =
        params?.id || params?.entityId || body?.id || body?.entityId;

      entityId =
        rawEntityId && typeof rawEntityId === "string"
          ? rawEntityId
          : rawEntityId && typeof rawEntityId === "number"
            ? String(rawEntityId)
            : undefined;

      // Extract additional data from request
      additionalData = {
        params: request.params || {},
        query: request.query || {},
        bodySize: request.body ? JSON.stringify(request.body).length : 0,
      };
    }

    return { entityId, additionalData };
  }

  private getClientIp(request: AuthenticatedRequest): string {
    const headers = request.headers;
    const xForwardedFor = headers["x-forwarded-for"];
    const xRealIp = headers["x-real-ip"];

    if (typeof xForwardedFor === "string") {
      const firstIp = xForwardedFor.split(",")[0];
      if (firstIp) return firstIp.trim();
    }

    if (typeof xRealIp === "string") {
      return xRealIp;
    }

    // Safe fallback without accessing unknown properties
    return "unknown";
  }

  private sanitizeData(data: unknown, sensitiveFields: string[] = []): unknown {
    if (!data || typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item, sensitiveFields));
    }

    const sanitized = { ...data } as Record<string, unknown>;
    const defaultSensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "authorization",
      "cookie",
      "session",
    ];

    const allSensitiveFields = [
      ...defaultSensitiveFields,
      ...sensitiveFields,
    ].map((field) => field.toLowerCase());

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        if (
          allSensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          sanitized[key] = "[REDACTED]";
        } else if (sanitized[key] && typeof sanitized[key] === "object") {
          sanitized[key] = this.sanitizeData(sanitized[key], sensitiveFields);
        }
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "x-api-key",
      "x-auth-token",
    ];

    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
