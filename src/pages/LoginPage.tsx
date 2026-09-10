import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginPreview } from '../components/LoginPreview.tsx'
import { homePath, safeNext, signInDemo } from '../lib/auth.ts'
import { getSite } from '../lib/catalog.ts'
import { MOCK_ACCOUNTS, type MockAccount } from '../lib/mockQuery.ts'
import { useAuth } from '../lib/useAuth.ts'
import { ROLE_LABEL } from '../lib/format.ts'

function scopeLabel(account: MockAccount): string {
  if (account.role === 'exec') return `포트폴리오 · ${account.siteIds.length}곳`
  const names = account.siteIds.map((id) => getSite(id)?.name ?? id)
  return names.join(' · ') || account.note
}

function enterLabel(account: MockAccount): string {
  return account.role === 'ops' ? '근무 시작' : '조회 시작'
}

export function LoginPage() {
  const session = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const expired = params.get('reason') === 'expired'
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')

  if (session) {
    return <Navigate to={next ?? homePath(session.role)} replace />
  }

  async function enter(account: MockAccount) {
    setPending(account.email)
    setError('')
    try {
      const signed = await signInDemo(account.email)
      navigate(next ?? homePath(signed.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '들어가지 못했습니다.')
      setPending('')
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
          <h1>들어가기</h1>
          <p className="login-lede">
            {expired
              ? '세션이 만료되었습니다. 현장과 역할을 다시 고르십시오.'
              : '조회 전용입니다. 현장과 역할을 고르면 들어갑니다. 설비 제어·스케줄 변경은 없습니다.'}
          </p>
          <div className="login-accounts">
            {MOCK_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="login-account"
                disabled={pending !== ''}
                onClick={() => {
                  void enter(account)
                }}
              >
                <span>
                  <strong>{ROLE_LABEL[account.role]} · {scopeLabel(account)}</strong>
                  <span className="kpi-meta">{account.name}</span>
                </span>
                <span className="kpi-meta">
                  {pending === account.email ? '들어가는 중' : enterLabel(account)}
                </span>
              </button>
            ))}
          </div>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <p className="login-key-note">계정 키는 초대 메일이지만, 접속은 현장과 역할입니다.</p>
        </div>
      </div>
      <LoginPreview />
    </div>
  )
}
