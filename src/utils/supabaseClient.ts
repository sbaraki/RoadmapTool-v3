import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null
let initialized = false

export function resetSupabaseClient(): void {
  client = null
  initialized = false
}

export function getSupabaseClient(): SupabaseClient | null {
  if (initialized) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  client = createClient(url, anonKey)
  initialized = true
  return client
}

export function getSupabaseConfigError(): string | null {
  return getSupabaseClient() ? null : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
}
