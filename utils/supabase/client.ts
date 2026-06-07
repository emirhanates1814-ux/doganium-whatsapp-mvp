import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseKey, getPublicSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

export const createClient = () =>
  createBrowserClient<Database>(getPublicSupabaseUrl(), getPublicSupabaseKey());
