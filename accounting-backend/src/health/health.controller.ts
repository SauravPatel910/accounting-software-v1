import { Controller, Get } from "@nestjs/common";
import { SupabaseService } from "../shared";

@Controller("health")
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async getHealth() {
    const supabaseHealth = await this.supabaseService.getHealthStatus();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseHealth,
        decimal: { status: "healthy", message: "Decimal service available" },
      },
    };
  }

  @Get("supabase")
  async getSupabaseHealth() {
    return this.supabaseService.getHealthStatus();
  }
}
