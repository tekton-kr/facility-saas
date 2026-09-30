import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { LoginFrame } from '../components/LoginFrame.tsx'
import { notifyHome, startNotify } from '../lib/auth.ts'
import { isAlarmKindCollected } from '../lib/collection.ts'
import { readNotifyToken } from '../lib/notifyLink.ts'
import { generateAlarms } from '../lib/telemetry.ts'

export function NotifyPage() {
  const { token } = useParams()
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ok'; to: string }
    | { status: 'bad'; message: string }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function open() {
      const payload = await readNotifyToken(token ?? '')
      if (!payload) {
        if (!cancelled) setState({ status: 'bad', message: '이 알림은 없거나 만료되었습니다.' })
        return
      }
      const alarm = generateAlarms().find((item) => item.id === payload.alarmId && item.siteId === payload.siteId)
      if (!alarm || !isAlarmKindCollected(alarm.kind)) {
        if (!cancelled) setState({ status: 'bad', message: '이 예외는 붙은 계통이 아닙니다. 0으로 채우지 않습니다.' })
        return
      }
      try {
        startNotify(payload.alarmId, payload.siteId)
        if (!cancelled) setState({ status: 'ok', to: notifyHome(payload.siteId, payload.alarmId) })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'bad',
            message: err instanceof Error ? err.message : '이 알림을 열지 못했습니다.',
          })
        }
      }
    }
    void open()
    return () => {
      cancelled = true
    }
  }, [token])

  if (state.status === 'ok') return <Navigate to={state.to} replace />

  if (state.status === 'loading') {
    return (
      <LoginFrame>
        <h1>알림</h1>
        <p className="login-lede">그 한 건을 엽니다. 들어가기를 거치지 않습니다.</p>
      </LoginFrame>
    )
  }

  return (
    <LoginFrame>
      <h1>알림을 열 수 없습니다</h1>
      <p className="login-lede">{state.message}</p>
      <p className="login-key-note"><Link to="/login">다른 문으로</Link></p>
    </LoginFrame>
  )
}
