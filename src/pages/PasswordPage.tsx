import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LoginFrame } from '../components/LoginFrame.tsx'
import { authFailure } from '../lib/api.ts'
import { finishPasswordChange, homePath, signOut } from '../lib/auth.ts'
import { passwordRule } from '../lib/passwordRule.ts'
import { showToast } from '../lib/toast.ts'
import { useAuth } from '../lib/useAuth.ts'

function changeFailure(err: unknown): string {
  return authFailure(err, '비밀번호를 바꾸지 못했습니다.')
}

export function PasswordPage() {
  const session = useAuth()
  const navigate = useNavigate()
  const [nextPassword, setNextPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const rule = passwordRule(nextPassword)
  const matched = confirm.length > 0 && nextPassword === confirm
  const ready = rule.ok && matched

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!session.mustChangePassword) {
    return <Navigate to={homePath(session)} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!passwordRule(nextPassword).ok) {
      setError('6자 이상, 영문·숫자·기호를 모두 넣으십시오.')
      return
    }
    if (nextPassword !== confirm) {
      setError('새 비밀번호가 서로 다릅니다.')
      return
    }
    setPending(true)
    setError('')
    try {
      const signed = await finishPasswordChange(nextPassword)
      showToast('로그인되었습니다.')
      navigate(homePath(signed), { replace: true })
    } catch (err) {
      setError(changeFailure(err))
      setPending(false)
    }
  }

  return (
    <LoginFrame>
      <h1>새 비밀번호</h1>
      <form onSubmit={onSubmit}>
        <p className="login-door-note">임시 비밀번호로는 여기까지입니다. 앞으로 쓸 비밀번호를 정하십시오.</p>
        <label>
          새 비밀번호
          <input
            type="password"
            autoComplete="new-password"
            aria-label="새 비밀번호"
            value={nextPassword}
            onChange={(event) => {
              setNextPassword(event.target.value)
              setError('')
            }}
          />
        </label>
        <ul className="login-rules" aria-label="비밀번호 조건">
          <li className={rule.length ? 'is-met' : undefined}>6자 이상</li>
          <li className={rule.letter ? 'is-met' : undefined}>영문 <span>a-z</span></li>
          <li className={rule.digit ? 'is-met' : undefined}>숫자 <span>0-9</span></li>
          <li className={rule.symbol ? 'is-met' : undefined}>기호 <span>!@#$</span></li>
        </ul>
        <label>
          새 비밀번호 확인
          <input
            type="password"
            autoComplete="new-password"
            aria-label="새 비밀번호 확인"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value)
              setError('')
            }}
          />
        </label>
        {confirm && nextPassword !== confirm ? <p className="login-error" role="alert">새 비밀번호가 서로 다릅니다.</p> : null}
        <button className="login-submit" type="submit" disabled={pending || !ready}>
          {pending ? '바꾸는 중' : '변경'}
        </button>
        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <p className="login-key-note">
          <button
            className="text-link"
            type="button"
            onClick={() => {
              signOut()
              navigate('/login', { replace: true })
            }}
          >
            로그인으로
          </button>
        </p>
      </form>
    </LoginFrame>
  )
}
