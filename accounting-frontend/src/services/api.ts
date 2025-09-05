// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Types
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  size: string;
  pattern?: string;
  loadIndex?: string;
  speedRating?: string;
  type: "car" | "truck" | "motorcycle" | "atv" | "other";
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  sku: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItem {
  id: string;
  productId?: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  issueDate: Date;
  dueDate: Date;
  description: string;
  notes?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCustomerData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
}

interface CreateProductData {
  name: string;
  brand: string;
  size: string;
  pattern?: string;
  loadIndex?: string;
  speedRating?: string;
  type: "car" | "truck" | "motorcycle" | "atv" | "other";
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  sku: string;
  description?: string;
  category: string;
  isActive?: boolean;
}

interface CreateInvoiceData {
  customerId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  description: string;
  notes?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: Omit<InvoiceItem, "id">[];
  taxRate: number;
}

interface EmailInvoiceData {
  to: string;
  subject: string;
  message: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

// Vendor Management Types
interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
  paymentTerms?: string;
  category?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateVendorData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
  paymentTerms?: string;
  category?: string;
  notes?: string;
}

// Bill Management Types
interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendor?: Vendor;
  billDate: Date;
  dueDate: Date;
  description: string;
  notes?: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  items: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  paymentDate?: Date;
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBillData {
  vendorId: string;
  billDate: Date;
  dueDate: Date;
  description: string;
  notes?: string;
  items: Omit<BillItem, "id">[];
  taxRate: number;
  referenceNumber?: string;
}

// Direct Expense Types
interface Expense {
  id: string;
  expenseNumber: string;
  vendorId?: string;
  vendor?: Vendor;
  date: Date;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  total: number;
  paymentMethod: "cash" | "card" | "check" | "bank_transfer" | "other";
  receiptUrl?: string;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "reimbursed";
  createdAt: Date;
  updatedAt: Date;
}

interface CreateExpenseData {
  vendorId?: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  paymentMethod: Expense["paymentMethod"];
  receiptUrl?: string;
  notes?: string;
}

// Expense Categories
interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateExpenseCategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Base API class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
    };

    // Set headers, but not for FormData
    if (!(options.body instanceof FormData)) {
      config.headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
    } else {
      config.headers = {
        ...options.headers,
      };
    }

    // Add auth token if available
    const token = localStorage.getItem("auth-token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    // Handle FormData specially
    if (data instanceof FormData) {
      return this.request<T>(endpoint, {
        method: "POST",
        body: data,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          ...(options?.headers || {}),
        },
      });
    }

    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Customer API
export const customerApi = {
  // Get all customers
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>("/customers");
    return response.data;
  },

  // Get customer by ID
  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  create: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post<Customer>("/customers", data);
    return response.data;
  },

  // Update customer
  update: async (id: string, data: Partial<CreateCustomerData>): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  // Search customers
  search: async (query: string): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>(`/customers/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Product API
export const productApi = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>("/products");
    return response.data;
  },

  // Get product by ID
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Create new product
  create: async (data: CreateProductData): Promise<Product> => {
    const response = await apiClient.post<Product>("/products", data);
    return response.data;
  },

  // Update product
  update: async (id: string, data: Partial<CreateProductData>): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  // Delete product
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Search products
  search: async (query: string): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get products by category
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id: string, quantity: number): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}/stock`, { quantity });
    return response.data;
  },
};

// Invoice API
export const invoiceApi = {
  // Get all invoices
  getAll: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>("/invoices");
    return response.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  // Create new invoice
  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>("/invoices", data);
    return response.data;
  },

  // Update invoice
  update: async (id: string, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await apiClient.put<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  // Delete invoice
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  // Mark invoice as paid
  markAsPaid: async (id: string, paidAmount: number, paymentDate?: Date): Promise<Invoice> => {
    const response = await apiClient.put<Invoice>(`/invoices/${id}/mark-paid`, {
      paidAmount,
      paymentDate: paymentDate || new Date(),
    });
    return response.data;
  },

  // Send invoice via email
  sendEmail: async (id: string, emailData: EmailInvoiceData): Promise<void> => {
    await apiClient.post(`/invoices/${id}/send-email`, emailData);
  },

  // Generate PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    return response.blob();
  },

  // Get invoices by customer
  getByCustomer: async (customerId: string): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>(`/invoices/customer/${customerId}`);
    return response.data;
  },

  // Get invoice statistics
  getStats: async (): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> => {
    const response = await apiClient.get<{
      total: number;
      paid: number;
      pending: number;
      overdue: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
    }>("/invoices/stats");
    return response.data;
  },
};

// Authentication API
export const authApi = {
  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    // Store token in localStorage
    localStorage.setItem("auth-token", response.data.token);

    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout", {});
    localStorage.removeItem("auth-token");
  },

  // Register
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", userData);

    // Store token in localStorage
    localStorage.setItem("auth-token", response.data.token);

    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>("/auth/refresh", {});

    // Update token in localStorage
    localStorage.setItem("auth-token", response.data.token);

    return response.data;
  },
};

// Company/Settings API
export const settingsApi = {
  // Get company settings
  getCompanyInfo: async (): Promise<CompanyInfo> => {
    const response = await apiClient.get<CompanyInfo>("/settings/company");
    return response.data;
  },

  // Update company settings
  updateCompanyInfo: async (data: Partial<CompanyInfo>): Promise<CompanyInfo> => {
    const response = await apiClient.put<CompanyInfo>("/settings/company", data);
    return response.data;
  },
};

// Vendor API
export const vendorApi = {
  // Get all vendors
  getAll: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>("/vendors");
    return response.data;
  },

  // Get vendor by ID
  getById: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get<Vendor>(`/vendors/${id}`);
    return response.data;
  },

  // Create new vendor
  create: async (data: CreateVendorData): Promise<Vendor> => {
    const response = await apiClient.post<Vendor>("/vendors", data);
    return response.data;
  },

  // Update vendor
  update: async (id: string, data: Partial<CreateVendorData>): Promise<Vendor> => {
    const response = await apiClient.put<Vendor>(`/vendors/${id}`, data);
    return response.data;
  },

  // Delete vendor
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },

  // Search vendors
  search: async (query: string): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>(`/vendors/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Bill API
export const billApi = {
  // Get all bills
  getAll: async (): Promise<Bill[]> => {
    const response = await apiClient.get<Bill[]>("/bills");
    return response.data;
  },

  // Get bill by ID
  getById: async (id: string): Promise<Bill> => {
    const response = await apiClient.get<Bill>(`/bills/${id}`);
    return response.data;
  },

  // Create new bill
  create: async (data: CreateBillData): Promise<Bill> => {
    const response = await apiClient.post<Bill>("/bills", data);
    return response.data;
  },

  // Update bill
  update: async (id: string, data: Partial<CreateBillData>): Promise<Bill> => {
    const response = await apiClient.put<Bill>(`/bills/${id}`, data);
    return response.data;
  },

  // Delete bill
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bills/${id}`);
  },

  // Update bill status
  updateStatus: async (id: string, status: Bill["status"]): Promise<Bill> => {
    const response = await apiClient.patch<Bill>(`/bills/${id}/status`, { status });
    return response.data;
  },

  // Mark bill as paid
  markAsPaid: async (id: string, paidAmount: number, paymentDate: Date): Promise<Bill> => {
    const response = await apiClient.patch<Bill>(`/bills/${id}/payment`, {
      paidAmount,
      paymentDate,
      status: "paid",
    });
    return response.data;
  },

  // Get bills by vendor
  getByVendor: async (vendorId: string): Promise<Bill[]> => {
    const response = await apiClient.get<Bill[]>(`/bills/vendor/${vendorId}`);
    return response.data;
  },
};

// Expense API
export const expenseApi = {
  // Get all expenses
  getAll: async (): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>("/expenses");
    return response.data;
  },

  // Get expense by ID
  getById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  // Create new expense
  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await apiClient.post<Expense>("/expenses", data);
    return response.data;
  },

  // Update expense
  update: async (id: string, data: Partial<CreateExpenseData>): Promise<Expense> => {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  // Delete expense
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  // Update expense status
  updateStatus: async (id: string, status: Expense["status"]): Promise<Expense> => {
    const response = await apiClient.patch<Expense>(`/expenses/${id}/status`, { status });
    return response.data;
  },

  // Get expenses by category
  getByCategory: async (category: string): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>(`/expenses/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  // Get expenses by vendor
  getByVendor: async (vendorId: string): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>(`/expenses/vendor/${vendorId}`);
    return response.data;
  },

  // Upload receipt
  uploadReceipt: async (expenseId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("receipt", file);

    const response = await apiClient.post<{ url: string }>(`/expenses/${expenseId}/receipt`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.url;
  },
};

// Expense Category API
export const expenseCategoryApi = {
  // Get all categories
  getAll: async (): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get<ExpenseCategory[]>("/expense-categories");
    return response.data;
  },

  // Create new category
  create: async (data: CreateExpenseCategoryData): Promise<ExpenseCategory> => {
    const response = await apiClient.post<ExpenseCategory>("/expense-categories", data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: Partial<CreateExpenseCategoryData>): Promise<ExpenseCategory> => {
    const response = await apiClient.put<ExpenseCategory>(`/expense-categories/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expense-categories/${id}`);
  },
};

// prettier-ignore
import { type AccountHierarchyDto, type AccountResponseDto, type CreateAccountDto, type UpdateAccountDto, type AccountQueryDto, type AccountListResponseDto, type GenerateAccountCodeDto, type AccountCodeResponseDto } from "../types/accounts";

// Accounts API
export const accountsApi = {
  // Get all accounts
  getAll: async (query?: AccountQueryDto): Promise<AccountListResponseDto> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString ? `/accounts?${queryString}` : "/accounts";
    const response = await apiClient.get<AccountListResponseDto>(endpoint);
    return response.data;
  },

  // Get account by ID
  getById: async (id: string, includeBalance?: boolean, balanceAsOfDate?: string): Promise<AccountResponseDto> => {
    const params = new URLSearchParams();
    if (includeBalance !== undefined) params.append("includeBalance", String(includeBalance));
    if (balanceAsOfDate) params.append("balanceAsOfDate", balanceAsOfDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/accounts/${id}?${queryString}` : `/accounts/${id}`;
    const response = await apiClient.get<AccountResponseDto>(endpoint);
    return response.data;
  },

  // Create new account
  create: async (data: CreateAccountDto): Promise<AccountResponseDto> => {
    const response = await apiClient.post<AccountResponseDto>("/accounts", data);
    return response.data;
  },

  // Update account
  update: async (id: string, data: UpdateAccountDto): Promise<AccountResponseDto> => {
    const response = await apiClient.patch<AccountResponseDto>(`/accounts/${id}`, data);
    return response.data;
  },

  // Delete account
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  // Get account hierarchy
  getHierarchy: async (includeBalance?: boolean, balanceAsOfDate?: string): Promise<AccountHierarchyDto[]> => {
    const params = new URLSearchParams();
    if (includeBalance !== undefined) params.append("includeBalance", String(includeBalance));
    if (balanceAsOfDate) params.append("balanceAsOfDate", balanceAsOfDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/accounts/hierarchy?${queryString}` : "/accounts/hierarchy";
    const response = await apiClient.get<AccountHierarchyDto[]>(endpoint);
    return response.data;
  },

  // Generate account code
  generateCode: async (data: GenerateAccountCodeDto): Promise<AccountCodeResponseDto> => {
    const response = await apiClient.post<AccountCodeResponseDto>("/accounts/generate-code", data);
    return response.data;
  },

  // Get account balance
  getBalance: async (id: string, asOfDate?: string) => {
    const params = new URLSearchParams();
    if (asOfDate) params.append("asOfDate", asOfDate);
    const queryString = params.toString();
    const endpoint = queryString ? `/accounts/${id}/balance?${queryString}` : `/accounts/${id}/balance`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },
};

// Export types for use in components
export type {
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  CreateCustomerData,
  CreateProductData,
  CreateInvoiceData,
  EmailInvoiceData,
  Vendor,
  CreateVendorData,
  Bill,
  BillItem,
  CreateBillData,
  Expense,
  CreateExpenseData,
  ExpenseCategory,
  CreateExpenseCategoryData,
  ApiResponse,
  User,
  AuthResponse,
  CompanyInfo,
};

// Default export for the API client
export default apiClient;
