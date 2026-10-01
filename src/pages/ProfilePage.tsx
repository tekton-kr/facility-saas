import { Link } from 'react-router-dom'
import { homePath, loginAccount, personName, type Session } from '../lib/auth.ts'
import { formatDateTime } from '../lib/format.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useAuth } from '../lib/useAuth.ts'

function roleText(session: Session): string {
  if (session.entry === 'command') return '통합관제'
  if (session.role === 'exec') return '관리단 · 건물주'
  if (session.entry === 'staff' || session.entry === 'station') return '관리소장 · 시설직원'
  return '관리소장 · 시설직원'
}

export function ProfilePage() {
  const session = useAuth()
  if (!session) return null
  const dark = session.role === 'exec' || session.entry === 'command'
  const sites = visibleSites()
  const name = personName(session)
  const account = loginAccount(session)

  return (
    <div className={dark ? 'cmd profile' : 'profile'}>
      <header className="cmd-head">
        <div>
          <p>계정</p>
          <h1>프로필</h1>
        </div>
        <Link to={homePath(session)}>시설관리로</Link>
      </header>
      <section className="profile-card">
        <dl>
          <dt>이름</dt>
          <dd>{name || '서버에 등록된 이름이 없습니다.'}</dd>
          <dt>{session.role === 'exec' || session.entry === 'command' ? '이메일' : '휴대폰'}</dt>
          <dd>{account || '계정 없음'}</dd>
          <dt>역할</dt>
          <dd>{roleText(session)}</dd>
          <dt>로그인 유지</dt>
          <dd>{session.expiresAt ? formatDateTime(session.expiresAt) : '이번 로그인 동안'}</dd>
        </dl>
      </section>
      <section className="profile-card">
        <h2>배정 건물</h2>
        {sites.length === 0 ? <p>배정된 건물이 없습니다.</p> : (
          <ul>
            {sites.map((site) => (
              <li key={site.id}>
                <strong>{site.name}</strong>
                <span>{site.location || '위치 미등록'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="profile-links">
        <Link to="/guide">이용방법</Link>
        <Link to="/terms">이용약관</Link>
        <Link to="/privacy">개인정보처리방침</Link>
      </p>
    </div>
  )
}
