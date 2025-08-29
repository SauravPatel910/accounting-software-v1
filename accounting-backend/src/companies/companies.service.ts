import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { CustomLoggerService } from "../logging/logger.service";
import { SupabaseService } from "../shared/services/supabase.service";
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateCompanySettingsDto,
  UpdateCompanyPreferencesDto,
  UpdateSubscriptionDto,
  CompanyResponseDto,
  CompanyListResponseDto,
  CompanyQueryDto,
  CompanyStatus,
  SubscriptionTier,
  BillingCycle,
  CompanyAddressDto,
  CompanySettingsDto,
  CompanyPreferencesDto,
  SubscriptionDto,
} from "./dto/company.dto";

export interface CompanyEntity {
  id: string;
  name: string;
  legal_name?: string;
  email: string;
  phone?: string;
  website?: string;
  tax_id?: string;
  registration_number?: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  address?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    try {
      this.logger.logBusinessEvent("create_company_attempt", {
        name: createCompanyDto.name,
        email: createCompanyDto.email,
        status: createCompanyDto.status || CompanyStatus.TRIAL,
      });

      // Check if company with email already exists
      const existingCompany = await this.findByEmail(createCompanyDto.email);
      if (existingCompany) {
        throw new ConflictException("Company with this email already exists");
      }

      // Prepare company data
      const companyData = {
        name: createCompanyDto.name,
        legal_name: createCompanyDto.legalName,
        email: createCompanyDto.email,
        phone: createCompanyDto.phone,
        website: createCompanyDto.website,
        tax_id: createCompanyDto.taxId,
        registration_number: createCompanyDto.registrationNumber,
        industry: createCompanyDto.industry,
        description: createCompanyDto.description,
        logo_url: createCompanyDto.logoUrl,
        address: createCompanyDto.address || null,
        settings: createCompanyDto.settings || this.getDefaultSettings(),
        preferences:
          createCompanyDto.preferences || this.getDefaultPreferences(),
        subscription:
          createCompanyDto.subscription || this.getDefaultSubscription(),
        status: createCompanyDto.status || CompanyStatus.TRIAL,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .insert(companyData)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to create company", {
          error: response.error.message,
          companyData: JSON.stringify(companyData),
        });
        throw new BadRequestException("Failed to create company");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_created", {
        companyId: companyResponse.id,
        name: companyResponse.name,
        email: companyResponse.email,
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error creating company", {
        error: error instanceof Error ? error.message : "Unknown error",
        createCompanyDto: JSON.stringify(createCompanyDto),
      });
      throw error;
    }
  }

  async findAll(query: CompanyQueryDto): Promise<CompanyListResponseDto> {
    try {
      const {
        search,
        status,
        subscriptionTier,
        industry,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      let queryBuilder = this.supabaseService
        .getClient()
        .from("companies")
        .select("*", { count: "exact" });

      // Apply filters
      if (search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${search}%,legal_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      if (status) {
        queryBuilder = queryBuilder.eq("status", status);
      }

      if (subscriptionTier) {
        queryBuilder = queryBuilder.contains("subscription", {
          tier: subscriptionTier,
        });
      }

      if (industry) {
        queryBuilder = queryBuilder.eq("industry", industry);
      }

      // Apply sorting
      const isAscending = sortOrder === "asc";
      queryBuilder = queryBuilder.order(sortBy, { ascending: isAscending });

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const response = await queryBuilder;

      if (response.error) {
        this.logger.logError("Failed to fetch companies", {
          error: response.error.message,
          query: JSON.stringify(query),
        });
        throw new BadRequestException("Failed to fetch companies");
      }

      const companies = (response.data as CompanyEntity[]).map((company) =>
        this.mapToCompanyResponse(company),
      );
      const totalPages = Math.ceil((response.count || 0) / limit);

      return {
        companies,
        total: response.count || 0,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.logError("Error fetching companies", {
        error: error instanceof Error ? error.message : "Unknown error",
        query: JSON.stringify(query),
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<CompanyResponseDto> {
    try {
      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (response.error || !response.data) {
        throw new NotFoundException("Company not found");
      }

      return this.mapToCompanyResponse(response.data as CompanyEntity);
    } catch (error) {
      this.logger.logError("Error fetching company", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<CompanyResponseDto | null> {
    try {
      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .select("*")
        .eq("email", email)
        .single();

      if (response.error || !response.data) {
        return null;
      }

      return this.mapToCompanyResponse(response.data as CompanyEntity);
    } catch (error) {
      this.logger.logError("Error fetching company by email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
      });
      return null;
    }
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    try {
      // Verify company exists
      await this.findOne(id);

      const updateData = {
        name: updateCompanyDto.name,
        legal_name: updateCompanyDto.legalName,
        email: updateCompanyDto.email,
        phone: updateCompanyDto.phone,
        website: updateCompanyDto.website,
        tax_id: updateCompanyDto.taxId,
        registration_number: updateCompanyDto.registrationNumber,
        industry: updateCompanyDto.industry,
        description: updateCompanyDto.description,
        logo_url: updateCompanyDto.logoUrl,
        address: updateCompanyDto.address,
        status: updateCompanyDto.status,
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
        .from("companies")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update company", {
          error: response.error.message,
          companyId: id,
          updateData: JSON.stringify(updateData),
        });
        throw new BadRequestException("Failed to update company");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_updated", {
        companyId: id,
        changes: JSON.stringify(updateData),
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error updating company", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
        updateCompanyDto: JSON.stringify(updateCompanyDto),
      });
      throw error;
    }
  }

  async updateSettings(
    id: string,
    updateSettingsDto: UpdateCompanySettingsDto,
  ): Promise<CompanyResponseDto> {
    try {
      // Verify company exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .update({
          settings: updateSettingsDto.settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update company settings", {
          error: response.error.message,
          companyId: id,
          settings: JSON.stringify(updateSettingsDto.settings),
        });
        throw new BadRequestException("Failed to update company settings");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_settings_updated", {
        companyId: id,
        settings: JSON.stringify(updateSettingsDto.settings),
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error updating company settings", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
        updateSettingsDto: JSON.stringify(updateSettingsDto),
      });
      throw error;
    }
  }

  async updatePreferences(
    id: string,
    updatePreferencesDto: UpdateCompanyPreferencesDto,
  ): Promise<CompanyResponseDto> {
    try {
      // Verify company exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .update({
          preferences: updatePreferencesDto.preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update company preferences", {
          error: response.error.message,
          companyId: id,
          preferences: JSON.stringify(updatePreferencesDto.preferences),
        });
        throw new BadRequestException("Failed to update company preferences");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_preferences_updated", {
        companyId: id,
        preferences: JSON.stringify(updatePreferencesDto.preferences),
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error updating company preferences", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
        updatePreferencesDto: JSON.stringify(updatePreferencesDto),
      });
      throw error;
    }
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<CompanyResponseDto> {
    try {
      // Verify company exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .update({
          subscription: updateSubscriptionDto.subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update company subscription", {
          error: response.error.message,
          companyId: id,
          subscription: JSON.stringify(updateSubscriptionDto.subscription),
        });
        throw new BadRequestException("Failed to update company subscription");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_subscription_updated", {
        companyId: id,
        subscription: JSON.stringify(updateSubscriptionDto.subscription),
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error updating company subscription", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
        updateSubscriptionDto: JSON.stringify(updateSubscriptionDto),
      });
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: CompanyStatus,
  ): Promise<CompanyResponseDto> {
    try {
      // Verify company exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (response.error) {
        this.logger.logError("Failed to update company status", {
          error: response.error.message,
          companyId: id,
          status,
        });
        throw new BadRequestException("Failed to update company status");
      }

      const companyResponse = this.mapToCompanyResponse(
        response.data as CompanyEntity,
      );

      this.logger.logBusinessEvent("company_status_updated", {
        companyId: id,
        newStatus: status,
      });

      return companyResponse;
    } catch (error) {
      this.logger.logError("Error updating company status", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
        status,
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Verify company exists
      await this.findOne(id);

      const response = await this.supabaseService
        .getClient()
        .from("companies")
        .delete()
        .eq("id", id);

      if (response.error) {
        this.logger.logError("Failed to delete company", {
          error: response.error.message,
          companyId: id,
        });
        throw new BadRequestException("Failed to delete company");
      }

      this.logger.logBusinessEvent("company_deleted", {
        companyId: id,
      });
    } catch (error) {
      this.logger.logError("Error deleting company", {
        error: error instanceof Error ? error.message : "Unknown error",
        companyId: id,
      });
      throw error;
    }
  }

  private getDefaultSettings(): CompanySettingsDto {
    return {
      defaultCurrency: "USD",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
      numberFormat: "1,234.56",
      fiscalYearStart: 1,
      multiCurrencyEnabled: false,
      autoBackupEnabled: true,
      emailNotificationsEnabled: true,
      invoiceAutoNumbering: true,
      invoiceNumberPrefix: "INV",
      nextInvoiceNumber: 1,
    };
  }

  private getDefaultPreferences(): CompanyPreferencesDto {
    return {
      theme: { mode: "light", primaryColor: "#007bff" },
      dashboard: { defaultView: "overview", showCharts: true },
      reports: { defaultPeriod: "monthly", autoGenerate: false },
      notifications: { email: true, browser: true, mobile: false },
      ui: { compactMode: false, showSidebar: true },
    };
  }

  private getDefaultSubscription(): SubscriptionDto {
    return {
      tier: SubscriptionTier.FREE,
      billingCycle: BillingCycle.MONTHLY,
      startDate: new Date().toISOString(),
      maxUsers: 3,
      maxStorage: 1,
      apiRateLimit: 1000,
      advancedFeaturesEnabled: false,
      customBrandingEnabled: false,
      prioritySupportEnabled: false,
    };
  }

  private mapToCompanyResponse(company: CompanyEntity): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      legalName: company.legal_name,
      email: company.email,
      phone: company.phone,
      website: company.website,
      taxId: company.tax_id,
      registrationNumber: company.registration_number,
      industry: company.industry,
      description: company.description,
      logoUrl: company.logo_url,
      address: company.address as unknown as CompanyAddressDto,
      settings: company.settings as unknown as CompanySettingsDto,
      preferences: company.preferences as unknown as CompanyPreferencesDto,
      subscription: company.subscription as unknown as SubscriptionDto,
      status: company.status,
      createdAt: new Date(company.created_at),
      updatedAt: new Date(company.updated_at),
    };
  }
}
