import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ValidationError } from "class-validator";
import { ErrorResponseDto, ValidationErrorDto } from "../dto/api-response.dto";

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "Internal Server Error";
    let validationErrors: ValidationErrorDto[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        error = (responseObj.error as string) || exception.name;
        validationErrors = responseObj.validationErrors as ValidationErrorDto[];
      } else if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      validationErrors,
      meta: {
        requestId: (request.headers["x-request-id"] as string) || undefined,
        method: request.method,
        userAgent: request.headers["user-agent"],
      },
    };

    // Log error for monitoring
    console.error(
      `[${new Date().toISOString()}] ${request.method} ${request.url}`,
      {
        status,
        error: exception instanceof Error ? exception.message : exception,
        stack: exception instanceof Error ? exception.stack : undefined,
        requestId: request.headers["x-request-id"],
      },
    );

    response.status(status).json(errorResponse);
  }
}

@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let error = exception.name;
    let validationErrors: ValidationErrorDto[] | undefined;

    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string) || exception.message;
      error = (responseObj.error as string) || exception.name;
      validationErrors = responseObj.validationErrors as ValidationErrorDto[];
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      validationErrors,
      meta: {
        requestId: (request.headers["x-request-id"] as string) || undefined,
        method: request.method,
        userAgent: request.headers["user-agent"],
      },
    };

    response.status(status).json(errorResponse);
  }
}

@Injectable()
@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationError[], host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const validationErrors: ValidationErrorDto[] = exception.map((error) => ({
      field: error.property,
      value: error.value as unknown,
      messages: error.constraints ? Object.values(error.constraints) : [],
    }));

    const errorResponse: ErrorResponseDto = {
      success: false,
      message: "Validation failed",
      error: "Bad Request",
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      validationErrors,
      meta: {
        requestId: (request.headers["x-request-id"] as string) || undefined,
        method: request.method,
        userAgent: request.headers["user-agent"],
      },
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
