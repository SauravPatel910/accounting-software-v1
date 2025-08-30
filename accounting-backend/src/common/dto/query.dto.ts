import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class PaginationQueryDto {
  @ApiProperty({
    description: "Page number (1-based)",
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: "Number of items per page",
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: "Field to sort by",
    example: "createdAt",
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: "Sort order",
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description: "Search query string",
    example: "john doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  search?: string;
}

export class DateRangeQueryDto {
  @ApiProperty({
    description: "Start date (ISO string)",
    example: "2023-01-01T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: "End date (ISO string)",
    example: "2023-12-31T23:59:59.999Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BaseFilterDto extends PaginationQueryDto {
  @ApiProperty({
    description: "Company ID filter",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({
    description: "User ID filter",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: "Created after date (ISO string)",
    example: "2023-01-01T00:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiProperty({
    description: "Created before date (ISO string)",
    example: "2023-12-31T23:59:59.999Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}

export class IdParamsDto {
  @ApiProperty({
    description: "Resource ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  id: string;
}

export class CompanyIdParamsDto {
  @ApiProperty({
    description: "Company ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  companyId: string;
}

export class UserIdParamsDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  userId: string;
}
