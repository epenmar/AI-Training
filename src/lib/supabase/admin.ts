import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role Supabase client. Bypasses RLS — use ONLY in server
// actions / route handlers, never in client components, and always
// after verifying the caller is an admin with the normal auth'd
// client. The service-role key is server-only (no NEXT_PUBLIC prefix).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
