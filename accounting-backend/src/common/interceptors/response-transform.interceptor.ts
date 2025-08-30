import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { ApiResponse } from "../dto/api-response.dto";

export const SKIP_RESPONSE_TRANSFORM = "skipResponseTransform";

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, unknown>
{
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_TRANSFORM,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        // If data is already wrapped (has success property), return as is
        if (data && typeof data === "object" && "success" in data) {
          return data as unknown;
        }

        // Transform successful responses
        return ApiResponse.success(data, "Operation completed successfully", {
          requestId: (request.headers["x-request-id"] as string) || undefined,
          path: request.url,
          method: request.method,
          statusCode: response.statusCode,
        });
      }),
    );
  }
}

// Decorator to skip response transformation
export const SkipResponseTransform = () =>
  Reflect.defineMetadata(SKIP_RESPONSE_TRANSFORM, true, {});
