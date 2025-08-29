import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/types/auth.types";
import type { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";
import { AccountsService } from "./accounts.service";
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
  AccountQueryDto,
  AccountListResponseDto,
  AccountHierarchyDto,
  GenerateAccountCodeDto,
  AccountCodeResponseDto,
  BulkAccountOperationDto,
} from "./dto/account.dto";

@Controller("accounts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  async create(
    @Body() createAccountDto: CreateAccountDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponseDto> {
    return this.accountsService.create(createAccountDto, req.user.companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  async findAll(
    @Query() query: AccountQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountListResponseDto> {
    return this.accountsService.findAll(query, req.user.companyId);
  }

  @Get("hierarchy")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  async getHierarchy(
    @Request() req: AuthenticatedRequest,
    @Query("includeBalance") includeBalance: boolean = false,
    @Query("balanceAsOfDate") balanceAsOfDate?: string,
  ): Promise<AccountHierarchyDto[]> {
    return this.accountsService.getAccountHierarchy(
      req.user.companyId,
      includeBalance,
      balanceAsOfDate,
    );
  }

  @Post("generate-code")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  async generateCode(
    @Body() generateDto: GenerateAccountCodeDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountCodeResponseDto> {
    return this.accountsService.generateAccountCode(
      generateDto,
      req.user.companyId,
    );
  }

  @Post("bulk-operation")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkOperation(
    @Body() operation: BulkAccountOperationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.accountsService.bulkOperation(operation, req.user.companyId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  async findOne(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
    @Query("includeBalance") includeBalance: boolean = false,
    @Query("balanceAsOfDate") balanceAsOfDate?: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.findOne(
      id,
      req.user.companyId,
      includeBalance,
      balanceAsOfDate,
    );
  }

  @Get(":id/balance")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.READ_ONLY)
  async getBalance(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.accountsService.calculateAccountBalance(id, asOfDate);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  async update(
    @Param("id") id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AccountResponseDto> {
    return this.accountsService.update(
      id,
      updateAccountDto,
      req.user.companyId,
    );
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.accountsService.remove(id, req.user.companyId);
  }
}
