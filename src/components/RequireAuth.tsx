import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isLogoutRedirect, logoutTarget } from '../lib/auth.ts'
import { useAuth } from '../lib/useAuth.ts'

export function RequireAuth() {
  const session = useAuth()
  const location = useLocation()

  if (!session) {
    if (isLogoutRedirect()) {
      return <Navigate to={logoutTarget()} replace />
    }
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (session.mustChangePassword) {
    return <Navigate to="/login/password" replace />
  }

  return <Outlet />
}
