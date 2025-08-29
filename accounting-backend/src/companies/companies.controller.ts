// prettier-ignore
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ValidationPipe, UsePipes } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/types/auth.types";
import { CompaniesService } from "./companies.service";
// prettier-ignore
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanySettingsDto, UpdateCompanyPreferencesDto, UpdateSubscriptionDto, CompanyResponseDto, CompanyListResponseDto, CompanyQueryDto, CompanyStatus } from "./dto/company.dto";

@Controller("companies")
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query() query: CompanyQueryDto,
  ): Promise<CompanyListResponseDto> {
    return this.companiesService.findAll(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(@Param("id") id: string): Promise<CompanyResponseDto> {
    return this.companiesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param("id") id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Patch(":id/settings")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateSettings(
    @Param("id") id: string,
    @Body() updateSettingsDto: UpdateCompanySettingsDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateSettings(id, updateSettingsDto);
  }

  @Patch(":id/preferences")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updatePreferences(
    @Param("id") id: string,
    @Body() updatePreferencesDto: UpdateCompanyPreferencesDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updatePreferences(id, updatePreferencesDto);
  }

  @Patch(":id/subscription")
  @Roles(UserRole.ADMIN)
  async updateSubscription(
    @Param("id") id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateSubscription(id, updateSubscriptionDto);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: CompanyStatus,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateStatus(id, status);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    await this.companiesService.remove(id);
    return { message: "Company deleted successfully" };
  }
}
