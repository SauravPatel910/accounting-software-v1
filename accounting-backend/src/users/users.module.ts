import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SharedModule } from "../shared/shared.module";
import { LoggingModule } from "../logging/logging.module";

@Module({
  imports: [SharedModule, LoggingModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
