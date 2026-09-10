import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginPreview } from '../components/LoginPreview.tsx'
import { homePath, isLogoutRedirect, safeNext, signIn, signInDemo } from '../lib/auth.ts'
import { MOCK_ACCOUNTS } from '../lib/mockQuery.ts'
import { useAuth } from '../lib/useAuth.ts'
import { ROLE_LABEL } from '../lib/format.ts'

export function LoginPage() {
  const session = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const expired = params.get('reason') === 'expired'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const [autoPending, setAutoPending] = useState(!isLogoutRedirect())

  useEffect(() => {
    if (!autoPending) return
    let cancelled = false
    void (async () => {
      try {
        const signed = await signInDemo(MOCK_ACCOUNTS[0].email)
        if (cancelled) return
        navigate(next ?? homePath(signed.role), { replace: true })
      } catch {
        if (!cancelled) setAutoPending(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [autoPending, navigate, next])

  if (session) {
    return <Navigate to={next ?? homePath(session.role)} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const signed = await signIn(email, password)
      navigate(next ?? homePath(signed.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login">
      <div className="login-main">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-mark">T</span>
            <span>
              <span className="brand-name">T-ARCH</span>
              <span className="brand-sub">감시 · 헤드엔드는 현장에</span>
            </span>
          </div>
          <h1>로그인</h1>
          <p className="login-lede">
            {autoPending
              ? '목업으로 들어가는 중입니다.'
              : expired
                ? '세션이 만료되었습니다. 역할을 고르면 바로 들어갑니다.'
                : '목업입니다. 비밀번호는 확인하지 않습니다.'}
          </p>
          <form onSubmit={onSubmit}>
            <label>
              이메일
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
              />
            </label>
            {error ? <p className="login-error" role="alert">{error}</p> : null}
            <button className="login-submit" type="submit" disabled={pending || autoPending}>
              {pending || autoPending ? '들어가는 중' : '로그인'}
            </button>
          </form>
          <div className="login-accounts">
            <p className="kpi-meta">목업. 역할을 누르면 바로 들어갑니다.</p>
            {MOCK_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="login-account"
                disabled={pending || autoPending}
                onClick={() => {
                  void (async () => {
                    setPending(true)
                    setError('')
                    try {
                      const signed = await signInDemo(account.email)
                      navigate(next ?? homePath(signed.role), { replace: true })
                    } catch (err) {
                      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
                    } finally {
                      setPending(false)
                    }
                  })()
                }}
              >
                <span>
                  <strong>{ROLE_LABEL[account.role]} · {account.name}</strong>
                  <span className="kpi-meta">{account.email} · {account.note}</span>
                </span>
                <span className="kpi-meta">들어가기</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <LoginPreview />
    </div>
  )
}
