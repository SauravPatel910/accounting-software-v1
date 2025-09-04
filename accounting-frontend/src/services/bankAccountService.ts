import { supabase } from "../lib/supabase";

export interface BankAccountRow {
  id: string;
  company_id?: string | null;
  name: string;
  account_number?: string | null;
  account_type?: string | null;
  bank_name?: string | null;
  balance?: number | null;
  currency?: string | null;
  is_active?: boolean | null;
  last_sync_date?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BankAccountDTO {
  id: string;
  name: string;
  accountNumber: string;
  accountType: string;
  bankName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastSyncDate?: Date;
  description?: string;
}

/**
 * Fetch bank accounts from Supabase table `bank_accounts`.
 * If your table has a different name or column names, adjust the queries below.
 */
export async function getBankAccounts(companyId?: string): Promise<BankAccountDTO[]> {
  let query = supabase.from("bank_accounts").select("*").order("name", { ascending: true });

  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((r: BankAccountRow) => ({
    id: r.id,
    name: r.name,
    accountNumber: r.account_number ?? "",
    accountType: r.account_type ?? "checking",
    bankName: r.bank_name ?? "",
    balance: Number(r.balance ?? 0),
    currency: r.currency ?? "INR",
    isActive: r.is_active ?? true,
    lastSyncDate: r.last_sync_date ? new Date(r.last_sync_date) : undefined,
    description: r.description ?? undefined,
  }));
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) throw error;
}
