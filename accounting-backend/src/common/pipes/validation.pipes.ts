import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { ValidationErrorDto } from "../dto/api-response.dto";

@Injectable()
export class EnhancedValidationPipe implements PipeTransform<unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value) as object;
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
        field: error.property,
        value: error.value as unknown,
        messages: error.constraints ? Object.values(error.constraints) : [],
      }));

      throw new BadRequestException({
        success: false,
        message: "Validation failed",
        error: "Bad Request",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        validationErrors,
      });
    }
    return object;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: Array<new (...args: unknown[]) => unknown> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  transform(value: string): string {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new BadRequestException({
        success: false,
        message: "Invalid UUID format",
        error: "Bad Request",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        validationErrors: [
          {
            field: "id",
            value,
            messages: ["Must be a valid UUID"],
          },
        ],
      });
    }

    return value;
  }
}

@Injectable()
export class ParseOptionalUUIDPipe
  implements PipeTransform<string | undefined>
{
  transform(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new BadRequestException({
        success: false,
        message: "Invalid UUID format",
        error: "Bad Request",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        validationErrors: [
          {
            field: "id",
            value,
            messages: ["Must be a valid UUID"],
          },
        ],
      });
    }

    return value;
  }
}

@Injectable()
export class ParseDatePipe implements PipeTransform<string> {
  transform(value: string): Date {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException({
        success: false,
        message: "Invalid date format",
        error: "Bad Request",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        validationErrors: [
          {
            field: "date",
            value,
            messages: ["Must be a valid ISO date string"],
          },
        ],
      });
    }

    return date;
  }
}

@Injectable()
export class ParseOptionalDatePipe
  implements PipeTransform<string | undefined>
{
  transform(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException({
        success: false,
        message: "Invalid date format",
        error: "Bad Request",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        validationErrors: [
          {
            field: "date",
            value,
            messages: ["Must be a valid ISO date string"],
          },
        ],
      });
    }

    return date;
  }
}
