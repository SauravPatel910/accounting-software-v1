// prettier-ignore
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UsersService } from "./users.service";
// prettier-ignore
import { CreateUserDto, UpdateUserDto, UpdateUserPreferencesDto, UserResponseDto, UserListResponseDto, UserQueryDto, UserRole, UserStatus} from "./dto/user.dto";
import {
  ApiResponseDto,
  ErrorResponseDto,
} from "../common/dto/api-response.dto";

@Controller("users")
@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(UserResponseDto, UserListResponseDto, ErrorResponseDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new user",
    description:
      "Creates a new user account. Only administrators can create users.",
  })
  @ApiBody({
    type: CreateUserDto,
    description: "User creation data",
    examples: {
      example1: {
        summary: "Basic user creation",
        value: {
          email: "john.doe@company.com",
          firstName: "John",
          lastName: "Doe",
          role: UserRole.USER,
          companyId: "123e4567-e89b-12d3-a456-426614174000",
          phone: "+1-555-0123",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "Conflict - Email already exists",
    type: ErrorResponseDto,
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: "Get all users",
    description:
      "Retrieves a paginated list of users with optional filters. Accessible by administrators and managers.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (1-based)",
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of items per page",
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search by name or email",
    example: "john",
    type: String,
  })
  @ApiQuery({
    name: "role",
    required: false,
    description: "Filter by user role",
    enum: UserRole,
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by user status",
    enum: UserStatus,
  })
  @ApiResponse({
    status: 200,
    description: "Users retrieved successfully",
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserListResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
    type: ErrorResponseDto,
  })
  async findAll(
    @Query(ValidationPipe) query: UserQueryDto,
  ): Promise<UserListResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get("me")
  @ApiOperation({
    summary: "Get current user profile",
    description:
      "Retrieves the profile information of the currently authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
    type: ErrorResponseDto,
  })
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
