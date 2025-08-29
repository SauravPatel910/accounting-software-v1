import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { UserData } from "../types/auth.types";

interface AuthenticatedRequest extends Request {
  user: UserData;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserData => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
