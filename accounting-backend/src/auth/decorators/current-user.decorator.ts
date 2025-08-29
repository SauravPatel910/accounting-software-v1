import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserData } from "../types/auth.types";

interface AuthenticatedRequest {
  user: UserData;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserData => {
    const request = ctx.switchToHttp().getRequest() as AuthenticatedRequest;
    return request.user;
  },
);
