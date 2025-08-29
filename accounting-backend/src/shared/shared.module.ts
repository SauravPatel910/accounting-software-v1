import { Global, Module } from "@nestjs/common";
import { SupabaseService, DecimalService } from "./services";
import { AppConfigService } from "../app-config.service";

@Global()
@Module({
  providers: [AppConfigService, SupabaseService, DecimalService],
  exports: [AppConfigService, SupabaseService, DecimalService],
})
export class SharedModule {}
