import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsIP,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum AuditAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  EXPORT = "export",
  IMPORT = "import",
  APPROVE = "approve",
  REJECT = "reject",
  CANCEL = "cancel",
  RESTORE = "restore",
  ARCHIVE = "archive",
  BULK_OPERATION = "bulk_operation",
}

export enum AuditEntityType {
  USER = "user",
  COMPANY = "company",
  ACCOUNT = "account",
  TRANSACTION = "transaction",
  INVOICE = "invoice",
  PAYMENT = "payment",
  CUSTOMER = "customer",
  VENDOR = "vendor",
  PRODUCT = "product",
  REPORT = "report",
  SETTINGS = "settings",
  AUDIT_LOG = "audit_log",
}

export enum AuditResult {
  SUCCESS = "success",
  FAILURE = "failure",
  PARTIAL = "partial",
}

export enum AuditSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export class AuditContextDto {
  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  device?: string;

  @IsOptional()
  @IsString()
  browser?: string;
}

export class DataChangeDto {
  @IsString()
  field: string;

  @IsOptional()
  oldValue?: any;

  @IsOptional()
  newValue?: any;

  @IsOptional()
  @IsEnum(AuditSeverity)
  sensitivity?: AuditSeverity;

  @IsOptional()
  @IsBoolean()
  isPiiData?: boolean;
}

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsEnum(AuditEntityType)
  entityType: AuditEntityType;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsUUID()
  companyId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataChangeDto)
  changes?: DataChangeDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AuditContextDto)
  context?: AuditContextDto;

  @IsOptional()
  @IsEnum(AuditResult)
  result?: AuditResult = AuditResult.SUCCESS;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity = AuditSeverity.LOW;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isSystemGenerated?: boolean = false;

  @IsOptional()
  @IsBoolean()
  requiresRetention?: boolean = true;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(AuditResult)
  result?: AuditResult;

  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  includeSystemGenerated?: boolean = false;

  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}

export class AuditLogResponseDto {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  userId?: string;
  userName?: string;
  companyId: string;
  companyName?: string;
  description: string;
  changes?: DataChangeDto[];
  context?: AuditContextDto;
  result: AuditResult;
  severity: AuditSeverity;
  errorMessage?: string;
  additionalData?: Record<string, any>;
  tags?: string[];
  isSystemGenerated: boolean;
  requiresRetention: boolean;
  createdAt: Date;
}

export class AuditLogListResponseDto {
  auditLogs: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ComplianceReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  reportType?: string = "compliance";

  @IsOptional()
  @IsBoolean()
  includePiiAccess?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeFailedAttempts?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsEnum(AuditSeverity, { each: true })
  severityLevels?: AuditSeverity[];
}

export class GdprRequestDto {
  @IsEnum(["access", "portability", "deletion", "rectification"])
  requestType: "access" | "portability" | "deletion" | "rectification";

  @IsUUID()
  subjectUserId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  requestedDate?: string;

  @IsOptional()
  @IsObject()
  additionalContext?: Record<string, any>;
}

export class DataRetentionPolicyDto {
  @IsEnum(AuditEntityType)
  entityType: AuditEntityType;

  @IsNumber()
  @Min(30)
  retentionDays: number;

  @IsOptional()
  @IsEnum(AuditSeverity)
  minimumSeverity?: AuditSeverity;

  @IsOptional()
  @IsBoolean()
  archiveBeforeDeletion?: boolean = true;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AuditStatisticsDto {
  totalLogs: number;
  logsByAction: Record<AuditAction, number>;
  logsByEntityType: Record<AuditEntityType, number>;
  logsByResult: Record<AuditResult, number>;
  logsBySeverity: Record<AuditSeverity, number>;
  uniqueUsers: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  topActions: Array<{
    action: AuditAction;
    count: number;
  }>;
  failedOperations: number;
  systemGeneratedLogs: number;
  userGeneratedLogs: number;
}
