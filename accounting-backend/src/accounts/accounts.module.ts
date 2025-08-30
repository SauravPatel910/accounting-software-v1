import { Module } from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { AccountsController } from "./accounts.controller";
import { SharedModule } from "../shared/shared.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [SharedModule, LoggingModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
