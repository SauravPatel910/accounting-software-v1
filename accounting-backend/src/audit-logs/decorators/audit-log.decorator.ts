import { SetMetadata } from "@nestjs/common";
import {
  AuditAction,
  AuditEntityType,
  AuditSeverity,
} from "../dto/audit-log.dto";

export const AUDIT_LOG_KEY = "audit_log";

export interface AuditOptions {
  action: AuditAction;
  entityType: AuditEntityType;
  description?: string;
  severity?: AuditSeverity;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  includeHeaders?: boolean;
  logOnError?: boolean;
  logOnSuccess?: boolean;
  sensitiveFields?: string[];
  customExtractor?: (context: any) => {
    entityId?: string;
    additionalData?: Record<string, any>;
  };
}

/**
 * Decorator to automatically log audit trails for controller methods
 *
 * @param options Configuration for audit logging
 *
 * @example
 * ```typescript
 * @AuditLog({
 *   action: AuditAction.CREATE,
 *   entityType: AuditEntityType.USER,
 *   description: 'User created successfully',
 *   severity: AuditSeverity.MEDIUM
 * })
 * @Post()
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   return this.usersService.create(createUserDto);
 * }
 * ```
 */
export const AuditLog = (options: AuditOptions) => {
  return SetMetadata(AUDIT_LOG_KEY, {
    action: options.action,
    entityType: options.entityType,
    description:
      options.description || `${options.action} ${options.entityType}`,
    severity: options.severity || AuditSeverity.LOW,
    includeRequestBody: options.includeRequestBody ?? false,
    includeResponseBody: options.includeResponseBody ?? false,
    includeHeaders: options.includeHeaders ?? false,
    logOnError: options.logOnError ?? true,
    logOnSuccess: options.logOnSuccess ?? true,
    sensitiveFields: options.sensitiveFields || [],
    customExtractor: options.customExtractor,
  });
};

/**
 * Decorator for high-severity audit logs
 */
export const AuditCritical = (
  action: AuditAction,
  entityType: AuditEntityType,
  description?: string,
) =>
  AuditLog({
    action,
    entityType,
    description,
    severity: AuditSeverity.CRITICAL,
    includeRequestBody: true,
    includeResponseBody: true,
  });

/**
 * Decorator for security-related audit logs
 */
export const AuditSecurity = (
  action: AuditAction,
  entityType: AuditEntityType,
  description?: string,
) =>
  AuditLog({
    action,
    entityType,
    description,
    severity: AuditSeverity.HIGH,
    includeHeaders: true,
    logOnError: true,
  });

/**
 * Decorator for data modification audit logs
 */
export const AuditDataChange = (
  entityType: AuditEntityType,
  description?: string,
) =>
  AuditLog({
    action: AuditAction.UPDATE,
    entityType,
    description,
    severity: AuditSeverity.MEDIUM,
    includeRequestBody: true,
    sensitiveFields: ["password", "token", "secret", "key"],
  });

/**
 * Decorator for financial transaction audit logs
 */
export const AuditFinancial = (action: AuditAction, description?: string) =>
  AuditLog({
    action,
    entityType: AuditEntityType.TRANSACTION,
    description,
    severity: AuditSeverity.HIGH,
    includeRequestBody: true,
    includeResponseBody: true,
  });

/**
 * Decorator for user authentication audit logs
 */
export const AuditAuth = (action: AuditAction, description?: string) =>
  AuditLog({
    action,
    entityType: AuditEntityType.USER,
    description,
    severity: AuditSeverity.MEDIUM,
    includeHeaders: true,
  });

/**
 * Decorator for administrative actions
 */
export const AuditAdmin = (
  action: AuditAction,
  entityType: AuditEntityType,
  description?: string,
) =>
  AuditLog({
    action,
    entityType,
    description,
    severity: AuditSeverity.HIGH,
    includeRequestBody: true,
    includeResponseBody: true,
    includeHeaders: true,
  });

/**
 * Decorator for system-generated audit logs
 */
export const AuditSystem = (
  action: AuditAction,
  entityType: AuditEntityType,
  description?: string,
) =>
  AuditLog({
    action,
    entityType,
    description,
    severity: AuditSeverity.LOW,
  });

/**
 * Decorator for GDPR-related operations
 */
export const AuditGdpr = (action: AuditAction, description?: string) =>
  AuditLog({
    action,
    entityType: AuditEntityType.USER,
    description,
    severity: AuditSeverity.CRITICAL,
    includeRequestBody: true,
    includeResponseBody: true,
    includeHeaders: true,
  });
