import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserSession } from '@/lib/auth'

/**
 * Extracts the school_id prioritizing the authenticated JWT payload for guaranteed multi-tenant accuracy,
 * falling back to the middleware header proxy.
 */
export function getSchoolId() {
  const session = getUserSession()
  if (session?.school_id) {
    return session.school_id
  }

  const headersList = headers()
  return headersList.get('x-school-id')
}

/**
 * Returns the Supabase client (standard or admin) and a helper to automatically 
 * scoped queries to the current tenant's school_id.
 */
export function getTenantDb(admin = false) {
  const schoolId = getSchoolId()
  
  if (!schoolId) {
    throw new Error('Tenant context missing: No school_id found in request headers.')
  }

  const client = admin ? supabaseAdmin : supabase

  return {
    supabase: client,
    schoolId,
    // Helper to append .eq('school_id', schoolId) to any query builder
    withTenant: <T extends { eq: (column: string, value: any) => any }>(query: T) => {
      return query.eq('school_id', schoolId)
    }
  }
}
