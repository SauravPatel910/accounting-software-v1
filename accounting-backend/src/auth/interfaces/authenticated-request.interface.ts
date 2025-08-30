import { Request } from "express";
import { UserRole } from "../types/auth.types";

export interface AuthenticatedUser {
  sub: string; // user id (from JWT payload)
  id: string;
  email: string;
  companyId: string;
  organizationId?: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
