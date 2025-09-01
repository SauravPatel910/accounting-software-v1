# Audit & Compliance Module

## Overview

The Audit & Compliance module provides comprehensive audit trail implementation, user action tracking, data change history, compliance reporting, and GDPR compliance features for the accounting software.

## Features

### 1. Comprehensive Audit Trail

- **Automatic Logging**: Uses decorators and interceptors to automatically log user actions
- **Manual Logging**: Service methods for custom audit log creation
- **Multi-level Audit**: Support for different audit actions and entity types
- **Contextual Information**: Captures user agent, IP address, and request context

### 2. User Action Tracking

- Login/logout events
- CRUD operations on all entities
- Administrative actions
- Security-related events
- System-generated vs user-generated actions

### 3. Data Change History

- Before/after value tracking
- Structured change representation
- Field-level change detection
- JSON-based change storage

### 4. Compliance Reporting

- Automated compliance reports
- Configurable reporting periods
- Statistical analysis of audit data
- Export capabilities (JSON, CSV)

### 5. GDPR Compliance

- Data access requests
- Data portability
- Data deletion (right to be forgotten)
- Data rectification
- Automated request processing

## Module Structure

```
src/audit-logs/
├── dto/
│   └── audit-log.dto.ts          # DTOs for audit logs, GDPR requests, etc.
├── interfaces/
│   └── audit-log.interface.ts    # TypeScript interfaces
├── decorators/
│   └── audit-log.decorator.ts    # Automatic audit logging decorators
├── audit-logs.service.ts         # Core business logic
├── audit-logs.controller.ts      # REST API endpoints
├── audit.interceptor.ts          # Automatic audit capture
├── audit-logs.module.ts          # Module definition
├── audit-logs.service.spec.ts    # Unit tests
└── index.ts                      # Module exports
```

## Database Schema

The module uses the following database tables:

- `audit_logs` - Main audit trail storage
- `gdpr_requests` - GDPR compliance requests
- `data_retention_policies` - Data retention configuration
- `audit_alerts` - Security and compliance alerts

## Usage Examples

### 1. Automatic Audit Logging with Decorators

```typescript
import {
  AuditLog,
  AuditCritical,
} from "../audit-logs/decorators/audit-log.decorator";
import { AuditAction, AuditEntityType } from "../audit-logs/dto/audit-log.dto";

@Controller("users")
export class UsersController {
  @Post()
  @AuditLog({
    action: AuditAction.CREATE,
    entityType: AuditEntityType.USER,
    description: "User account created",
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Delete(":id")
  @AuditCritical({
    action: AuditAction.DELETE,
    entityType: AuditEntityType.USER,
    description: "User account deleted",
  })
  async deleteUser(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

### 2. Manual Audit Logging

```typescript
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import {
  AuditAction,
  AuditEntityType,
  AuditResult,
  AuditSeverity,
} from "../audit-logs/dto/audit-log.dto";

@Injectable()
export class UsersService {
  constructor(private auditLogsService: AuditLogsService) {}

  async updateUser(id: string, updateData: UpdateUserDto, currentUser: User) {
    const oldUser = await this.findOne(id);
    const updatedUser = await this.update(id, updateData);

    // Manual audit logging
    await this.auditLogsService.logAction({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: id,
      userId: currentUser.id,
      companyId: currentUser.company_id,
      description: "User profile updated",
      changes: [
        {
          field: "email",
          oldValue: oldUser.email,
          newValue: updatedUser.email,
        },
        {
          field: "name",
          oldValue: oldUser.name,
          newValue: updatedUser.name,
        },
      ],
      context: {
        userAgent: "Browser/1.0",
        ip: "192.168.1.1",
      },
      result: AuditResult.SUCCESS,
      severity: AuditSeverity.MEDIUM,
    });

    return updatedUser;
  }
}
```

### 3. GDPR Request Handling

```typescript
// Handle data access request
const accessResult = await auditLogsService.handleGdprRequest({
  requestType: "access",
  subjectUserId: userId,
  requestedBy: adminUserId,
  companyId: companyId,
  reason: "User requested data access for review",
});

// Handle data deletion request
const deletionResult = await auditLogsService.handleGdprRequest({
  requestType: "deletion",
  subjectUserId: userId,
  requestedBy: adminUserId,
  companyId: companyId,
  reason: "User requested account deletion",
});
```

### 4. Compliance Reporting

```typescript
// Generate compliance report
const report = await auditLogsService.generateComplianceReport({
  companyId: "company-uuid",
  startDate: new Date("2023-01-01"),
  endDate: new Date("2023-12-31"),
  includeStatistics: true,
  includeFailedOperations: true,
  includeSensitiveData: false,
});

// Get audit statistics
const stats = await auditLogsService.getStatistics(companyId);
```

## API Endpoints

### Audit Logs Management

- `GET /audit-logs` - Retrieve audit logs with filters
- `GET /audit-logs/:id` - Get specific audit log
- `POST /audit-logs` - Create manual audit log
- `GET /audit-logs/statistics` - Get audit statistics
- `POST /audit-logs/export` - Export audit logs

### Compliance & Reporting

- `GET /audit-logs/compliance/report` - Generate compliance report
- `POST /audit-logs/compliance/gdpr-request` - Create GDPR request
- `GET /audit-logs/compliance/gdpr-requests` - List GDPR requests
- `PUT /audit-logs/compliance/gdpr-requests/:id` - Update GDPR request status

### Data Management

- `POST /audit-logs/cleanup` - Cleanup expired logs
- `GET /audit-logs/retention-policies` - Get retention policies
- `PUT /audit-logs/retention-policies/:id` - Update retention policy

## Security Features

### Row Level Security (RLS)

- Company-based data isolation
- Role-based access control
- User-specific audit log access

### Data Retention

- Configurable retention periods
- Automatic cleanup of expired logs
- Archive before deletion option

### Security Alerts

- Failed operation monitoring
- Suspicious activity detection
- Critical action notifications

## Configuration

### Environment Variables

```bash
# Audit Log Configuration
AUDIT_LOG_RETENTION_DAYS=1095
AUDIT_LOG_CLEANUP_ENABLED=true
AUDIT_LOG_CLEANUP_INTERVAL=24

# GDPR Configuration
GDPR_REQUEST_TIMEOUT_DAYS=30
GDPR_AUTO_PROCESS_ACCESS=true
GDPR_AUTO_PROCESS_DELETION=false

# Security Configuration
AUDIT_SECURITY_ALERTS_ENABLED=true
AUDIT_FAILED_LOGIN_THRESHOLD=5
AUDIT_SUSPICIOUS_ACTIVITY_ENABLED=true
```

### Data Retention Policies

Default retention policies are automatically created:

- **User data**: 7 years (2555 days)
- **Transaction data**: 7 years (2555 days)
- **Invoice data**: 7 years (2555 days)
- **Audit logs**: 3 years (1095 days)
- **Settings**: 1 year (365 days)

## Integration

The module is integrated into the main application through:

1. **Module Import**: Added to `app.module.ts`
2. **Database Schema**: SQL migration in `database/schema/08_audit_logs_table.sql`
3. **Global Interceptor**: Automatic audit capture for all decorated endpoints
4. **Service Injection**: Available for manual audit logging

## Testing

Run the test suite:

```bash
# Unit tests
npm run test audit-logs

# E2E tests
npm run test:e2e audit-logs

# Test coverage
npm run test:cov audit-logs
```

## Performance Considerations

### Database Optimization

- Comprehensive indexing strategy
- Partitioning for large datasets
- Efficient query patterns

### Background Processing

- Async audit log creation
- Batch processing for cleanup
- Queue-based GDPR processing

### Monitoring

- Audit log volume monitoring
- Performance metrics tracking
- Alert thresholds configuration

## Compliance Standards

The module helps meet various compliance requirements:

- **GDPR** (General Data Protection Regulation)
- **SOX** (Sarbanes-Oxley Act)
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **PCI DSS** (Payment Card Industry Data Security Standard)
- **ISO 27001** (Information Security Management)

## Troubleshooting

### Common Issues

1. **Large audit log volumes**: Configure appropriate retention policies
2. **Performance issues**: Review indexing and query patterns
3. **GDPR request failures**: Check user permissions and data integrity
4. **Missing audit logs**: Verify decorator placement and interceptor configuration

### Monitoring Queries

```sql
-- Check audit log volume
SELECT COUNT(*) as total_logs,
       DATE_TRUNC('month', created_at) as month
FROM audit_logs
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Failed operations analysis
SELECT action, entity_type, COUNT(*) as failures
FROM audit_logs
WHERE result = 'failure'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY action, entity_type
ORDER BY failures DESC;

-- GDPR request status
SELECT request_type, status, COUNT(*) as count
FROM gdpr_requests
GROUP BY request_type, status;
```

## Future Enhancements

- Real-time audit stream processing
- Machine learning for anomaly detection
- Advanced compliance reporting templates
- Integration with external SIEM systems
- Blockchain-based audit trail immutability
