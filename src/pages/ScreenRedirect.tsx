import { Navigate, useParams } from 'react-router-dom'
import { getScreen } from '../data/screens.ts'

export function ScreenRedirect() {
  const { screenId } = useParams()
  const screen = screenId ? getScreen(screenId) : undefined
  if (!screen) {
    return <Navigate to="/screens" replace />
  }
  return <Navigate to={screen.path} replace />
}
