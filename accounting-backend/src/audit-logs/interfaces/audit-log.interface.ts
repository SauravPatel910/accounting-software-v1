import {
  AuditAction,
  AuditEntityType,
  AuditResult,
  AuditSeverity,
} from "../dto/audit-log.dto";

export interface IAuditContext {
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  location?: string;
  device?: string;
  browser?: string;
}

export interface IDataChange {
  field: string;
  oldValue?: any;
  newValue?: any;
  sensitivity?: AuditSeverity;
  isPiiData?: boolean;
}

export interface IAuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  userId?: string;
  companyId: string;
  description: string;
  changes?: IDataChange[];
  context?: IAuditContext;
  result: AuditResult;
  severity: AuditSeverity;
  errorMessage?: string;
  additionalData?: Record<string, any>;
  tags?: string[];
  isSystemGenerated: boolean;
  requiresRetention: boolean;
  createdAt: Date;
}

export interface IAuditService {
  logAction(auditData: Partial<IAuditLog>): Promise<IAuditLog>;
  getAuditLogs(query: any): Promise<{ logs: IAuditLog[]; total: number }>;
  getAuditLog(id: string): Promise<IAuditLog>;
  generateComplianceReport(criteria: any): Promise<any>;
  handleGdprRequest(request: any): Promise<any>;
  cleanupExpiredLogs(): Promise<number>;
}

export interface IComplianceReport {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  generatedBy: string;
  companyId: string;
  criteria: Record<string, any>;
  summary: {
    totalLogs: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    entitiesAffected: number;
    usersInvolved: number;
  };
  data: IAuditLog[];
  statistics: Record<string, any>;
}

export interface IGdprRequest {
  id: string;
  requestType: "access" | "portability" | "deletion" | "rectification";
  subjectUserId: string;
  requestedBy: string;
  companyId: string;
  status: "pending" | "processing" | "completed" | "rejected";
  reason?: string;
  requestedDate: Date;
  processedDate?: Date;
  result?: any;
  additionalContext?: Record<string, any>;
}

export interface IDataRetentionPolicy {
  id: string;
  entityType: AuditEntityType;
  retentionDays: number;
  minimumSeverity?: AuditSeverity;
  archiveBeforeDeletion: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditFilter {
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  companyId?: string;
  result?: AuditResult;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  ipAddress?: string;
  tags?: string[];
  includeSystemGenerated?: boolean;
}

export interface IAuditStatistics {
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

export interface IAuditConfig {
  enableAuditing: boolean;
  logLevel: AuditSeverity;
  retentionPeriod: number;
  enableGdprCompliance: boolean;
  enableRealTimeAlerts: boolean;
  maxLogSize: number;
  batchSize: number;
  enableEncryption: boolean;
  enableCompression: boolean;
  alertThresholds: {
    failedLogins: number;
    criticalActions: number;
    suspiciousActivity: number;
  };
}

export interface IAuditSearchCriteria {
  query?: string;
  filters?: IAuditFilter;
  pagination?: {
    page: number;
    limit: number;
  };
  sorting?: {
    field: string;
    order: "asc" | "desc";
  };
  includes?: string[];
}

export interface IAuditAlert {
  id: string;
  type: "security" | "compliance" | "suspicious" | "system";
  severity: AuditSeverity;
  title: string;
  description: string;
  relatedAuditLogId?: string;
  companyId: string;
  triggeredBy?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}
