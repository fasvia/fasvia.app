import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

// This file should ONLY be imported in Server Components or API Routes
if (typeof window !== 'undefined') {
  throw new Error('CRITICAL SECURITY ALERT: supabase-admin.ts must not be imported in the browser!')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client (Service role key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl, 
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
