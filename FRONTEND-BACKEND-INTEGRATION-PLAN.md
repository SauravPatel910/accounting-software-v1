# Frontend-Backend Integration Plan

## Overview

This document outlines the step-by-step plan for connecting the React frontend with the NestJS backend for all accounting software modules. The integration will handle data fetching, posting, updating, and real-time synchronization across all modules.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
3. [Phase 2: Authentication & Authorization](#phase-2-authentication--authorization)
4. [Phase 3: Core Modules Integration](#phase-3-core-modules-integration)
5. [Phase 4: Advanced Features](#phase-4-advanced-features)
6. [Phase 5: Optimization & Performance](#phase-5-optimization--performance)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **State Management**: React Context + useReducer for complex state
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6

### Backend Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Authorization**: Role-based access control (RBAC)
- **Validation**: Class-validator with DTOs

### Communication Layer

- **Protocol**: REST API with JSON
- **Authentication**: Bearer token (JWT)
- **Base URL**: `http://localhost:3001/api`
- **WebSocket**: For real-time updates (Future)

---

## Phase 1: Core Infrastructure

### 1.1 API Client Configuration

#### Frontend API Setup (`/src/services/api.ts`)

```typescript
// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiry
      localStorage.removeItem("auth-token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
```

#### Backend CORS Configuration (`main.ts`)

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

### 1.2 Type Definitions

#### Shared Types (`/src/types/api.types.ts`)

```typescript
// Base API Response
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

// Pagination
interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Response
interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  timestamp: string;
}
```

### 1.3 Error Handling System

#### Frontend Error Context (`/src/contexts/ErrorContext.tsx`)

```typescript
interface ErrorState {
  errors: ApiError[];
  addError: (error: ApiError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

// Error boundary and global error handling
```

### 1.4 Loading State Management

#### Frontend Loading Context (`/src/contexts/LoadingContext.tsx`)

```typescript
interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  setLoading: (loading: boolean, message?: string) => void;
}
```

---

## Phase 2: Authentication & Authorization

### 2.1 Authentication Flow

#### Frontend Auth Service (`/src/services/authService.ts`)

```typescript
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    localStorage.setItem("auth-token", response.data.token);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("auth-token");
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/refresh");
    localStorage.setItem("auth-token", response.data.token);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },
};
```

#### Backend Auth Endpoints

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user profile

### 2.2 Protected Routes

#### Frontend Route Protection (`/src/components/ProtectedRoute.tsx`)

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  // Implementation for role-based route protection
};
```

---

## Phase 3: Core Modules Integration

### 3.1 Accounts Module

#### Frontend Implementation

**Service Layer** (`/src/services/accountsService.ts`)

```typescript
export const accountsService = {
  // GET /accounts - Fetch all accounts
  getAll: async (query?: AccountQueryDto): Promise<PaginatedResponse<Account>> => {
    const params = new URLSearchParams(query as any);
    const response = await apiClient.get<AccountListResponseDto>(`/accounts?${params}`);
    return response.data;
  },

  // GET /accounts/:id - Fetch single account
  getById: async (id: string, includeBalance = false): Promise<Account> => {
    const response = await apiClient.get<AccountResponseDto>(`/accounts/${id}?includeBalance=${includeBalance}`);
    return response.data;
  },

  // POST /accounts - Create new account
  create: async (data: CreateAccountDto): Promise<Account> => {
    const response = await apiClient.post<AccountResponseDto>("/accounts", data);
    return response.data;
  },

  // PATCH /accounts/:id - Update account
  update: async (id: string, data: UpdateAccountDto): Promise<Account> => {
    const response = await apiClient.patch<AccountResponseDto>(`/accounts/${id}`, data);
    return response.data;
  },

  // DELETE /accounts/:id - Delete account
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  // GET /accounts/hierarchy - Get account hierarchy
  getHierarchy: async (includeBalance = false, balanceAsOfDate?: string): Promise<AccountHierarchy[]> => {
    const params = new URLSearchParams({
      includeBalance: includeBalance.toString(),
      ...(balanceAsOfDate && { balanceAsOfDate }),
    });
    const response = await apiClient.get<AccountHierarchyDto[]>(`/accounts/hierarchy?${params}`);
    return response.data;
  },

  // POST /accounts/generate-code - Generate account code
  generateCode: async (data: GenerateAccountCodeDto): Promise<string> => {
    const response = await apiClient.post<AccountCodeResponseDto>("/accounts/generate-code", data);
    return response.data.code;
  },

  // POST /accounts/bulk-operation - Bulk operations
  bulkOperation: async (operation: BulkAccountOperationDto): Promise<void> => {
    await apiClient.post("/accounts/bulk-operation", operation);
  },
};
```

**React Hook** (`/src/hooks/useAccounts.ts`)

```typescript
export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async (query?: AccountQueryDto) => {
    setLoading(true);
    try {
      const response = await accountsService.getAll(query);
      setAccounts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (data: CreateAccountDto) => {
    try {
      const newAccount = await accountsService.create(data);
      setAccounts((prev) => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      throw err;
    }
  }, []);

  // Additional methods for update, delete, etc.

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    // ... other methods
  };
};
```

**Component Integration** (`/src/pages/Accounts.tsx`)

```typescript
export const AccountsPage: React.FC = () => {
  const { accounts, loading, error, fetchAccounts, createAccount } = useAccounts();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = async (data: CreateAccountDto) => {
    try {
      await createAccount(data);
      setShowCreateForm(false);
      // Show success notification
    } catch (error) {
      // Handle error
    }
  };

  return <div className="accounts-page">{/* Account list, forms, and UI components */}</div>;
};
```

#### Backend Endpoints

- `GET /accounts` - List accounts with filtering/pagination
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account details
- `PATCH /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account
- `GET /accounts/hierarchy` - Get account hierarchy
- `POST /accounts/generate-code` - Generate account code
- `POST /accounts/bulk-operation` - Bulk operations

### 3.2 Transactions Module

#### Frontend Implementation

**Service Layer** (`/src/services/transactionsService.ts`)

```typescript
export const transactionsService = {
  // GET /transactions - Fetch all transactions
  getAll: async (query?: TransactionQueryDto): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams(query as any);
    const response = await apiClient.get<TransactionListResponseDto>(`/transactions?${params}`);
    return response.data;
  },

  // POST /transactions - Create new transaction
  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await apiClient.post<TransactionResponseDto>("/transactions", data);
    return response.data;
  },

  // GET /transactions/:id - Get transaction details
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<TransactionResponseDto>(`/transactions/${id}`);
    return response.data;
  },

  // PATCH /transactions/:id - Update transaction
  update: async (id: string, data: UpdateTransactionDto): Promise<Transaction> => {
    const response = await apiClient.patch<TransactionResponseDto>(`/transactions/${id}`, data);
    return response.data;
  },

  // DELETE /transactions/:id - Delete transaction
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // POST /transactions/bulk - Bulk create transactions
  bulkCreate: async (data: BulkTransactionDto): Promise<Transaction[]> => {
    const response = await apiClient.post<TransactionResponseDto[]>("/transactions/bulk", data);
    return response.data;
  },

  // GET /transactions/search/advanced - Advanced search
  advancedSearch: async (query: string, filters?: Record<string, any>): Promise<Transaction[]> => {
    const params = new URLSearchParams({
      query,
      filters: JSON.stringify(filters || {}),
    });
    const response = await apiClient.get<TransactionListResponseDto>(`/transactions/search/advanced?${params}`);
    return response.data.transactions;
  },

  // POST /transactions/reconcile - Reconcile transactions
  reconcile: async (data: ReconciliationDto): Promise<ReconciliationResult> => {
    const response = await apiClient.post<ReconciliationResultDto>("/transactions/reconcile", data);
    return response.data;
  },

  // GET /transactions/reconcile/matches/:accountId - Get reconciliation matches
  getReconciliationMatches: async (accountId: string): Promise<ReconciliationMatch[]> => {
    const response = await apiClient.get<ReconciliationMatch[]>(`/transactions/reconcile/matches/${accountId}`);
    return response.data;
  },

  // GET /transactions/analytics/summary - Get analytics summary
  getAnalyticsSummary: async (period = "monthly"): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>(`/transactions/analytics/summary?period=${period}`);
    return response.data;
  },

  // GET /transactions/reports/trial-balance - Get trial balance
  getTrialBalance: async (asOfDate: string): Promise<TrialBalance> => {
    const response = await apiClient.get<TrialBalance>(`/transactions/reports/trial-balance?asOfDate=${asOfDate}`);
    return response.data;
  },

  // GET /transactions/reports/account-ledger/:accountId - Get account ledger
  getAccountLedger: async (accountId: string, startDate?: string, endDate?: string): Promise<AccountLedger> => {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const response = await apiClient.get<AccountLedger>(`/transactions/reports/account-ledger/${accountId}?${params}`);
    return response.data;
  },

  // POST /transactions/import - Import transactions
  importTransactions: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ImportResult>("/transactions/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // GET /transactions/export - Export transactions
  exportTransactions: async (format = "csv", startDate?: string, endDate?: string): Promise<Blob> => {
    const params = new URLSearchParams({
      format,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const response = await apiClient.get(`/transactions/export?${params}`, {
      responseType: "blob",
    });
    return response.data;
  },
};
```

#### Backend Endpoints

- `GET /transactions` - List transactions with filtering
- `POST /transactions` - Create new transaction
- `GET /transactions/:id` - Get transaction details
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `POST /transactions/bulk` - Bulk create transactions
- `GET /transactions/search/advanced` - Advanced search
- `POST /transactions/reconcile` - Reconcile transactions
- `GET /transactions/reconcile/matches/:accountId` - Get reconciliation matches
- `GET /transactions/analytics/summary` - Analytics summary
- `GET /transactions/reports/trial-balance` - Trial balance report
- `GET /transactions/reports/account-ledger/:accountId` - Account ledger
- `POST /transactions/import` - Import transactions
- `GET /transactions/export` - Export transactions

### 3.3 Invoices Module

#### Frontend Implementation

**Service Layer** (`/src/services/invoicesService.ts`)

```typescript
export const invoicesService = {
  // GET /invoices - Fetch all invoices
  getAll: async (query?: InvoiceQueryDto): Promise<PaginatedResponse<Invoice>> => {
    const params = new URLSearchParams(query as any);
    const response = await apiClient.get<PaginatedResponse<Invoice>>(`/invoices?${params}`);
    return response.data;
  },

  // POST /invoices - Create new invoice
  create: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await apiClient.post<InvoiceResponseDto>("/invoices", data);
    return response.data;
  },

  // GET /invoices/:id - Get invoice details
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<InvoiceResponseDto>(`/invoices/${id}`);
    return response.data;
  },

  // PATCH /invoices/:id/status - Update invoice status
  updateStatus: async (id: string, status: UpdateInvoiceStatusDto): Promise<Invoice> => {
    const response = await apiClient.patch<InvoiceResponseDto>(`/invoices/${id}/status`, status);
    return response.data;
  },

  // POST /invoices/:id/payments - Record payment
  recordPayment: async (id: string, payment: RecordPaymentDto): Promise<Invoice> => {
    const response = await apiClient.post<InvoiceResponseDto>(`/invoices/${id}/payments`, payment);
    return response.data;
  },

  // GET /invoices/stats/summary - Get invoice statistics
  getStats: async (): Promise<InvoiceStats> => {
    const response = await apiClient.get<InvoiceStats>("/invoices/stats/summary");
    return response.data;
  },

  // POST /invoices/:id/send-email - Send invoice via email
  sendEmail: async (id: string, emailData: EmailInvoiceData): Promise<void> => {
    await apiClient.post(`/invoices/${id}/send-email`, emailData);
  },

  // GET /invoices/:id/pdf - Download invoice PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};
```

#### Backend Endpoints

- `GET /invoices` - List invoices with filtering
- `POST /invoices` - Create new invoice
- `GET /invoices/:id` - Get invoice details
- `PATCH /invoices/:id/status` - Update invoice status
- `POST /invoices/:id/payments` - Record payment
- `GET /invoices/stats/summary` - Get statistics
- `POST /invoices/:id/send-email` - Send via email
- `GET /invoices/:id/pdf` - Download PDF

### 3.4 Companies Module

#### Frontend Implementation

**Service Layer** (`/src/services/companiesService.ts`)

```typescript
export const companiesService = {
  // GET /companies - Fetch all companies
  getAll: async (query?: CompanyQueryDto): Promise<PaginatedResponse<Company>> => {
    const params = new URLSearchParams(query as any);
    const response = await apiClient.get<CompanyListResponseDto>(`/companies?${params}`);
    return response.data;
  },

  // POST /companies - Create new company
  create: async (data: CreateCompanyDto): Promise<Company> => {
    const response = await apiClient.post<CompanyResponseDto>("/companies", data);
    return response.data;
  },

  // GET /companies/:id - Get company details
  getById: async (id: string): Promise<Company> => {
    const response = await apiClient.get<CompanyResponseDto>(`/companies/${id}`);
    return response.data;
  },

  // PATCH /companies/:id - Update company
  update: async (id: string, data: UpdateCompanyDto): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponseDto>(`/companies/${id}`, data);
    return response.data;
  },

  // PATCH /companies/:id/settings - Update company settings
  updateSettings: async (id: string, settings: UpdateCompanySettingsDto): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponseDto>(`/companies/${id}/settings`, settings);
    return response.data;
  },

  // PATCH /companies/:id/preferences - Update company preferences
  updatePreferences: async (id: string, preferences: UpdateCompanyPreferencesDto): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponseDto>(`/companies/${id}/preferences`, preferences);
    return response.data;
  },

  // DELETE /companies/:id - Delete company
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};
```

### 3.5 Users Module

#### Frontend Implementation

**Service Layer** (`/src/services/usersService.ts`)

```typescript
export const usersService = {
  // GET /users - Fetch all users
  getAll: async (query?: UserQueryDto): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams(query as any);
    const response = await apiClient.get<UserListResponseDto>(`/users?${params}`);
    return response.data;
  },

  // POST /users - Create new user
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post<UserResponseDto>("/users", data);
    return response.data;
  },

  // GET /users/:id - Get user details
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<UserResponseDto>(`/users/${id}`);
    return response.data;
  },

  // PATCH /users/:id - Update user
  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch<UserResponseDto>(`/users/${id}`, data);
    return response.data;
  },

  // PATCH /users/:id/role - Update user role
  updateRole: async (id: string, role: UserRole): Promise<User> => {
    const response = await apiClient.patch<UserResponseDto>(`/users/${id}/role`, { role });
    return response.data;
  },

  // DELETE /users/:id - Delete user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
```

---

## Phase 4: Advanced Features

### 4.1 Real-time Updates (WebSocket)

#### Frontend WebSocket Service (`/src/services/websocketService.ts`)

```typescript
export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    this.socket = new WebSocket(`ws://localhost:3001?token=${token}`);

    this.socket.onopen = () => {
      console.log("WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };

    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      // Implement reconnection logic
    };
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
```

### 4.2 Caching Strategy

#### Frontend Cache Service (`/src/services/cacheService.ts`)

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 4.3 Offline Support

#### Frontend Offline Service (`/src/services/offlineService.ts`)

```typescript
export class OfflineService {
  private isOnline = navigator.onLine;
  private pendingRequests: Array<{
    url: string;
    method: string;
    data: any;
    timestamp: number;
  }> = [];

  constructor() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingRequests();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  queueRequest(url: string, method: string, data: any): void {
    if (!this.isOnline) {
      this.pendingRequests.push({
        url,
        method,
        data,
        timestamp: Date.now(),
      });
    }
  }

  private async syncPendingRequests(): Promise<void> {
    for (const request of this.pendingRequests) {
      try {
        await apiClient.request({
          url: request.url,
          method: request.method as any,
          data: request.data,
        });
      } catch (error) {
        console.error("Failed to sync request:", error);
      }
    }
    this.pendingRequests = [];
  }
}
```

---

## Phase 5: Optimization & Performance

### 5.1 Data Pagination

#### Frontend Pagination Hook (`/src/hooks/usePagination.ts`)

```typescript
export const usePagination = <T>(
  fetchFn: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  initialLimit = 20
) => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (newPage = page) => {
      setLoading(true);
      try {
        const response = await fetchFn(newPage, limit);
        setData(response.data);
        setTotal(response.total);
        setPage(newPage);
      } catch (error) {
        console.error("Pagination error:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, page, limit]
  );

  return {
    data,
    page,
    limit,
    total,
    loading,
    totalPages: Math.ceil(total / limit),
    fetchData,
    setPage: (newPage: number) => fetchData(newPage),
    setLimit: (newLimit: number) => {
      setLimit(newLimit);
      fetchData(1);
    },
  };
};
```

### 5.2 Virtual Scrolling

#### Frontend Virtual List Component (`/src/components/VirtualList.tsx`)

```typescript
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({ items, itemHeight, containerHeight, renderItem }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: "absolute",
              top: (startIndex + index) * itemHeight,
              width: "100%",
              height: itemHeight,
            }}>
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 Request Debouncing

#### Frontend Debounce Hook (`/src/hooks/useDebounce.ts`)

```typescript
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search components
const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return { searchTerm, setSearchTerm };
};
```

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| POST   | `/auth/login`   | User authentication |
| POST   | `/auth/logout`  | User logout         |
| POST   | `/auth/refresh` | Refresh JWT token   |
| GET    | `/auth/me`      | Get current user    |

### Accounts Endpoints

| Method | Endpoint                   | Description           |
| ------ | -------------------------- | --------------------- |
| GET    | `/accounts`                | List all accounts     |
| POST   | `/accounts`                | Create new account    |
| GET    | `/accounts/:id`            | Get account by ID     |
| PATCH  | `/accounts/:id`            | Update account        |
| DELETE | `/accounts/:id`            | Delete account        |
| GET    | `/accounts/hierarchy`      | Get account hierarchy |
| POST   | `/accounts/generate-code`  | Generate account code |
| POST   | `/accounts/bulk-operation` | Bulk operations       |

### Transactions Endpoints

| Method | Endpoint                                   | Description              |
| ------ | ------------------------------------------ | ------------------------ |
| GET    | `/transactions`                            | List all transactions    |
| POST   | `/transactions`                            | Create new transaction   |
| GET    | `/transactions/:id`                        | Get transaction by ID    |
| PATCH  | `/transactions/:id`                        | Update transaction       |
| DELETE | `/transactions/:id`                        | Delete transaction       |
| POST   | `/transactions/bulk`                       | Bulk create transactions |
| GET    | `/transactions/search/advanced`            | Advanced search          |
| POST   | `/transactions/reconcile`                  | Reconcile transactions   |
| GET    | `/transactions/analytics/summary`          | Analytics summary        |
| GET    | `/transactions/reports/trial-balance`      | Trial balance            |
| GET    | `/transactions/reports/account-ledger/:id` | Account ledger           |
| POST   | `/transactions/import`                     | Import transactions      |
| GET    | `/transactions/export`                     | Export transactions      |

### Invoices Endpoints

| Method | Endpoint                   | Description           |
| ------ | -------------------------- | --------------------- |
| GET    | `/invoices`                | List all invoices     |
| POST   | `/invoices`                | Create new invoice    |
| GET    | `/invoices/:id`            | Get invoice by ID     |
| PATCH  | `/invoices/:id/status`     | Update invoice status |
| POST   | `/invoices/:id/payments`   | Record payment        |
| GET    | `/invoices/stats/summary`  | Get statistics        |
| POST   | `/invoices/:id/send-email` | Send via email        |
| GET    | `/invoices/:id/pdf`        | Download PDF          |

### Companies Endpoints

| Method | Endpoint                     | Description        |
| ------ | ---------------------------- | ------------------ |
| GET    | `/companies`                 | List all companies |
| POST   | `/companies`                 | Create new company |
| GET    | `/companies/:id`             | Get company by ID  |
| PATCH  | `/companies/:id`             | Update company     |
| PATCH  | `/companies/:id/settings`    | Update settings    |
| PATCH  | `/companies/:id/preferences` | Update preferences |
| DELETE | `/companies/:id`             | Delete company     |

### Users Endpoints

| Method | Endpoint          | Description      |
| ------ | ----------------- | ---------------- |
| GET    | `/users`          | List all users   |
| POST   | `/users`          | Create new user  |
| GET    | `/users/:id`      | Get user by ID   |
| PATCH  | `/users/:id`      | Update user      |
| PATCH  | `/users/:id/role` | Update user role |
| DELETE | `/users/:id`      | Delete user      |

---

## Data Flow Diagrams

### Transaction Creation Flow

```
Frontend                Backend                Database
   |                       |                       |
   |-- POST /transactions --|                       |
   |                       |-- Validate DTO -------|
   |                       |-- Create Transaction --|
   |                       |-- Create Entries -----|
   |                       |-- Update Balances ----|
   |                       |-- Audit Log ----------|
   |                       |                       |
   |<-- Transaction Data --|<-- Return Result -----|
   |                       |                       |
```

### Invoice Payment Flow

```
Frontend                Backend                Database
   |                       |                       |
   |-- POST /invoices/:id/ --|                      |
   |    payments            |-- Validate Payment --|
   |                       |-- Update Invoice -----|
   |                       |-- Create Transaction --|
   |                       |-- Update AR Account --|
   |                       |-- Send Notification --|
   |                       |                       |
   |<-- Updated Invoice ---|<-- Return Result -----|
   |                       |                       |
```

---

## Error Handling Strategy

### Frontend Error Handling

#### Global Error Boundary (`/src/components/ErrorBoundary.tsx`)

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>{this.state.error && this.state.error.toString()}</details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### API Error Handler (`/src/utils/errorHandler.ts`)

```typescript
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.message || "Invalid request data";
      case 401:
        return "Authentication required";
      case 403:
        return "Access denied";
      case 404:
        return "Resource not found";
      case 422:
        return data.message || "Validation failed";
      case 500:
        return "Internal server error";
      default:
        return data.message || "An error occurred";
    }
  } else if (error.request) {
    // Network error
    return "Network error. Please check your connection.";
  } else {
    // Other error
    return error.message || "An unexpected error occurred";
  }
};
```

### Backend Error Handling

#### Global Exception Filter (`/src/common/filters/all-exceptions.filter.ts`)

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : "Unknown error",
      "AllExceptionsFilter"
    );

    response.status(status).json(errorResponse);
  }
}
```

---

## Testing Strategy

### Frontend Testing

#### Service Testing (`/src/services/__tests__/accountsService.test.ts`)

```typescript
import { accountsService } from "../accountsService";
import { apiClient } from "../api";

jest.mock("../api");

describe("AccountsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all accounts", async () => {
      const mockResponse = {
        data: {
          data: [{ id: "1", name: "Test Account" }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await accountsService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith("/accounts?");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("create", () => {
    it("should create a new account", async () => {
      const accountData = { name: "Test Account", type: "ASSET" };
      const mockResponse = { data: { id: "1", ...accountData } };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await accountsService.create(accountData);

      expect(apiClient.post).toHaveBeenCalledWith("/accounts", accountData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

#### Component Testing (`/src/components/__tests__/AccountList.test.tsx`)

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountList } from "../AccountList";
import { accountsService } from "../../services/accountsService";

jest.mock("../../services/accountsService");

describe("AccountList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render accounts list", async () => {
    const mockAccounts = [
      { id: "1", name: "Cash", type: "ASSET" },
      { id: "2", name: "Revenue", type: "REVENUE" },
    ];

    (accountsService.getAll as jest.Mock).mockResolvedValue({
      data: mockAccounts,
      total: 2,
    });

    render(<AccountList />);

    await waitFor(() => {
      expect(screen.getByText("Cash")).toBeInTheDocument();
      expect(screen.getByText("Revenue")).toBeInTheDocument();
    });
  });

  it("should handle account creation", async () => {
    const user = userEvent.setup();

    (accountsService.getAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });
    (accountsService.create as jest.Mock).mockResolvedValue({
      id: "1",
      name: "New Account",
      type: "ASSET",
    });

    render(<AccountList />);

    const createButton = screen.getByText("Create Account");
    await user.click(createButton);

    // Test form interaction
    const nameInput = screen.getByLabelText("Account Name");
    await user.type(nameInput, "New Account");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(accountsService.create).toHaveBeenCalledWith({
        name: "New Account",
        type: "ASSET",
      });
    });
  });
});
```

### Backend Testing

#### Controller Testing (`/src/accounts/__tests__/accounts.controller.spec.ts`)

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { AccountsController } from "../accounts.controller";
import { AccountsService } from "../accounts.service";

describe("AccountsController", () => {
  let controller: AccountsController;
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
  });

  describe("create", () => {
    it("should create an account", async () => {
      const createAccountDto = { name: "Test Account", type: "ASSET" };
      const result = { id: "1", ...createAccountDto };

      jest.spyOn(service, "create").mockResolvedValue(result as any);

      expect(await controller.create(createAccountDto, { user: { companyId: "1" } } as any)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createAccountDto, "1");
    });
  });
});
```

#### Service Testing (`/src/accounts/__tests__/accounts.service.spec.ts`)

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountsService } from "../accounts.service";
import { Account } from "../entities/account.entity";

describe("AccountsService", () => {
  let service: AccountsService;
  let repository: Repository<Account>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<Repository<Account>>(getRepositoryToken(Account));
  });

  describe("create", () => {
    it("should create and save an account", async () => {
      const createAccountDto = { name: "Test Account", type: "ASSET" };
      const account = { id: "1", ...createAccountDto };

      jest.spyOn(repository, "create").mockReturnValue(account as any);
      jest.spyOn(repository, "save").mockResolvedValue(account as any);

      const result = await service.create(createAccountDto, "1");

      expect(repository.create).toHaveBeenCalledWith({
        ...createAccountDto,
        companyId: "1",
      });
      expect(repository.save).toHaveBeenCalledWith(account);
      expect(result).toBe(account);
    });
  });
});
```

---

## Implementation Timeline

### Phase 1: Infrastructure (Week 1-2)

- [ ] Set up API client configuration
- [ ] Implement error handling system
- [ ] Create loading state management
- [ ] Set up type definitions
- [ ] Configure CORS and security

### Phase 2: Authentication (Week 3)

- [ ] Implement authentication service
- [ ] Create protected routes
- [ ] Set up JWT token management
- [ ] Implement role-based access control

### Phase 3: Core Modules (Week 4-8)

- [ ] Accounts module integration (Week 4)
- [ ] Transactions module integration (Week 5-6)
- [ ] Invoices module integration (Week 7)
- [ ] Companies and Users modules (Week 8)

### Phase 4: Advanced Features (Week 9-11)

- [ ] Real-time updates with WebSocket (Week 9)
- [ ] Caching implementation (Week 10)
- [ ] Offline support (Week 11)

### Phase 5: Optimization (Week 12-13)

- [ ] Performance optimization
- [ ] Virtual scrolling for large datasets
- [ ] Request debouncing
- [ ] Bundle optimization

### Phase 6: Testing & Documentation (Week 14-15)

- [ ] Unit tests for all services
- [ ] Integration tests
- [ ] E2E tests
- [ ] API documentation
- [ ] User documentation

---

## Conclusion

This comprehensive integration plan provides a structured approach to connecting the React frontend with the NestJS backend. The phased implementation ensures:

1. **Scalability**: Modular architecture allows for easy expansion
2. **Maintainability**: Clear separation of concerns and consistent patterns
3. **Performance**: Optimized data loading and caching strategies
4. **Reliability**: Comprehensive error handling and testing
5. **User Experience**: Real-time updates and offline support

Following this plan will result in a robust, production-ready accounting software with seamless frontend-backend integration.
