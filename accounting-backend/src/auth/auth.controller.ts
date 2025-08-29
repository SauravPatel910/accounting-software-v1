import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service.js";
import {
  CreateUserProfileDto,
  UpdateUserProfileDto,
} from "./dto/user-profile.dto.js";
import { SupabaseAuthGuard } from "./supabase-auth.guard.js";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

@ApiTags("Auth")
@Controller("auth")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("profile")
  async createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() createUserProfileDto: CreateUserProfileDto,
  ): Promise<any> {
    const userId: string = req.user.id;
    return this.authService.createUserProfile(userId, createUserProfileDto);
  }

  @Get("profile")
  async getProfile(@Req() req: AuthenticatedRequest): Promise<any> {
    const userId: string = req.user.id;
    return this.authService.getUserProfile(userId);
  }

  @Put("profile")
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<any> {
    const userId: string = req.user.id;
    return this.authService.updateUserProfile(userId, updateUserProfileDto);
  }

  @Get("companies")
  async getCompanies(@Req() req: AuthenticatedRequest): Promise<any> {
    const userId: string = req.user.id;
    return this.authService.getUserCompanies(userId);
  }
}
