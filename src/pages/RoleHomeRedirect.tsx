import { Navigate } from 'react-router-dom'
import { dutySiteId } from '../lib/roleHome.ts'
import { useScope } from '../lib/useScope.ts'

export function RoleHomeRedirect() {
  const { role, search } = useScope()
  if (role === 'exec') {
    return <Navigate to={`/apps/power${search}`} replace />
  }
  return <Navigate to={`/apps/events/sites/${dutySiteId('events')}${search}`} replace />
}
