import { useEffect, useState } from 'react'
import { getSession, subscribeAuth } from './auth.ts'

export function useAuth() {
  const [session, setSession] = useState(getSession)

  useEffect(() => subscribeAuth(() => setSession(getSession())), [])

  return session
}
