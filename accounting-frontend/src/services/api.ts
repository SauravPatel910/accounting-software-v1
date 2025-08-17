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

interface InvoiceItem {
  id: string;
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

// Base API class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

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

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
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
    const response = await apiClient.get<Customer[]>(
      `/customers/search?q=${encodeURIComponent(query)}`
    );
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

// Export types for use in components
export type {
  Customer,
  Invoice,
  InvoiceItem,
  CreateCustomerData,
  CreateInvoiceData,
  EmailInvoiceData,
  ApiResponse,
  User,
  AuthResponse,
  CompanyInfo,
};

// Default export for the API client
export default apiClient;
