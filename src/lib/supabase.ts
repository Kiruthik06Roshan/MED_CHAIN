import {
  createBrowserClient,
  createServerClient as createSsrServerClient,
} from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type {
  CookieOptions,
  ReadonlyRequestCookies,
} from "next/dist/server/web/spec-extension/adapters/request-cookies";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }
}

export function createClient() {
  requireSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createServerClient(
  cookies: Pick<ReadonlyRequestCookies, "get" | "set" | "remove">,
) {
  requireSupabaseEnv();

  return createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies.remove(name, options);
      },
    },
  });
}

export function createServiceClient(): SupabaseClient {
  requireSupabaseEnv();

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
