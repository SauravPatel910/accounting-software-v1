import { Module } from "@nestjs/common";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { SharedModule } from "../shared/shared.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [SharedModule, LoggingModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
