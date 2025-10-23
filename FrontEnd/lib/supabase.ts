import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Ambil environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validasi konfigurasi environment
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Environment variable tidak lengkap. Menggunakan mock client."
  );
}

// Jika env lengkap → buat client asli, jika tidak → fallback ke mock
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
          select: async () => ({ data: [], error: null }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
          eq: async () => ({ data: null, error: null }),
          order: async () => ({ data: [], error: null }),
        }),
        storage: {
          from: () => ({
            upload: async () => ({ data: null, error: null }),
            download: async () => ({ data: null, error: null }),
            remove: async () => ({ data: null, error: null }),
            list: async () => ({ data: [], error: null }),
          }),
        },
      };
