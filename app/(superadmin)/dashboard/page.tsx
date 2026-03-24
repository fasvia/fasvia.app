import { redirect } from 'next/navigation'

export default function SuperAdminDashboardRedirect() {
  // Redirect to the actual Fasvia HQ portal
  redirect('/fasvia-hq')
}
