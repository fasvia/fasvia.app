import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Standard client (Anon key) - Safe for both Client and Server components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
