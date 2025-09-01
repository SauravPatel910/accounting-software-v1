import { Module } from "@nestjs/common";
import { CompaniesService } from "./companies.service";
import { CompaniesController } from "./companies.controller";
import { SharedModule } from "../shared/shared.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [SharedModule, LoggingModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
