import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { CustomLoggerService } from "../logging/logger.service";
import { SupabaseService } from "../shared/services/supabase.service";
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogListResponseDto,
  ComplianceReportDto,
  GdprRequestDto,
  AuditStatisticsDto,
  AuditAction,
  AuditEntityType,
  AuditResult,
  AuditSeverity,
} from "./dto/audit-log.dto";
import {
  IComplianceReport,
  IGdprRequest,
  IDataRetentionPolicy,
} from "./interfaces/audit-log.interface";

export interface AuditLogEntity {
  id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  user_id?: string;
  company_id: string;
  description: string;
  changes?: any;
  context?: any;
  result: AuditResult;
  severity: AuditSeverity;
  error_message?: string;
  additional_data?: any;
  tags?: string[];
  is_system_generated: boolean;
  requires_retention: boolean;
  created_at: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async logAction(auditData: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    try {
      this.logger.logBusinessEvent("audit_log_creation_attempt", {
        action: auditData.action,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        userId: auditData.userId,
        companyId: auditData.companyId,
      });

      const auditLogData = {
        action: auditData.action,
        entity_type: auditData.entityType,
        entity_id: auditData.entityId,
        user_id: auditData.userId,
        company_id: auditData.companyId,
        description: auditData.description,
        changes: auditData.changes || null,
        context: auditData.context || null,
        result: auditData.result || AuditResult.SUCCESS,
        severity: auditData.severity || AuditSeverity.LOW,
        error_message: auditData.errorMessage,
        additional_data: auditData.additionalData || null,
        tags: auditData.tags || [],
        is_system_generated: auditData.isSystemGenerated || false,
        requires_retention: auditData.requiresRetention !== false,
        created_at: new Date().toISOString(),
      };

      const response = await this.supabaseService
        .getClient()
        .from("audit_logs")
        .insert(auditLogData)
        .select(
          `
          *,
          users!audit_logs_user_id_fkey(first_name, last_name),
          companies!audit_logs_company_id_fkey(name)
        `,
        )
        .single();

      if (response.error) {
        this.logger.logError("Failed to create audit log", {
          error: response.error.message,
          auditData: JSON.stringify(auditData),
        });
        throw new BadRequestException("Failed to create audit log");
      }

      const auditLogResponse = this.mapToAuditLogResponse(response.data);

      this.logger.logBusinessEvent("audit_log_created", {
        auditLogId: auditLogResponse.id,
        action: auditLogResponse.action,
        entityType: auditLogResponse.entityType,
        entityId: auditLogResponse.entityId,
      });

      // Check for security alerts
      await this.checkForSecurityAlerts(auditLogResponse);

      return auditLogResponse;
    } catch (error) {
      this.logger.logError("Error creating audit log", {
        error: error instanceof Error ? error.message : "Unknown error",
        auditData: JSON.stringify(auditData),
      });
      throw error;
    }
  }

  async getAuditLogs(
    query: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = (page - 1) * limit;

      let queryBuilder = this.supabaseService
        .getClient()
        .from("audit_logs")
        .select(
          `
          *,
          users!audit_logs_user_id_fkey(first_name, last_name),
          companies!audit_logs_company_id_fkey(name)
        `,
          { count: "exact" },
        );

      // Apply filters
      if (query.action) {
        queryBuilder = queryBuilder.eq("action", query.action);
      }

      if (query.entityType) {
        queryBuilder = queryBuilder.eq("entity_type", query.entityType);
      }

      if (query.entityId) {
        queryBuilder = queryBuilder.eq("entity_id", query.entityId);
      }

      if (query.userId) {
        queryBuilder = queryBuilder.eq("user_id", query.userId);
      }

      if (query.companyId) {
        queryBuilder = queryBuilder.eq("company_id", query.companyId);
      }

      if (query.result) {
        queryBuilder = queryBuilder.eq("result", query.result);
      }

      if (query.severity) {
        queryBuilder = queryBuilder.eq("severity", query.severity);
      }

      if (query.startDate) {
        queryBuilder = queryBuilder.gte("created_at", query.startDate);
      }

      if (query.endDate) {
        queryBuilder = queryBuilder.lte("created_at", query.endDate);
      }

      if (query.search) {
        queryBuilder = queryBuilder.or(
          `description.ilike.%${query.search}%,error_message.ilike.%${query.search}%`,
        );
      }

      if (query.ipAddress) {
        queryBuilder = queryBuilder.contains("context", {
          ipAddress: query.ipAddress,
        });
      }

      if (query.tags && query.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps("tags", query.tags);
      }

      if (!query.includeSystemGenerated) {
        queryBuilder = queryBuilder.eq("is_system_generated", false);
      }

      // Apply sorting
      const sortBy = query.sortBy || "created_at";
      const sortOrder = query.sortOrder || "desc";
      queryBuilder = queryBuilder.order(sortBy, {
        ascending: sortOrder === "asc",
      });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        this.logger.logError("Failed to fetch audit logs", {
          error: error.message,
          query: JSON.stringify(query),
        });
        throw new BadRequestException("Failed to fetch audit logs");
      }

      const auditLogs = data.map((log) => this.mapToAuditLogResponse(log));
      const totalPages = Math.ceil((count || 0) / limit);

      return {
        auditLogs,
        total: count || 0,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.logError("Error fetching audit logs", {
        error: error instanceof Error ? error.message : "Unknown error",
        query: JSON.stringify(query),
      });
      throw error;
    }
  }

  async getAuditLog(id: string): Promise<AuditLogResponseDto> {
    try {
      const response = await this.supabaseService
        .getClient()
        .from("audit_logs")
        .select(
          `
          *,
          users!audit_logs_user_id_fkey(first_name, last_name),
          companies!audit_logs_company_id_fkey(name)
        `,
        )
        .eq("id", id)
        .single();

      if (response.error || !response.data) {
        throw new NotFoundException("Audit log not found");
      }

      return this.mapToAuditLogResponse(response.data);
    } catch (error) {
      this.logger.logError("Error fetching audit log", {
        error: error instanceof Error ? error.message : "Unknown error",
        auditLogId: id,
      });
      throw error;
    }
  }

  async generateComplianceReport(
    criteria: ComplianceReportDto,
  ): Promise<IComplianceReport> {
    try {
      this.logger.logBusinessEvent("compliance_report_generation_started", {
        criteria: JSON.stringify(criteria),
      });

      const query: AuditLogQueryDto = {
        startDate: criteria.startDate,
        endDate: criteria.endDate,
        entityType: criteria.entityType,
        action: criteria.action,
        companyId: criteria.companyId,
        includeSystemGenerated: true,
        limit: 10000, // Large limit for comprehensive report
      };

      if (!criteria.includeFailedAttempts) {
        query.result = AuditResult.SUCCESS;
      }

      if (criteria.severityLevels && criteria.severityLevels.length > 0) {
        // Note: This would need to be implemented with multiple queries or raw SQL
        // For now, we'll fetch all and filter in memory
      }

      const auditLogsResult = await this.getAuditLogs(query);
      const auditLogs = auditLogsResult.auditLogs;

      // Filter by severity if specified
      let filteredLogs = auditLogs;
      if (criteria.severityLevels && criteria.severityLevels.length > 0) {
        filteredLogs = auditLogs.filter((log) =>
          criteria.severityLevels!.includes(log.severity),
        );
      }

      // Generate statistics
      const statistics = this.generateStatistics(filteredLogs);

      const report: IComplianceReport = {
        reportId: `compliance_${Date.now()}`,
        reportType: criteria.reportType || "compliance",
        generatedAt: new Date(),
        generatedBy: "system", // This should be set from current user context
        companyId: criteria.companyId || "all",
        criteria: criteria as any,
        summary: {
          totalLogs: filteredLogs.length,
          dateRange: {
            start: criteria.startDate
              ? new Date(criteria.startDate)
              : new Date(0),
            end: criteria.endDate ? new Date(criteria.endDate) : new Date(),
          },
          entitiesAffected: new Set(filteredLogs.map((log) => log.entityId))
            .size,
          usersInvolved: new Set(
            filteredLogs.map((log) => log.userId).filter(Boolean),
          ).size,
        },
        data: filteredLogs as any[],
        statistics: statistics as any,
      };

      // Log the report generation
      await this.logAction({
        action: AuditAction.EXPORT,
        entityType: AuditEntityType.REPORT,
        entityId: report.reportId,
        companyId: criteria.companyId || "system",
        description: `Compliance report generated with ${filteredLogs.length} entries`,
        severity: AuditSeverity.MEDIUM,
        additionalData: {
          reportType: criteria.reportType,
          entriesCount: filteredLogs.length,
        },
        isSystemGenerated: true,
      });

      return report;
    } catch (error) {
      this.logger.logError("Error generating compliance report", {
        error: error instanceof Error ? error.message : "Unknown error",
        criteria: JSON.stringify(criteria),
      });
      throw error;
    }
  }

  async handleGdprRequest(request: GdprRequestDto): Promise<IGdprRequest> {
    try {
      this.logger.logBusinessEvent("gdpr_request_initiated", {
        requestType: request.requestType,
        subjectUserId: request.subjectUserId,
      });

      const gdprRequestData = {
        request_type: request.requestType,
        subject_user_id: request.subjectUserId,
        requested_by: "system", // This should be set from current user context
        company_id: "system", // This should be derived from context
        status: "pending",
        reason: request.reason,
        requested_date: request.requestedDate || new Date().toISOString(),
        additional_context: request.additionalContext || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await this.supabaseService
        .getClient()
        .from("gdpr_requests")
        .insert(gdprRequestData)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to create GDPR request", {
          error: response.error.message,
          requestData: JSON.stringify(gdprRequestData),
        });
        throw new BadRequestException("Failed to create GDPR request");
      }

      const gdprRequest = this.mapToGdprRequest(response.data);

      // Log the GDPR request creation
      await this.logAction({
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: request.subjectUserId,
        companyId: "system",
        description: `GDPR ${request.requestType} request created`,
        severity: AuditSeverity.HIGH,
        additionalData: {
          gdprRequestId: gdprRequest.id,
          requestType: request.requestType,
        },
        isSystemGenerated: true,
        requiresRetention: true,
      });

      // Process the request based on type
      await this.processGdprRequest(gdprRequest);

      return gdprRequest;
    } catch (error) {
      this.logger.logError("Error handling GDPR request", {
        error: error instanceof Error ? error.message : "Unknown error",
        request: JSON.stringify(request),
      });
      throw error;
    }
  }

  async cleanupExpiredLogs(): Promise<number> {
    try {
      this.logger.logBusinessEvent("audit_log_cleanup_started", {});

      // Get retention policies
      const retentionPolicies = await this.getRetentionPolicies();
      let totalDeleted = 0;

      for (const policy of retentionPolicies) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        let deleteQuery = this.supabaseService
          .getClient()
          .from("audit_logs")
          .delete()
          .eq("entity_type", policy.entityType)
          .lt("created_at", cutoffDate.toISOString())
          .eq("requires_retention", false);

        if (policy.minimumSeverity) {
          // Only delete logs with severity lower than the minimum
          const severityOrder = [
            AuditSeverity.LOW,
            AuditSeverity.MEDIUM,
            AuditSeverity.HIGH,
            AuditSeverity.CRITICAL,
          ];
          const minIndex = severityOrder.indexOf(policy.minimumSeverity);
          const allowedSeverities = severityOrder.slice(0, minIndex);

          if (allowedSeverities.length > 0) {
            deleteQuery = deleteQuery.in("severity", allowedSeverities);
          } else {
            continue; // Skip if no logs can be deleted
          }
        }

        const { count, error } = await deleteQuery;

        if (error) {
          this.logger.logError("Failed to cleanup audit logs", {
            error: error.message,
            policy: JSON.stringify(policy),
          });
          continue;
        }

        totalDeleted += count || 0;
      }

      await this.logAction({
        action: AuditAction.DELETE,
        entityType: AuditEntityType.AUDIT_LOG,
        entityId: "bulk_cleanup",
        companyId: "system",
        description: `Cleanup completed: ${totalDeleted} audit logs removed`,
        severity: AuditSeverity.LOW,
        additionalData: {
          deletedCount: totalDeleted,
        },
        isSystemGenerated: true,
      });

      this.logger.logBusinessEvent("audit_log_cleanup_completed", {
        deletedCount: totalDeleted,
      });

      return totalDeleted;
    } catch (error) {
      this.logger.logError("Error during audit log cleanup", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async getStatistics(
    companyId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditStatisticsDto> {
    try {
      let query = this.supabaseService
        .getClient()
        .from("audit_logs")
        .select(
          "action, entity_type, result, severity, user_id, is_system_generated, created_at",
        );

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new BadRequestException("Failed to fetch audit statistics");
      }

      return this.generateStatistics(data as any[]);
    } catch (error) {
      this.logger.logError("Error fetching audit statistics", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId,
      });
      throw error;
    }
  }

  private async checkForSecurityAlerts(
    auditLog: AuditLogResponseDto,
  ): Promise<void> {
    // Check for suspicious activities
    if (
      auditLog.result === AuditResult.FAILURE &&
      auditLog.action === AuditAction.LOGIN
    ) {
      await this.checkFailedLoginAttempts(auditLog);
    }

    if (auditLog.severity === AuditSeverity.CRITICAL) {
      await this.createSecurityAlert(auditLog, "Critical action detected");
    }

    // Check for unusual access patterns
    if (auditLog.context?.ipAddress) {
      await this.checkUnusualAccessPatterns(auditLog);
    }
  }

  private async checkFailedLoginAttempts(
    auditLog: AuditLogResponseDto,
  ): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count } = await this.supabaseService
      .getClient()
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("action", AuditAction.LOGIN)
      .eq("result", AuditResult.FAILURE)
      .eq("entity_id", auditLog.entityId)
      .gte("created_at", oneHourAgo.toISOString());

    if ((count || 0) >= 5) {
      await this.createSecurityAlert(
        auditLog,
        "Multiple failed login attempts detected",
      );
    }
  }

  private async checkUnusualAccessPatterns(
    auditLog: AuditLogResponseDto,
  ): Promise<void> {
    // Implementation for detecting unusual access patterns
    // This is a placeholder for more sophisticated anomaly detection
  }

  private async createSecurityAlert(
    auditLog: AuditLogResponseDto,
    reason: string,
  ): Promise<void> {
    const alertData = {
      type: "security",
      severity: auditLog.severity,
      title: "Security Alert",
      description: reason,
      related_audit_log_id: auditLog.id,
      company_id: auditLog.companyId,
      triggered_by: auditLog.userId,
      is_resolved: false,
      metadata: {
        auditLogId: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        reason,
      },
      created_at: new Date().toISOString(),
    };

    await this.supabaseService
      .getClient()
      .from("audit_alerts")
      .insert(alertData);
  }

  private async processGdprRequest(gdprRequest: IGdprRequest): Promise<void> {
    // Mark request as processing
    await this.supabaseService
      .getClient()
      .from("gdpr_requests")
      .update({ status: "processing" })
      .eq("id", gdprRequest.id);

    switch (gdprRequest.requestType) {
      case "access":
        await this.processDataAccessRequest(gdprRequest);
        break;
      case "portability":
        await this.processDataPortabilityRequest(gdprRequest);
        break;
      case "deletion":
        await this.processDataDeletionRequest(gdprRequest);
        break;
      case "rectification":
        await this.processDataRectificationRequest(gdprRequest);
        break;
    }
  }

  private async processDataAccessRequest(
    gdprRequest: IGdprRequest,
  ): Promise<void> {
    // Collect all data related to the user
    const userData = await this.collectUserData(gdprRequest.subjectUserId);

    await this.supabaseService
      .getClient()
      .from("gdpr_requests")
      .update({
        status: "completed",
        processed_date: new Date().toISOString(),
        result: userData,
      })
      .eq("id", gdprRequest.id);
  }

  private async processDataPortabilityRequest(
    gdprRequest: IGdprRequest,
  ): Promise<void> {
    // Export user data in a portable format
    const portableData = await this.exportUserDataPortable(
      gdprRequest.subjectUserId,
    );

    await this.supabaseService
      .getClient()
      .from("gdpr_requests")
      .update({
        status: "completed",
        processed_date: new Date().toISOString(),
        result: { exportUrl: portableData.url, format: "json" },
      })
      .eq("id", gdprRequest.id);
  }

  private async processDataDeletionRequest(
    gdprRequest: IGdprRequest,
  ): Promise<void> {
    // Anonymize or delete user data
    await this.anonymizeUserData(gdprRequest.subjectUserId);

    await this.supabaseService
      .getClient()
      .from("gdpr_requests")
      .update({
        status: "completed",
        processed_date: new Date().toISOString(),
        result: { action: "data_anonymized" },
      })
      .eq("id", gdprRequest.id);
  }

  private async processDataRectificationRequest(
    gdprRequest: IGdprRequest,
  ): Promise<void> {
    // Process data correction request
    await this.supabaseService
      .getClient()
      .from("gdpr_requests")
      .update({
        status: "completed",
        processed_date: new Date().toISOString(),
        result: { action: "manual_review_required" },
      })
      .eq("id", gdprRequest.id);
  }

  private async collectUserData(userId: string): Promise<any> {
    // Collect all user-related data across all tables
    const tables = ["users", "audit_logs", "transactions", "invoices"];
    const userData: any = {};

    for (const table of tables) {
      const { data } = await this.supabaseService
        .getClient()
        .from(table)
        .select("*")
        .eq("user_id", userId);

      userData[table] = data || [];
    }

    return userData;
  }

  private async exportUserDataPortable(
    userId: string,
  ): Promise<{ url: string }> {
    const userData = await this.collectUserData(userId);
    // In a real implementation, this would upload to a secure storage
    // and return a temporary download URL
    return { url: `https://example.com/export/${userId}` };
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize user data while preserving audit trail
    const anonymizedId = `anon_${Date.now()}`;

    await this.supabaseService
      .getClient()
      .from("users")
      .update({
        email: `${anonymizedId}@anonymized.local`,
        first_name: "Anonymous",
        last_name: "User",
        phone: null,
        avatar_url: null,
      })
      .eq("id", userId);

    // Update audit logs to reference anonymized user
    await this.supabaseService
      .getClient()
      .from("audit_logs")
      .update({ user_id: anonymizedId })
      .eq("user_id", userId);
  }

  private async getRetentionPolicies(): Promise<IDataRetentionPolicy[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("data_retention_policies")
      .select("*")
      .eq("is_active", true);

    if (error) {
      this.logger.logError("Failed to fetch retention policies", {
        error: error.message,
      });
      return this.getDefaultRetentionPolicies();
    }

    return data.map((policy) => this.mapToRetentionPolicy(policy));
  }

  private getDefaultRetentionPolicies(): IDataRetentionPolicy[] {
    return [
      {
        id: "default_user",
        entityType: AuditEntityType.USER,
        retentionDays: 2555, // 7 years
        minimumSeverity: AuditSeverity.MEDIUM,
        archiveBeforeDeletion: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default_transaction",
        entityType: AuditEntityType.TRANSACTION,
        retentionDays: 2555, // 7 years
        minimumSeverity: AuditSeverity.LOW,
        archiveBeforeDeletion: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default_general",
        entityType: AuditEntityType.ACCOUNT,
        retentionDays: 1095, // 3 years
        minimumSeverity: AuditSeverity.LOW,
        archiveBeforeDeletion: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private generateStatistics(logs: any[]): AuditStatisticsDto {
    const logsByAction: Record<AuditAction, number> = {} as any;
    const logsByEntityType: Record<AuditEntityType, number> = {} as any;
    const logsByResult: Record<AuditResult, number> = {} as any;
    const logsBySeverity: Record<AuditSeverity, number> = {} as any;
    const uniqueUsers = new Set<string>();
    const actionCounts: Record<string, number> = {};

    let failedOperations = 0;
    let systemGeneratedLogs = 0;
    let userGeneratedLogs = 0;

    logs.forEach((log) => {
      // Count by action
      logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

      // Count by entity type
      logsByEntityType[log.entity_type || log.entityType] =
        (logsByEntityType[log.entity_type || log.entityType] || 0) + 1;

      // Count by result
      logsByResult[log.result] = (logsByResult[log.result] || 0) + 1;
      if (log.result === AuditResult.FAILURE) {
        failedOperations++;
      }

      // Count by severity
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;

      // Track unique users
      if (log.user_id || log.userId) {
        uniqueUsers.add(log.user_id || log.userId);
      }

      // Count system vs user generated
      if (log.is_system_generated || log.isSystemGenerated) {
        systemGeneratedLogs++;
      } else {
        userGeneratedLogs++;
      }
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action: action as AuditAction, count }));

    const dates = logs.map((log) => new Date(log.created_at || log.createdAt));
    const minDate =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : new Date();
    const maxDate =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : new Date();

    return {
      totalLogs: logs.length,
      logsByAction,
      logsByEntityType,
      logsByResult,
      logsBySeverity,
      uniqueUsers: uniqueUsers.size,
      dateRange: {
        start: minDate,
        end: maxDate,
      },
      topActions,
      failedOperations,
      systemGeneratedLogs,
      userGeneratedLogs,
    };
  }

  private mapToAuditLogResponse(entity: any): AuditLogResponseDto {
    return {
      id: entity.id,
      action: entity.action,
      entityType: entity.entity_type,
      entityId: entity.entity_id,
      userId: entity.user_id,
      userName: entity.users
        ? `${entity.users.first_name} ${entity.users.last_name}`
        : undefined,
      companyId: entity.company_id,
      companyName: entity.companies?.name,
      description: entity.description,
      changes: entity.changes,
      context: entity.context,
      result: entity.result,
      severity: entity.severity,
      errorMessage: entity.error_message,
      additionalData: entity.additional_data,
      tags: entity.tags || [],
      isSystemGenerated: entity.is_system_generated,
      requiresRetention: entity.requires_retention,
      createdAt: new Date(entity.created_at),
    };
  }

  private mapToGdprRequest(entity: any): IGdprRequest {
    return {
      id: entity.id,
      requestType: entity.request_type,
      subjectUserId: entity.subject_user_id,
      requestedBy: entity.requested_by,
      companyId: entity.company_id,
      status: entity.status,
      reason: entity.reason,
      requestedDate: new Date(entity.requested_date),
      processedDate: entity.processed_date
        ? new Date(entity.processed_date)
        : undefined,
      result: entity.result,
      additionalContext: entity.additional_context,
    };
  }

  private mapToRetentionPolicy(entity: any): IDataRetentionPolicy {
    return {
      id: entity.id,
      entityType: entity.entity_type,
      retentionDays: entity.retention_days,
      minimumSeverity: entity.minimum_severity,
      archiveBeforeDeletion: entity.archive_before_deletion,
      isActive: entity.is_active,
      createdBy: entity.created_by,
      createdAt: new Date(entity.created_at),
      updatedAt: new Date(entity.updated_at),
    };
  }
}
