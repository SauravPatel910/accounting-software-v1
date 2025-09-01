import { Test, TestingModule } from "@nestjs/testing";
import { AuditLogsService } from "./audit-logs.service";
import { CustomLoggerService } from "../logging/logger.service";
import { SupabaseService } from "../shared/services/supabase.service";
import {
  AuditAction,
  AuditEntityType,
  AuditResult,
  AuditSeverity,
  DataChangeDto,
} from "./dto/audit-log.dto";

describe("AuditLogsService", () => {
  let service: AuditLogsService;

  const mockLoggingService = {
    logBusinessEvent: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "123e4567-e89b-12d3-a456-426614174000" }],
            error: null,
          }),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "123e4567-e89b-12d3-a456-426614174000" }],
            error: null,
          }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      })),
      rpc: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: CustomLoggerService,
          useValue: mockLoggingService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("logAction", () => {
    it("should successfully log an audit action", async () => {
      const auditData = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174001",
        companyId: "123e4567-e89b-12d3-a456-426614174002",
        description: "User created successfully",
        changes: [
          {
            field: "name",
            oldValue: null,
            newValue: "John Doe",
          } as DataChangeDto,
          {
            field: "email",
            oldValue: null,
            newValue: "john@example.com",
          } as DataChangeDto,
        ],
        context: { userAgent: "Mozilla/5.0", ip: "192.168.1.1" },
        result: AuditResult.SUCCESS,
        severity: AuditSeverity.MEDIUM,
      };

      const result = await service.logAction(auditData);

      expect(result).toEqual({
        success: true,
        auditLogId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(mockLoggingService.logBusinessEvent).toHaveBeenCalled();
    });

    it("should handle audit logging errors gracefully", async () => {
      const mockError = new Error("Database connection failed");

      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      const fromSpy = jest.spyOn(mockClient, "from");
      fromSpy.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        })),
      } as never);

      const auditData = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        entityId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174001",
        companyId: "123e4567-e89b-12d3-a456-426614174002",
        description: "User created successfully",
      };

      const result = await service.logAction(auditData);

      expect(result).toEqual({
        success: false,
        error: "Failed to create audit log",
      });
      expect(mockLoggingService.logError).toHaveBeenCalled();
    });
  });

  describe("getAuditLogs", () => {
    it("should retrieve audit logs with filters", async () => {
      const mockAuditLogs = [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          action: AuditAction.CREATE,
          entity_type: AuditEntityType.USER,
          entity_id: "123e4567-e89b-12d3-a456-426614174001",
          user_id: "123e4567-e89b-12d3-a456-426614174002",
          company_id: "123e4567-e89b-12d3-a456-426614174003",
          description: "User created successfully",
          result: AuditResult.SUCCESS,
          severity: AuditSeverity.MEDIUM,
          created_at: new Date().toISOString(),
        },
      ];

      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      const fromSpy = jest.spyOn(mockClient, "from");
      fromSpy.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockAuditLogs,
                error: null,
              }),
            })),
          })),
        })),
      } as never);

      const filters = {
        companyId: "123e4567-e89b-12d3-a456-426614174003",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.USER,
        limit: 10,
        offset: 0,
      };

      const result = await service.getAuditLogs(filters);

      expect(result).toEqual({
        success: true,
        data: mockAuditLogs,
        total: mockAuditLogs.length,
      });
    });
  });

  describe("generateComplianceReport", () => {
    it("should generate a compliance report", async () => {
      const mockStatistics = {
        totalLogs: 100,
        logsByAction: { create: 50, update: 30, delete: 20 },
        logsByEntityType: { user: 60, company: 40 },
        logsByResult: { success: 95, failure: 5 },
        logsBySeverity: { low: 60, medium: 30, high: 10 },
        uniqueUsers: 25,
        failedOperations: 5,
        systemGeneratedLogs: 20,
        userGeneratedLogs: 80,
      };

      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      jest.spyOn(mockClient, "rpc").mockResolvedValueOnce({
        data: [mockStatistics],
        error: null,
      });

      const result = await service.generateComplianceReport({
        companyId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2023-01-01").toISOString(),
        endDate: new Date("2023-12-31").toISOString(),
      });

      expect(result.reportId).toBeDefined();
      expect(result.companyId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.statistics).toEqual(mockStatistics);
    });
  });

  describe("handleGdprRequest", () => {
    it("should handle data access GDPR request", async () => {
      const mockUserData = {
        users: [{ id: "123", name: "John Doe", email: "john@example.com" }],
        audit_logs: [{ id: "456", action: "login", description: "User login" }],
      };

      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      jest.spyOn(mockClient, "rpc").mockResolvedValueOnce({
        data: mockUserData,
        error: null,
      });

      const fromSpy = jest.spyOn(mockClient, "from");
      fromSpy.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "789" }],
            error: null,
          }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "789" }],
            error: null,
          }),
        })),
      } as never);

      const result = await service.handleGdprRequest({
        requestType: "access",
        subjectUserId: "123e4567-e89b-12d3-a456-426614174000",
        reason: "User requested data access",
      });

      expect(result).toEqual({
        success: true,
        requestId: "789",
        status: "completed",
        data: mockUserData,
      });
    });
  });

  describe("cleanupExpiredLogs", () => {
    it("should cleanup expired audit logs", async () => {
      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      jest.spyOn(mockClient, "rpc").mockResolvedValueOnce({
        data: 15, // Number of deleted logs
        error: null,
      });

      const result = await service.cleanupExpiredLogs();

      expect(result).toEqual({
        success: true,
        deletedCount: 15,
        message: "Successfully cleaned up 15 expired audit logs",
      });
    });
  });

  describe("getStatistics", () => {
    it("should return audit statistics", async () => {
      const mockStatistics = {
        totalLogs: 1000,
        logsByAction: { create: 400, update: 300, delete: 100, read: 200 },
        logsByEntityType: { user: 500, company: 200, transaction: 300 },
        logsByResult: { success: 950, failure: 50 },
        logsBySeverity: { low: 600, medium: 300, high: 80, critical: 20 },
        uniqueUsers: 150,
        failedOperations: 50,
        systemGeneratedLogs: 200,
        userGeneratedLogs: 800,
      };

      // Override the mock for this specific test
      const mockClient = mockSupabaseService.getClient();
      jest.spyOn(mockClient, "rpc").mockResolvedValueOnce({
        data: [mockStatistics],
        error: null,
      });

      const result = await service.getStatistics(
        "123e4567-e89b-12d3-a456-426614174000",
      );

      expect(result).toEqual({
        success: true,
        statistics: mockStatistics,
      });
    });
  });
});
