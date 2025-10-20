import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a single supabase client for interacting with your database
// Use fallback values to prevent URL construction errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Only create client if we have valid URLs
let supabase: any = null

try {
  if (supabaseUrl !== "https://placeholder.supabase.co" && supabaseAnonKey !== "placeholder-key") {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  } else {
    // Create a mock client for development without Supabase
    console.warn("Supabase not configured, using mock client")
    supabase = {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        eq: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
      }),
    }
  }
} catch (error) {
  console.error("Failed to create Supabase client:", error)
  // Create a mock client as fallback
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }
}

export { supabase }
