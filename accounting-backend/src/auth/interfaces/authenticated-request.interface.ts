import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  companyId: string;
  role: string;
  exp?: number;
  iat?: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
