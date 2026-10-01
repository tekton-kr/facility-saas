import { Navigate } from 'react-router-dom'
import { homePath } from '../lib/auth.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { useAuth } from '../lib/useAuth.ts'
import { useScope } from '../lib/useScope.ts'

export function RoleHomeRedirect() {
  const session = useAuth()
  const { role, search } = useScope()
  if (session) {
    return <Navigate to={homePath(session)} replace />
  }
  if (role === 'exec') {
    return <Navigate to={`/apps/events${search}`} replace />
  }
  return <Navigate to={`/apps/events/sites/${dutySiteId('events')}${search}`} replace />
}
