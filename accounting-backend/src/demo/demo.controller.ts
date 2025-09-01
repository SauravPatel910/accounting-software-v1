import { Controller, Get, UseGuards, Post, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../auth/types/auth.types";
import type { UserData } from "../auth/types/auth.types";

@Controller("demo")
export class DemoController {
  @Get("public")
  getPublicData() {
    return {
      message: "This is public data - no authentication required",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("protected")
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user: UserData) {
    return {
      message: "This is protected data - authentication required",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get("admin-only")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminData(@CurrentUser() user: UserData) {
    return {
      message: "This is admin-only data - admin role required",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get("manager-or-admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getManagerData(@CurrentUser() user: UserData) {
    return {
      message: "This data requires manager or admin role",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post("test-endpoint")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.ADMIN)
  createTestData(
    @CurrentUser() user: UserData,
    @Body() testData: Record<string, unknown>,
  ) {
    return {
      message: "Test data created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      data: testData,
      timestamp: new Date().toISOString(),
    };
  }
}
