// Common DTO exports for API documentation and validation
export * from "./api-response.dto";
export * from "./api-version.dto";
export * from "./query.dto";

// Re-export commonly used class-validator decorators
export {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  Length,
  Matches,
  IsPositive,
  IsInt,
  ValidateNested,
} from "class-validator";

// Re-export commonly used class-transformer decorators
export { Type, Transform, Exclude, Expose } from "class-transformer";

// Re-export commonly used Swagger decorators
export {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
