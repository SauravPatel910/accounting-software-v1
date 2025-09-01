import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, IsArray } from "class-validator";

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: "Indicates if the request was successful",
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: "Human-readable message describing the result",
    example: "Operation completed successfully",
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: "The actual data payload",
    required: false,
  })
  @IsOptional()
  data?: T;

  @ApiProperty({
    description: "Error message if the request failed",
    example: "Validation failed: Field is required",
    required: false,
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({
    description: "Detailed error information",
    required: false,
  })
  @IsOptional()
  errors?: any[];

  @ApiProperty({
    description: "Additional metadata about the response",
    required: false,
  })
  @IsOptional()
  meta?: {
    timestamp?: string;
    requestId?: string;
    version?: string;
    [key: string]: any;
  };
}

export class PaginationDto {
  @ApiProperty({
    description: "Current page number",
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: "Total number of items",
    example: 150,
    minimum: 0,
  })
  total: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 8,
    minimum: 0,
  })
  totalPages: number;

  @ApiProperty({
    description: "Indicates if there is a next page",
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: "Indicates if there is a previous page",
    example: false,
  })
  hasPrev: boolean;
}

export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

export class ValidationErrorDto {
  @ApiProperty({
    description: "Field that failed validation",
    example: "email",
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: "Value that was provided",
    example: "invalid-email",
  })
  value: any;

  @ApiProperty({
    description: "Validation error messages",
    example: ["email must be a valid email address"],
  })
  @IsArray()
  @IsString({ each: true })
  messages: string[];
}

export class ErrorResponseDto extends ApiResponseDto {
  @ApiProperty({
    description: "HTTP status code",
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: "Error timestamp",
    example: "2023-12-01T10:30:00.000Z",
  })
  timestamp: string;

  @ApiProperty({
    description: "Request path that caused the error",
    example: "/api/v1/users",
  })
  path: string;

  @ApiProperty({
    description: "Detailed validation errors",
    type: [ValidationErrorDto],
    required: false,
  })
  @IsOptional()
  validationErrors?: ValidationErrorDto[];
}

// Success Response Factory
export class ApiResponse {
  static success<T>(
    data?: T,
    message = "Operation completed successfully",
    meta?: Record<string, unknown>,
  ): ApiResponseDto<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
  }

  static error(
    error: string,
    message = "Operation failed",
    errors?: unknown[],
    meta?: Record<string, unknown>,
  ): ApiResponseDto {
    return {
      success: false,
      message,
      error,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = "Data retrieved successfully",
    meta?: Record<string, unknown>,
  ): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
  }
}
