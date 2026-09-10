import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isLogoutRedirect } from '../lib/auth.ts'
import { useAuth } from '../lib/useAuth.ts'

export function RequireAuth() {
  const session = useAuth()
  const location = useLocation()

  if (!session) {
    if (isLogoutRedirect()) {
      return <Navigate to="/login" replace />
    }
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <Outlet />
}
