import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CompaniesService } from "./companies.service";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

@ApiTags("Companies")
@Controller("companies")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new company" })
  @ApiResponse({ status: 201, description: "Company created successfully" })
  create(@Req() req: AuthenticatedRequest, @Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(req.user.id, createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all companies user has access to" })
  @ApiResponse({ status: 200, description: "Companies retrieved successfully" })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.companiesService.findAll(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific company" })
  @ApiResponse({ status: 200, description: "Company retrieved successfully" })
  findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a company" })
  @ApiResponse({ status: 200, description: "Company updated successfully" })
  update(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCompanyDto: UpdateCompanyDto
  ) {
    return this.companiesService.update(id, req.user.id, updateCompanyDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a company (soft delete)" })
  @ApiResponse({ status: 200, description: "Company deleted successfully" })
  remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.companiesService.remove(id, req.user.id);
  }

  @Post(":id/users")
  @ApiOperation({ summary: "Add user to company" })
  @ApiResponse({ status: 201, description: "User added to company successfully" })
  addUser(
    @Param("id") companyId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { userId: string; role: string }
  ) {
    return this.companiesService.addUserToCompany(companyId, body.userId, body.role, req.user.id);
  }
}
