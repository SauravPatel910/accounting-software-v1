// prettier-ignore
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UsersService } from "./users.service";
// prettier-ignore
import { CreateUserDto, UpdateUserDto, UpdateUserPreferencesDto, UserResponseDto, UserListResponseDto, UserQueryDto, UserRole, UserStatus} from "./dto/user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query(ValidationPipe) query: UserQueryDto,
  ): Promise<UserListResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get("me")
  async getProfile(
    @CurrentUser() user: { userId: string },
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(user.userId);
  }

  @Get("company/:companyId")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findByCompany(
    @Param("companyId", ParseUUIDPipe) companyId: string,
    @CurrentUser() user: { companyId: string; role: UserRole },
  ): Promise<UserResponseDto[]> {
    // Users can only see users from their own company unless they're admin
    if (user.role !== UserRole.ADMIN && user.companyId !== companyId) {
      throw new Error("Access denied: Cannot view users from other companies");
    }
    return this.usersService.findByCompany(companyId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; companyId: string; role: UserRole },
  ): Promise<UserResponseDto> {
    const targetUser = await this.usersService.findOne(id);

    // Users can only view users from their own company unless they're admin
    if (
      user.role !== UserRole.ADMIN &&
      user.companyId !== targetUser.companyId
    ) {
      throw new Error("Access denied: Cannot view users from other companies");
    }

    return targetUser;
  }

  @Patch("me")
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Users can only update certain fields of their own profile
    const allowedFields: UpdateUserDto = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      phone: updateUserDto.phone,
    };
    return this.usersService.update(user.userId, allowedFields);
  }

  @Patch("me/preferences")
  async updatePreferences(
    @CurrentUser() user: { userId: string },
    @Body(ValidationPipe) updatePreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePreferences(
      user.userId,
      updatePreferencesDto,
    );
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() user: { companyId: string; role: UserRole },
  ): Promise<UserResponseDto> {
    const targetUser = await this.usersService.findOne(id);

    // Admins can only update users from their own company
    if (user.companyId !== targetUser.companyId) {
      throw new Error(
        "Access denied: Cannot update users from other companies",
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/role")
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("role") role: UserRole,
    @CurrentUser() user: { companyId: string; role: UserRole },
  ): Promise<UserResponseDto> {
    const targetUser = await this.usersService.findOne(id);

    // Admins can only update users from their own company
    if (user.companyId !== targetUser.companyId) {
      throw new Error(
        "Access denied: Cannot update users from other companies",
      );
    }

    return this.usersService.updateRole(id, role);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("status") status: UserStatus,
    @CurrentUser() user: { companyId: string; role: UserRole },
  ): Promise<UserResponseDto> {
    const targetUser = await this.usersService.findOne(id);

    // Admins can only update users from their own company
    if (user.companyId !== targetUser.companyId) {
      throw new Error(
        "Access denied: Cannot update users from other companies",
      );
    }

    return this.usersService.updateStatus(id, status);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: { companyId: string; role: UserRole },
  ): Promise<void> {
    const targetUser = await this.usersService.findOne(id);

    // Admins can only delete users from their own company
    if (user.companyId !== targetUser.companyId) {
      throw new Error(
        "Access denied: Cannot delete users from other companies",
      );
    }

    return this.usersService.remove(id);
  }
}
