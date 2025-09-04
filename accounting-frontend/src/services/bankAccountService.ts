import { supabase } from "../lib/supabase";

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountType: "checking" | "savings" | "credit" | "cash" | "investment";
  bankName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastSyncDate?: string; // Changed to string since Supabase returns ISO string
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export async function fetchBankAccounts(companyId?: string): Promise<BankAccount[]> {
  let query = supabase.from("bank_accounts").select("*").order("created_at", { ascending: false });

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch bank accounts: ${error.message}`);
  }

  return data || [];
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete bank account: ${error.message}`);
  }
}
