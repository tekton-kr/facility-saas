import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LoginFrame } from '../components/LoginFrame.tsx'
import type { LoginDoor } from '../components/LoginPreview.tsx'
import { acceptLogin, homePath, safeNext, signIn, signInCommand } from '../lib/auth.ts'
import { authFailure, loginWithPhone, requestLoginCode, requestPasswordReset, type LoginResult } from '../lib/api.ts'
import { formatPhone, normalizePhone } from '../lib/staffRoster.ts'
import { showToast } from '../lib/toast.ts'
import { useAuth } from '../lib/useAuth.ts'

const LOGIN_DOOR = 't-arch-login-door'

function readLoginDoor(): LoginDoor {
  try {
    return localStorage.getItem(LOGIN_DOOR) === 'exec' ? 'exec' : 'staff'
  } catch {
    return 'staff'
  }
}

function rememberLoginDoor(door: LoginDoor) {
  try {
    localStorage.setItem(LOGIN_DOOR, door)
  } catch {
    /* ignore */
  }
}

function loginFailure(err: unknown): string {
  return authFailure(err, '들어가지 못했습니다.')
}

export function LoginPage() {
  const session = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const expired = params.get('reason') === 'expired'
  const [door, setDoor] = useState<LoginDoor>(readLoginDoor)

  if (session?.mustChangePassword) {
    return <Navigate to="/login/password" replace />
  }

  if (session) {
    return <Navigate to={next ?? homePath(session)} replace />
  }

  return (
    <LoginFrame>
      <h1>들어가기</h1>
      <p className="login-lede">
        {expired
          ? '세션이 끝났습니다. 역할을 다시 고르십시오.'
          : '역할을 고르십시오.'}
      </p>
      <div className="login-doors" role="tablist" aria-label="들어가는 문">
        <button
          type="button"
          role="tab"
          aria-selected={door === 'exec'}
          className={door === 'exec' ? 'is-on' : undefined}
          onClick={() => {
            setDoor('exec')
            rememberLoginDoor('exec')
          }}
        >
          <RoleIcon kind="exec" />
          <span className="login-role-name">관리단 · 건물주</span>
          {door === 'exec' ? <RoleCheck /> : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={door === 'staff'}
          className={door === 'staff' ? 'is-on' : undefined}
          onClick={() => {
            setDoor('staff')
            rememberLoginDoor('staff')
          }}
        >
          <RoleIcon kind="staff" />
          <span className="login-role-name">관리소장 · 시설직원</span>
          {door === 'staff' ? <RoleCheck /> : null}
        </button>
      </div>
      {door === 'exec' ? <ExecDoor next={next} /> : <StaffDoor next={next} />}
    </LoginFrame>
  )
}

function RoleIcon({ kind }: { kind: LoginDoor }) {
  if (kind === 'exec') {
    return (
      <svg className="login-role-icon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5.5 13.5 16 5.5l10.5 8V26.5h-21z" />
        <path d="M13 26.5v-7h6v7" />
      </svg>
    )
  }
  return (
    <svg className="login-role-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="11" r="4.2" />
      <path d="M7.5 26.2c1.4-4.2 4.4-6.2 8.5-6.2s7.1 2 8.5 6.2" />
    </svg>
  )
}

function RoleCheck() {
  return (
    <span className="login-role-check" aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <path d="M3.2 8.2 6.4 11.2 12.8 4.6" />
      </svg>
    </span>
  )
}

const SAVED_EMAIL = 't-arch-saved-email'

function readSavedEmail(): string {
  try {
    return localStorage.getItem(SAVED_EMAIL) ?? ''
  } catch {
    return ''
  }
}

function ExecDoor({ next }: { next: string | null }) {
  const navigate = useNavigate()
  const saved = readSavedEmail()
  const [email, setEmail] = useState(saved)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(saved.length > 0)
  const [resetting, setResetting] = useState(false)
  const [issued, setIssued] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  function keepEmail() {
    try {
      if (remember) localStorage.setItem(SAVED_EMAIL, email.trim())
      else localStorage.removeItem(SAVED_EMAIL)
    } catch {
      /* ignore */
    }
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const signed = await signIn(email, password)
      keepEmail()
      if (!signed.mustChangePassword) showToast('로그인되었습니다.')
      navigate(signed.mustChangePassword ? '/login/password' : (next ?? homePath(signed)), { replace: true })
    } catch (err) {
      setError(loginFailure(err))
      setPending(false)
    }
  }

  async function onReset(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIssued('')
    try {
      setIssued(await requestPasswordReset(email.trim()))
    } catch (err) {
      setError(loginFailure(err))
    }
  }

  if (resetting) {
    return (
      <form onSubmit={onReset}>
        <p className="login-door-note">등록된 이메일로 임시 비밀번호를 받습니다.</p>
        <label>
          이메일
          <input
            type="email"
            autoComplete="username"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setIssued('')
            }}
          />
        </label>
        <button className="login-submit" type="submit">임시 비밀번호 받기</button>
        {issued ? <p className="login-key-note">{issued}</p> : null}
        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <p className="login-key-note">
          <button
            className="text-link"
            type="button"
            onClick={() => {
              setResetting(false)
              setError('')
            }}
          >
            로그인으로
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={onEmail}>
      <p className="login-door-note">배정된 이메일과 비밀번호로 들어옵니다. 한 번 들어가면 로그아웃할 때까지 유지됩니다.</p>
      <label>
        이메일
        <input
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <div className="login-assist">
        <label className="login-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          이메일 저장
        </label>
        <button className="text-link" type="button" onClick={() => { setResetting(true); setError(''); setIssued('') }}>
          비밀번호 찾기
        </button>
      </div>
      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? '여는 중' : '이메일 로그인'}
      </button>
      {error ? <p className="login-error" role="alert">{error}</p> : null}
    </form>
  )
}

export function DeskPage() {
  const session = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(meta)
    const previous = document.title
    document.title = '통합관제'
    return () => {
      meta.remove()
      document.title = previous
    }
  }, [])

  if (session?.mustChangePassword) {
    return <Navigate to="/login/password" replace />
  }

  if (session) {
    return <Navigate to={next ?? homePath(session)} replace />
  }

  return (
    <LoginFrame>
      <h1>통합관제</h1>
      <p className="login-lede">계약된 현장 전부를 봅니다. 이 문은 관리자 주소입니다.</p>
      <CommandDoor next={next} />
    </LoginFrame>
  )
}

function CommandDoor({ next }: { next: string | null }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onEmail(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const signed = await signInCommand(email, password)
      if (!signed.mustChangePassword) showToast('로그인되었습니다.')
      navigate(signed.mustChangePassword ? '/login/password' : (next ?? homePath(signed)), { replace: true })
    } catch (err) {
      setError(loginFailure(err))
      setPending(false)
    }
  }

  return (
    <form onSubmit={onEmail}>
      <p className="login-door-note">이벤트·알람 화면은 현장과 같습니다.</p>
      <label>
        이메일
        <input
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? '여는 중' : '통합관제 들어가기'}
      </button>
      {error ? <p className="login-error" role="alert">{error}</p> : null}
    </form>
  )
}

function StaffDoor({ next }: { next: string | null }) {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [waitUntil, setWaitUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [otp, setOtp] = useState('')
  const [account, setAccount] = useState<LoginResult | null>(null)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [pending, setPending] = useState(false)
  const verified = account !== null
  const waitLeft = Math.max(0, Math.ceil((waitUntil - now) / 1000))

  useEffect(() => {
    if (waitUntil <= Date.now()) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [waitUntil])

  async function requestCode() {
    setError('')
    setRequesting(true)
    try {
      await requestLoginCode(phone)
      setSent(true)
      setWaitUntil(Date.now() + 60_000)
      setNow(Date.now())
      setOtp('')
      setAccount(null)
    } catch (err) {
      setError(authFailure(err, '인증번호를 보내지 못했습니다.'))
    } finally {
      setRequesting(false)
    }
  }

  async function verify() {
    setError('')
    if (!sent || otp.length !== 6) return
    setChecking(true)
    try {
      setAccount(await loginWithPhone(phone, otp))
    } catch (err) {
      setAccount(null)
      setError(authFailure(err, '인증번호가 맞지 않습니다.'))
    } finally {
      setChecking(false)
    }
  }

  async function enter(event: FormEvent) {
    event.preventDefault()
    if (!account) {
      setError('인증번호를 먼저 확인하십시오.')
      return
    }
    setPending(true)
    setError('')
    try {
      const signed = await acceptLogin(account, { phone, entry: 'staff' })
      showToast('로그인되었습니다.')
      navigate(next ?? homePath(signed), { replace: true })
    } catch (err) {
      setError(authFailure(err, '들어가지 못했습니다.'))
      setPending(false)
    }
  }

  return (
    <form onSubmit={enter}>
      <p className="login-door-note">
        {verified && account
          ? `${account.name}. 인증되었습니다.`
          : '등록된 번호만 됩니다. 인증번호는 3분 동안 유효하고, 60초에 한 번 다시 받을 수 있습니다.'}
      </p>
      <label>
        휴대폰 번호
        <span className="login-code-row">
          <input
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-1234-5678"
            aria-label="휴대폰 번호"
            value={formatPhone(phone)}
            onChange={(event) => {
              setPhone(normalizePhone(event.target.value))
              setSent(false)
              setWaitUntil(0)
              setAccount(null)
              setOtp('')
            }}
          />
          <button className="login-verify" type="button" onClick={requestCode} disabled={requesting || waitLeft > 0}>
            {requesting ? '보내는 중' : waitLeft > 0 ? `다시 받기 ${waitLeft}` : sent ? '다시 받기' : '인증번호 받기'}
          </button>
        </span>
      </label>
      <label>
        인증번호
        <span className="login-code-row">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6자리"
            aria-label="인증번호"
            disabled={!sent}
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              setAccount(null)
            }}
          />
          <button className="login-verify" type="button" onClick={verify} disabled={!sent || otp.length !== 6 || verified || checking}>
            {verified ? '완료' : checking ? '확인 중' : '인증'}
          </button>
        </span>
      </label>
      {sent && !verified ? <p className="login-key-note">인증번호는 3분 동안 유효합니다.</p> : null}
      <button className="login-submit" type="submit" disabled={pending || !verified}>
        {pending ? '여는 중' : '로그인'}
      </button>
      {error ? <p className="login-error" role="alert">{error}</p> : null}
    </form>
  )
}
