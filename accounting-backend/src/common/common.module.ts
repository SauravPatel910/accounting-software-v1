import { Module, Global } from "@nestjs/common";
import { DecimalService } from "./services/decimal.service";

@Global()
@Module({
  providers: [DecimalService],
  exports: [DecimalService],
})
export class CommonModule {}
