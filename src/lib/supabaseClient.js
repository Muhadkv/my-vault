import { createClient } from '@supabase/supabase-js'

// Fill these in from your Supabase project: Settings -> API
// It's safe for these to be public — the anon key only allows what your
// Row Level Security policies permit (see sql/schema.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars are missing. Create a .env file (see .env.example) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
