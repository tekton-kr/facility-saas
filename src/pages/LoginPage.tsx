import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginPreview } from '../components/LoginPreview.tsx'
import { fetchAccounts, type AuthAccount } from '../lib/api.ts'
import { homePath, isLogoutRedirect, safeNext, signIn, signInDemo } from '../lib/auth.ts'
import { useAuth } from '../lib/useAuth.ts'
import { ROLE_LABEL } from '../lib/format.ts'

const AUTO_LOGIN = import.meta.env.DEV
  ? String(import.meta.env.VITE_AUTO_LOGIN ?? '').trim()
  : ''

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
  const [accounts, setAccounts] = useState<AuthAccount[]>([])
  const [accountsError, setAccountsError] = useState('')

  const [autoPending, setAutoPending] = useState(AUTO_LOGIN !== '' && !isLogoutRedirect())

  useEffect(() => {
    fetchAccounts()
      .then((list) => {
        setAccounts(list)
        setAccountsError('')
      })
      .catch((err: unknown) => {
        setAccounts([])
        setAccountsError(err instanceof Error ? err.message : '조회 API에 연결하지 못했습니다.')
      })
  }, [])

  useEffect(() => {
    if (!autoPending) return
    let cancelled = false
    void (async () => {
      try {
        const signed = await signInDemo(AUTO_LOGIN)
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
      if (!signed) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }
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
              ? '개발 자동 로그인으로 들어가는 중입니다.'
              : expired
                ? '세션이 만료되었습니다. 다시 로그인하십시오.'
                : '조회 전용입니다. 설비 제어·스케줄 변경은 없습니다.'}
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
              {pending || autoPending ? '조회 API 연결 중' : '로그인'}
            </button>
          </form>
          <div className="login-accounts">
            {accountsError
              ? <p className="login-error" role="alert">{accountsError}</p>
              : accounts.length === 0
                ? <p className="kpi-meta">데모 계정이 없습니다. 이메일과 비밀번호로 들어가십시오.</p>
                : <p className="kpi-meta">조회 전용 데모. 계정을 누르면 바로 들어갑니다.</p>}
            {accounts.map((account) => (
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
