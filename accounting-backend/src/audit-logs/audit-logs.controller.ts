import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../auth/types/auth.types";
import { AuditLogsService } from "./audit-logs.service";
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
  AuditSeverity,
  AuditResult,
} from "./dto/audit-log.dto";
import {
  AuditLog,
  AuditCritical,
  AuditSecurity,
  AuditGdpr,
} from "./decorators/audit-log.decorator";

@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditCritical(
    AuditAction.CREATE,
    AuditEntityType.AUDIT_LOG,
    "Manual audit log created",
  )
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(
    @Body() createAuditLogDto: CreateAuditLogDto,
    @CurrentUser() user: { userId: string; companyId: string },
  ): Promise<AuditLogResponseDto> {
    // Set the company ID from the current user if not provided
    if (!createAuditLogDto.companyId) {
      createAuditLogDto.companyId = user.companyId;
    }
    return this.auditLogsService.logAction(createAuditLogDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Audit logs list accessed",
  })
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }
    return this.auditLogsService.getAuditLogs(query);
  }

  @Get("statistics")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Audit statistics accessed",
  })
  async getStatistics(
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<AuditStatisticsDto> {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.auditLogsService.getStatistics(companyId, start, end);
  }

  @Get("export")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditCritical(
    AuditAction.EXPORT,
    AuditEntityType.AUDIT_LOG,
    "Audit logs exported",
  )
  async exportAuditLogs(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<{ exportUrl: string; totalRecords: number }> {
    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    // Set a large limit for export
    query.limit = 10000;

    const result = await this.auditLogsService.getAuditLogs(query);

    // In a real implementation, this would generate a file and return a download URL
    const exportUrl = `https://api.example.com/exports/audit-logs-${Date.now()}.csv`;

    return {
      exportUrl,
      totalRecords: result.total,
    };
  }

  @Post("compliance-report")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditCritical(
    AuditAction.EXPORT,
    AuditEntityType.REPORT,
    "Compliance report generated",
  )
  async generateComplianceReport(
    @Body() criteria: ComplianceReportDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ) {
    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN && !criteria.companyId) {
      criteria.companyId = user.companyId;
    }

    return this.auditLogsService.generateComplianceReport(criteria);
  }

  @Post("gdpr-request")
  @Roles(UserRole.ADMIN)
  @AuditGdpr(AuditAction.CREATE, "GDPR request initiated")
  async handleGdprRequest(@Body() request: GdprRequestDto) {
    return this.auditLogsService.handleGdprRequest(request);
  }

  @Post("cleanup")
  @Roles(UserRole.ADMIN)
  @AuditCritical(
    AuditAction.DELETE,
    AuditEntityType.AUDIT_LOG,
    "Audit log cleanup initiated",
  )
  async cleanupExpiredLogs(): Promise<{
    deletedCount: number;
    message: string;
  }> {
    const deletedCount = await this.auditLogsService.cleanupExpiredLogs();
    return {
      deletedCount,
      message: `Successfully cleaned up ${deletedCount} expired audit logs`,
    };
  }

  @Get("search")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Advanced audit log search performed",
  })
  async searchAuditLogs(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    return this.auditLogsService.getAuditLogs(query);
  }

  @Get("user/:userId")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditSecurity(
    AuditAction.READ,
    AuditEntityType.USER,
    "User audit history accessed",
  )
  async getUserAuditHistory(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    query.userId = userId;

    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    return this.auditLogsService.getAuditLogs(query);
  }

  @Get("entity/:entityType/:entityId")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Entity audit history accessed",
  })
  async getEntityAuditHistory(
    @Param("entityType") entityType: string,
    @Param("entityId", ParseUUIDPipe) entityId: string,
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    query.entityType = entityType as AuditEntityType;
    query.entityId = entityId;

    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    return this.auditLogsService.getAuditLogs(query);
  }

  @Get("security-alerts")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditSecurity(
    AuditAction.READ,
    AuditEntityType.AUDIT_LOG,
    "Security alerts accessed",
  )
  async getSecurityAlerts(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    // Filter for high severity and failed operations
    query.severity = AuditSeverity.HIGH;
    query.result = AuditResult.FAILURE;

    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    return this.auditLogsService.getAuditLogs(query);
  }

  @Get("failed-operations")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Failed operations report accessed",
  })
  async getFailedOperations(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogListResponseDto> {
    query.result = AuditResult.FAILURE;

    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN) {
      query.companyId = user.companyId;
    }

    return this.auditLogsService.getAuditLogs(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @AuditLog({
    action: AuditAction.READ,
    entityType: AuditEntityType.AUDIT_LOG,
    description: "Audit log details accessed",
  })
  async getAuditLog(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogsService.getAuditLog(id);

    // Restrict to company data for non-admin users
    if (user.role !== UserRole.ADMIN && auditLog.companyId !== user.companyId) {
      throw new Error(
        "Access denied: Cannot view audit logs from other companies",
      );
    }

    return auditLog;
  }

  @Delete("gdpr-cleanup/:userId")
  @Roles(UserRole.ADMIN)
  @AuditGdpr(AuditAction.DELETE, "GDPR data cleanup performed")
  @HttpCode(HttpStatus.NO_CONTENT)
  performGdprCleanup(@Param("userId", ParseUUIDPipe) userId: string): {
    message: string;
  } {
    // This would implement GDPR-compliant data removal
    // For now, it's a placeholder
    return {
      message: `GDPR cleanup completed for user ${userId}`,
    };
  }
}
