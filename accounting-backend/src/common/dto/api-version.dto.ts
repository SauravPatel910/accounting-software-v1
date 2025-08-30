import { ApiProperty } from "@nestjs/swagger";

export enum ApiVersion {
  V1 = "1",
  V2 = "2",
}

export class ApiVersionDto {
  @ApiProperty({
    description: "API version",
    enum: ApiVersion,
    example: ApiVersion.V1,
  })
  version: ApiVersion;

  @ApiProperty({
    description: "API version release date",
    example: "2023-12-01",
  })
  releaseDate: string;

  @ApiProperty({
    description: "API version status",
    enum: ["stable", "beta", "deprecated"],
    example: "stable",
  })
  status: "stable" | "beta" | "deprecated";

  @ApiProperty({
    description: "API version documentation URL",
    example: "https://api.example.com/docs/v1",
  })
  documentationUrl: string;

  @ApiProperty({
    description: "Breaking changes in this version",
    type: [String],
    required: false,
  })
  breakingChanges?: string[];

  @ApiProperty({
    description: "New features in this version",
    type: [String],
    required: false,
  })
  newFeatures?: string[];
}

export const API_VERSIONS: Record<ApiVersion, ApiVersionDto> = {
  [ApiVersion.V1]: {
    version: ApiVersion.V1,
    releaseDate: "2023-12-01",
    status: "stable",
    documentationUrl: "/api/docs",
    newFeatures: [
      "Complete authentication system",
      "User and company management",
      "Chart of accounts",
      "Transaction management with double-entry bookkeeping",
      "Invoice management",
      "Audit logging and compliance",
      "Financial reporting",
    ],
  },
  [ApiVersion.V2]: {
    version: ApiVersion.V2,
    releaseDate: "2024-06-01",
    status: "beta",
    documentationUrl: "/api/docs/v2",
    newFeatures: [
      "Enhanced reporting with custom filters",
      "Multi-currency support",
      "Advanced audit trail",
      "Real-time notifications",
      "API rate limiting per endpoint",
    ],
    breakingChanges: [
      "Authentication response format changed",
      "Decimal precision increased to 4 places",
      "Error response structure standardized",
    ],
  },
};

export const CURRENT_API_VERSION = ApiVersion.V1;
export const SUPPORTED_API_VERSIONS = [ApiVersion.V1];
export const DEPRECATED_API_VERSIONS: ApiVersion[] = [];

// API Version Header Constants
export const API_VERSION_HEADER = "X-API-Version";
export const DEFAULT_API_VERSION = ApiVersion.V1;
