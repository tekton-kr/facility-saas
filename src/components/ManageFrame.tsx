import type { ReactNode } from 'react'
import { useAuth } from '../lib/useAuth.ts'

export function ManageFrame({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: ReactNode
}) {
  const session = useAuth()
  const dark = session?.role === 'exec' || session?.entry === 'command'

  return (
    <div className={dark ? 'cmd manage' : 'manage'}>
      <header className="cmd-head">
        <div>
          {kicker ? <p>{kicker}</p> : null}
          <h1>{title}</h1>
        </div>
      </header>
      {children}
    </div>
  )
}
