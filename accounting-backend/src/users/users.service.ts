// prettier-ignore
import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { CustomLoggerService } from "../logging/logger.service";
import { SupabaseService } from "../shared/services/supabase.service";
// prettier-ignore
import { CreateUserDto, UpdateUserDto, UpdateUserPreferencesDto, UserResponseDto, UserListResponseDto, UserQueryDto, UserStatus, UserRole } from "./dto/user.dto";

export interface UserEntity {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  company_id: string;
  status: UserStatus;
  preferences?: Record<string, unknown>;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      this.logger.logBusinessEvent("create_user_attempt", {
        email: createUserDto.email,
        role: createUserDto.role,
        companyId: createUserDto.companyId,
      });

      // Check if user with email already exists
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException("User with this email already exists");
      }

      // Verify company exists (we'll create a simple companies table later)
      // For now, we'll skip this validation

      const userData = {
        email: createUserDto.email,
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
        phone: createUserDto.phone,
        role: createUserDto.role,
        company_id: createUserDto.companyId,
        status: createUserDto.status || UserStatus.PENDING,
        preferences: createUserDto.preferences || {},
      };

      const supabaseResponse = await this.supabaseService
        .getAdminClient()
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (supabaseResponse.error) {
        this.logger.logError("Failed to create user", {
          error: supabaseResponse.error.message,
        });
        throw new BadRequestException("Failed to create user");
      }

      const userResponse = this.mapToUserResponse(
        supabaseResponse.data as UserEntity,
      );

      this.logger.logBusinessEvent("user_created", {
        userId: userResponse.id,
        email: userResponse.email,
        role: userResponse.role,
        companyId: userResponse.companyId,
      });

      return userResponse;
    } catch (error) {
      this.logger.logError("Error creating user", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async findAll(query: UserQueryDto): Promise<UserListResponseDto> {
    try {
      const page = parseInt(query.page || "1", 10);
      const limit = parseInt(query.limit || "10", 10);
      const offset = (page - 1) * limit;

      let queryBuilder = this.supabaseService
        .getClient()
        .from("users")
        .select("*", { count: "exact" });

      // Apply filters
      if (query.search) {
        queryBuilder = queryBuilder.or(
          `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
        );
      }

      if (query.role) {
        queryBuilder = queryBuilder.eq("role", query.role);
      }

      if (query.status) {
        queryBuilder = queryBuilder.eq("status", query.status);
      }

      if (query.companyId) {
        queryBuilder = queryBuilder.eq("company_id", query.companyId);
      }

      // Apply sorting
      const sortBy = query.sortBy || "created_at";
      const sortOrder = query.sortOrder || "desc";
      queryBuilder = queryBuilder.order(sortBy, {
        ascending: sortOrder === "asc",
      });

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        this.logger.logError("Failed to fetch users", {
          error: error.message,
          query: JSON.stringify(query),
        });
        throw new BadRequestException("Failed to fetch users");
      }

      const users = (data as UserEntity[]).map((user) =>
        this.mapToUserResponse(user),
      );
      const totalPages = Math.ceil((count || 0) / limit);

      return {
        users,
        total: count || 0,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.logError("Error fetching users", {
        error: error instanceof Error ? error.message : "Unknown error",
        query: JSON.stringify(query),
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const response = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (response.error || !response.data) {
        throw new NotFoundException("User not found");
      }

      return this.mapToUserResponse(response.data as UserEntity);
    } catch (error) {
      this.logger.logError("Error fetching user", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    try {
      const response = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (response.error || !response.data) {
        return null;
      }

      return this.mapToUserResponse(response.data as UserEntity);
    } catch (error) {
      this.logger.logError("Error fetching user by email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
      });
      return null;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // Verify user exists
      await this.findOne(id);

      const updateData = {
        first_name: updateUserDto.firstName,
        last_name: updateUserDto.lastName,
        phone: updateUserDto.phone,
        role: updateUserDto.role,
        status: updateUserDto.status,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const response = await this.supabaseService
        .getClient()
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update user", {
          error: response.error.message,
          userId: id,
          updateData: JSON.stringify(updateData),
        });
        throw new BadRequestException("Failed to update user");
      }

      const userResponse = this.mapToUserResponse(response.data as UserEntity);

      this.logger.logBusinessEvent("user_updated", {
        userId: id,
        changes: JSON.stringify(updateData),
      });

      return userResponse;
    } catch (error) {
      this.logger.logError("Error updating user", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
        updateUserDto: JSON.stringify(updateUserDto),
      });
      throw error;
    }
  }

  async updatePreferences(
    id: string,
    updatePreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserResponseDto> {
    try {
      // Verify user exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("users")
        .update({
          preferences: updatePreferencesDto.preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update user preferences", {
          error: response.error.message,
          userId: id,
          preferences: JSON.stringify(updatePreferencesDto.preferences),
        });
        throw new BadRequestException("Failed to update user preferences");
      }

      const userResponse = this.mapToUserResponse(response.data as UserEntity);

      this.logger.logBusinessEvent("user_preferences_updated", {
        userId: id,
        preferences: JSON.stringify(updatePreferencesDto.preferences),
      });

      return userResponse;
    } catch (error) {
      this.logger.logError("Error updating user preferences", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
        updatePreferencesDto: JSON.stringify(updatePreferencesDto),
      });
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from("users")
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        this.logger.logError("Failed to update last login", {
          error: error.message,
          userId: id,
        });
      }

      this.logger.logAuth("last_login_updated", id);
    } catch (error) {
      this.logger.logError("Error updating last login", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      });
    }
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserResponseDto> {
    try {
      // Verify user exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("users")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update user status", {
          error: response.error.message,
          userId: id,
          status,
        });
        throw new BadRequestException("Failed to update user status");
      }

      const userResponse = this.mapToUserResponse(response.data as UserEntity);

      this.logger.logBusinessEvent("user_status_updated", {
        userId: id,
        oldStatus: status,
        newStatus: status,
      });

      return userResponse;
    } catch (error) {
      this.logger.logError("Error updating user status", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
        status,
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Verify user exists
      await this.findOne(id);

      const { error } = await this.supabaseService
        .getClient()
        .from("users")
        .delete()
        .eq("id", id);

      if (error) {
        this.logger.logError("Failed to delete user", {
          error: error.message,
          userId: id,
        });
        throw new BadRequestException("Failed to delete user");
      }

      this.logger.logBusinessEvent("user_deleted", {
        userId: id,
      });
    } catch (error) {
      this.logger.logError("Error deleting user", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
      });
      throw error;
    }
  }

  async findByCompany(companyId: string): Promise<UserResponseDto[]> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        this.logger.logError("Failed to fetch users by company", {
          error: error.message,
          companyId,
        });
        throw new BadRequestException("Failed to fetch users by company");
      }

      return (data as UserEntity[]).map((user) => this.mapToUserResponse(user));
    } catch (error) {
      this.logger.logError("Error fetching users by company", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId,
      });
      throw error;
    }
  }

  async updateRole(id: string, role: UserRole): Promise<UserResponseDto> {
    try {
      // Verify user exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("users")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update user role", {
          error: response.error.message,
          userId: id,
          role,
        });
        throw new BadRequestException("Failed to update user role");
      }

      const userResponse = this.mapToUserResponse(response.data as UserEntity);

      this.logger.logBusinessEvent("user_role_updated", {
        userId: id,
        newRole: role,
      });

      return userResponse;
    } catch (error) {
      this.logger.logError("Error updating user role", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: id,
        role,
      });
      throw error;
    }
  }

  private mapToUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      companyId: user.company_id,
      status: user.status,
      preferences: user.preferences,
      avatarUrl: user.avatar_url,
      lastLoginAt: user.last_login_at
        ? new Date(user.last_login_at)
        : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    };
  }
}
