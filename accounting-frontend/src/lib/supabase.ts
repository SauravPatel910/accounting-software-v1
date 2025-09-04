import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for the database
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string | null;
          tax_id: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          company_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          company_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          name: string;
          accountNumber: string;
          accountType: "checking" | "savings" | "credit" | "cash" | "investment";
          bankName: string;
          balance: number;
          currency: string;
          isActive: boolean;
          lastSyncDate?: string;
          description?: string;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          accountNumber: string;
          accountType: "checking" | "savings" | "credit" | "cash" | "investment";
          bankName: string;
          balance?: number;
          currency?: string;
          isActive?: boolean;
          lastSyncDate?: string;
          description?: string;
          company_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          accountNumber?: string;
          accountType?: "checking" | "savings" | "credit" | "cash" | "investment";
          bankName?: string;
          balance?: number;
          currency?: string;
          isActive?: boolean;
          lastSyncDate?: string;
          description?: string;
          company_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add more table types as needed
    };
  };
}
