import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WinstonModule } from "nest-winston";
import {
  createWinstonTransports,
  LoggingConfig,
} from "../config/logging.config";
import { CustomLoggerService } from "./logger.service";

@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const loggingConfig = configService.get<LoggingConfig>("logging")!;

        return {
          level: loggingConfig.level,
          transports: createWinstonTransports(loggingConfig),
          exitOnError: false,
          silent: false,
          handleExceptions: true,
          handleRejections: true,
        };
      },
    }),
  ],
  providers: [CustomLoggerService],
  exports: [CustomLoggerService, WinstonModule],
})
export class LoggingModule {}
