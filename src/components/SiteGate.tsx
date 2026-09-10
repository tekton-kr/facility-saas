import { Navigate, Outlet, useParams } from 'react-router-dom'
import { homePath } from '../lib/auth.ts'
import { isSiteAllowed } from '../lib/siteScope.ts'
import { useAuth } from '../lib/useAuth.ts'

export function SiteGate() {
  const { siteId } = useParams()
  const session = useAuth()

  if (siteId && !isSiteAllowed(siteId)) {
    return <Navigate to={homePath(session?.role ?? 'ops')} replace />
  }

  return <Outlet />
}
