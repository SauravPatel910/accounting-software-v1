# Frontend-Backend Integration Guide

## Overview

This guide provides step-by-step instructions to integrate the NestJS backend with the React (Vite + Mantine) frontend for the Accounting Software application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Environment Configuration](#environment-configuration)
5. [API Integration](#api-integration)
6. [Authentication Setup](#authentication-setup)
7. [Service Layer Configuration](#service-layer-configuration)
8. [Type Definitions](#type-definitions)
9. [Error Handling](#error-handling)
10. [Development Workflow](#development-workflow)
11. [Testing Integration](#testing-integration)
12. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

- Node.js (v18.x or higher)
- npm or yarn package manager
- Git
- VS Code (recommended)
- Supabase account (for database)

### Environment Setup

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`
- API endpoints prefix: `/api/v1`

---

## Backend Setup

### 1. Install Backend Dependencies

```bash
cd accounting-backend
npm install
```

### 2. Environment Variables Setup

Create `.env` file in `accounting-backend` directory:

```env
# App Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Security Configuration
BCRYPT_ROUNDS=12
API_RATE_LIMIT=100
API_RATE_WINDOW=15

# Email Configuration (Optional)
EMAIL_FROM=noreply@yourapp.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your_email@gmail.com
EMAIL_SMTP_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Business Configuration
DEFAULT_CURRENCY=USD
DEFAULT_TIMEZONE=UTC
COMPANY_NAME=Your Company Name
```

### 3. Database Setup

Run the database schema files in order:

```bash
# Execute these SQL files in your Supabase SQL editor
# 1. database/schema/01_users_table.sql
# 2. database/schema/02_companies_table.sql
# 3. database/schema/03_accounts_table.sql
# 4. database/schema/04_transactions_table.sql
# 5. database/schema/05_transaction_entries_table.sql
# 6. database/schema/06_batch_transactions_and_reconciliations_table.sql
# 7. database/schema/07_transaction_views_and_functions.sql
# 8. database/schema/08_audit_logs_table.sql
```

### 4. Start Backend Server

```bash
npm run start:dev
```

The backend will be available at:

- API: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/api/docs`

---

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd accounting-frontend
npm install
```

### 2. Environment Variables Setup

Create `.env` file in `accounting-frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000

# Supabase Configuration (should match backend)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=Accounting Software
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_OFFLINE_MODE=false
```

### 3. Update Vite Configuration

Update `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    global: "globalThis",
  },
});
```

---

## API Integration

### 1. Create API Client Service

Create `src/services/api.ts`:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
```

### 2. Create Service Modules

Create `src/services/auth.service.ts`:

```typescript
import { apiClient } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", credentials);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", userData);
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("refreshToken");
    await apiClient.post("/auth/logout", { refreshToken });
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem("refreshToken");
    return apiClient.post<AuthResponse>("/auth/refresh", { refreshToken });
  }

  async getCurrentUser(): Promise<AuthResponse["user"]> {
    return apiClient.get<AuthResponse["user"]>("/auth/profile");
  }

  async forgotPassword(email: string): Promise<void> {
    return apiClient.post("/auth/forgot-password", { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return apiClient.post("/auth/reset-password", { token, password });
  }
}

export const authService = new AuthService();
```

### 3. Create React Query Hooks

Create `src/hooks/useAuth.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, type LoginRequest, type RegisterRequest } from "../services/auth.service";
import { notifications } from "@mantine/notifications";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      queryClient.setQueryData(["currentUser"], data.user);
      notifications.show({
        title: "Success",
        message: "Logged in successfully!",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Login Failed",
        message: error.response?.data?.message || "Invalid credentials",
        color: "red",
      });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.tokens.refreshToken);
      queryClient.setQueryData(["currentUser"], data.user);
      notifications.show({
        title: "Success",
        message: "Account created successfully!",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Registration Failed",
        message: error.response?.data?.message || "Registration failed",
        color: "red",
      });
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!localStorage.getItem("accessToken"),
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};
```

---

## Authentication Setup

### 1. Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "../hooks/useAuth";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: user, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: !isInitialized,
    isAuthenticated: !!user && !error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 2. Create Protected Route Component

Create `src/components/ProtectedRoute.tsx`:

```typescript
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingOverlay } from "@mantine/core";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

## Service Layer Configuration

### 1. Create Additional Services

Create `src/services/companies.service.ts`:

```typescript
import { apiClient } from "./api";

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  fiscalYearStart: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  currency?: string;
  fiscalYearStart?: string;
}

export class CompaniesService {
  async getCompanies(): Promise<Company[]> {
    return apiClient.get<Company[]>("/companies");
  }

  async getCompany(id: string): Promise<Company> {
    return apiClient.get<Company>(`/companies/${id}`);
  }

  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    return apiClient.post<Company>("/companies", data);
  }

  async updateCompany(id: string, data: Partial<CreateCompanyRequest>): Promise<Company> {
    return apiClient.patch<Company>(`/companies/${id}`, data);
  }

  async deleteCompany(id: string): Promise<void> {
    return apiClient.delete(`/companies/${id}`);
  }
}

export const companiesService = new CompaniesService();
```

### 2. Create Query Hooks for Companies

Create `src/hooks/useCompanies.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesService, type CreateCompanyRequest } from "../services/companies.service";
import { notifications } from "@mantine/notifications";

export const useCompanies = () => {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => companiesService.getCompanies(),
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companiesService.getCompany(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => companiesService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      notifications.show({
        title: "Success",
        message: "Company created successfully!",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to create company",
        color: "red",
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyRequest> }) =>
      companiesService.updateCompany(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", variables.id] });
      notifications.show({
        title: "Success",
        message: "Company updated successfully!",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to update company",
        color: "red",
      });
    },
  });
};
```

---

## Development Workflow

### 1. Start Development Servers

Open two terminals:

**Terminal 1 - Backend:**

```bash
cd accounting-backend
npm run start:dev
```

**Terminal 2 - Frontend:**

```bash
cd accounting-frontend
npm run dev
```

### 2. Verify Integration

1. Backend should be running at `http://localhost:3000`
2. Frontend should be running at `http://localhost:5173`
3. API documentation available at `http://localhost:3000/api/docs`
4. Test authentication flow by registering/logging in

### 3. Development Commands

**Backend Commands:**

```bash
# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

**Frontend Commands:**

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

---

## Testing Integration

### 1. API Testing

- Use the Swagger documentation at `http://localhost:3000/api/docs`
- Test all endpoints with different scenarios
- Verify authentication flows

### 2. Frontend Testing

Create test files to verify API integration:

```typescript
// src/test/api.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { authService } from "../services/auth.service";

describe("API Integration", () => {
  beforeAll(async () => {
    // Setup test environment
  });

  it("should authenticate user", async () => {
    const response = await authService.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.user).toBeDefined();
    expect(response.tokens.accessToken).toBeDefined();
  });
});
```

---

## Production Deployment

### 1. Environment Variables

Update production environment variables:

**Backend (.env.production):**

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Use production Supabase instance
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Strong JWT secrets
JWT_SECRET=your_strong_production_jwt_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
```

**Frontend (.env.production):**

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_ENVIRONMENT=production
VITE_ENABLE_DEVTOOLS=false
```

### 2. Build Commands

```bash
# Backend
cd accounting-backend
npm run build
npm run start:prod

# Frontend
cd accounting-frontend
npm run build
```

### 3. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates configured
- [ ] CORS settings updated
- [ ] Rate limiting configured
- [ ] Monitoring and logging setup
- [ ] Error tracking configured
- [ ] Backup strategy implemented

---

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Check `ALLOWED_ORIGINS` in backend .env
   - Verify frontend URL in backend configuration

2. **Authentication Issues**

   - Verify JWT secrets are set
   - Check token storage in localStorage
   - Ensure API interceptors are working

3. **Database Connection**

   - Verify Supabase credentials
   - Check database schema is applied
   - Test connection with Supabase client

4. **API Endpoints Not Found**
   - Verify API prefix configuration
   - Check route definitions in controllers
   - Ensure backend is running on correct port

### Debug Commands

```bash
# Backend logs
cd accounting-backend
npm run start:dev # Check console output

# Frontend network requests
# Open browser DevTools -> Network tab

# Test API directly
curl -X GET http://localhost:3000/api/v1/health
```

---

## Next Steps

1. Implement remaining service modules (accounts, transactions, invoices)
2. Add real-time features with WebSockets
3. Implement file upload functionality
4. Add comprehensive error boundaries
5. Set up automated testing
6. Configure CI/CD pipeline
7. Add performance monitoring
8. Implement caching strategies

---

## Support

For issues and questions:

- Check the API documentation at `/api/docs`
- Review backend logs in `accounting-backend/logs/`
- Use browser DevTools for frontend debugging
- Refer to framework documentation:
  - [NestJS Documentation](https://docs.nestjs.com/)
  - [React Documentation](https://react.dev/)
  - [Mantine Documentation](https://mantine.dev/)
  - [Vite Documentation](https://vite.dev/)
