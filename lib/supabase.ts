import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Standard client (Anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Admin client (Service role key) - only use in secure server contexts!
export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey
)
