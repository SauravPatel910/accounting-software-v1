import { Module } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditInterceptor } from "./audit.interceptor";
import { SharedModule } from "../shared/shared.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [SharedModule, LoggingModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditInterceptor],
  exports: [AuditLogsService, AuditInterceptor],
})
export class AuditLogsModule {}
