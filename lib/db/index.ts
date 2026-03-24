import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
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
 * Returns the Supabase client and a helper to automatically scoped queries
 * to the current tenant's school_id.
 */
export function getTenantDb() {
  const schoolId = getSchoolId()
  
  if (!schoolId) {
    throw new Error('Tenant context missing: No school_id found in request headers.')
  }

  return {
    supabase,
    schoolId,
    // Helper to append .eq('school_id', schoolId) to any query builder
    withTenant: <T extends { eq: (column: string, value: any) => any }>(query: T) => {
      return query.eq('school_id', schoolId)
    }
  }
}
