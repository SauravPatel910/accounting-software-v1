import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfigService } from "../../app-config.service";

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient<any, "public", any>;
  private supabaseAdminClient: SupabaseClient<any, "public", any>;

  constructor(private configService: AppConfigService) {}

  async onModuleInit() {
    await this.initializeSupabase();
  }

  private async initializeSupabase() {
    try {
      const supabaseConfig = this.configService.supabase;

      // Initialize client with anon key (for client-side operations)
      this.supabaseClient = createClient(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        {
          auth: supabaseConfig.authOptions,
          db: {
            schema: supabaseConfig.schema,
          },
        },
      ) as SupabaseClient<any, "public", any>;

      // Initialize admin client with service role key (for server-side operations)
      this.supabaseAdminClient = createClient(
        supabaseConfig.url,
        supabaseConfig.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          db: {
            schema: supabaseConfig.schema,
          },
        },
      ) as SupabaseClient<any, "public", any>;

      // Test the connection
      await this.testConnection();

      this.logger.log("Supabase client initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Supabase client", error);
      throw error;
    }
  }

  /**
   * Get the Supabase client (with anon key)
   * Use this for operations that don't require elevated privileges
   */
  getClient(): SupabaseClient<any, "public", any> {
    if (!this.supabaseClient) {
      throw new Error("Supabase client not initialized");
    }
    return this.supabaseClient;
  }

  /**
   * Get the Supabase admin client (with service role key)
   * Use this for operations that require elevated privileges
   */
  getAdminClient(): SupabaseClient<any, "public", any> {
    if (!this.supabaseAdminClient) {
      throw new Error("Supabase admin client not initialized");
    }
    return this.supabaseAdminClient;
  }

  /**
   * Test the Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabaseAdminClient
        .from("_supabase_health_check")
        .select("*")
        .limit(1);

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "table not found" which is expected for health check
        throw error;
      }

      this.logger.log("Supabase connection test successful");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.warn("Supabase connection test failed", errorMessage);
      return false;
    }
  }

  /**
   * Get health status of Supabase connection
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: Date;
    details?: any;
  }> {
    try {
      const isConnected = await this.testConnection();
      return {
        status: isConnected ? "healthy" : "unhealthy",
        timestamp: new Date(),
        details: {
          url: this.configService.supabase.url,
          schema: this.configService.supabase.schema,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        status: "unhealthy",
        timestamp: new Date(),
        details: {
          error: errorMessage,
        },
      };
    }
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo(): Promise<any> {
    try {
      const { data, error } = await this.supabaseAdminClient
        .from("information_schema.tables")
        .select("table_name, table_type")
        .eq("table_schema", "public");

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error("Failed to get schema info", error);
      throw error;
    }
  }

  /**
   * Create a new user (admin operation)
   */
  async createUser(
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    try {
      const { data, error } =
        await this.supabaseAdminClient.auth.admin.createUser({
          email,
          password,
          user_metadata: metadata || {},
          email_confirm: true, // Auto-confirm email in development
        });

      if (error) {
        throw error;
      }

      this.logger.log(`User created successfully: ${email}`);
      return data;
    } catch (error) {
      this.logger.error("Failed to create user", error);
      throw error;
    }
  }

  /**
   * Delete a user (admin operation)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } =
        await this.supabaseAdminClient.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }

      this.logger.log(`User deleted successfully: ${userId}`);
    } catch (error) {
      this.logger.error("Failed to delete user", error);
      throw error;
    }
  }

  /**
   * Get user by ID (admin operation)
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const { data, error } =
        await this.supabaseAdminClient.auth.admin.getUserById(userId);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error("Failed to get user by ID", error);
      throw error;
    }
  }

  /**
   * List all users (admin operation)
   */
  async listUsers(page = 1, perPage = 1000): Promise<any> {
    try {
      const { data, error } =
        await this.supabaseAdminClient.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error("Failed to list users", error);
      throw error;
    }
  }
}
