import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { loginAccount, personName } from '../lib/auth.ts'
import { getSite } from '../lib/catalog.ts'
import { OSS_LICENSES } from '../data/licenses.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { THEMES, readTheme, writeTheme, type ThemeId } from '../lib/theme.ts'
import { useAuth } from '../lib/useAuth.ts'

function roleText(role: string, entry: string | undefined): string {
  if (entry === 'command') return '통합관제'
  if (role === 'exec') return '관리단 · 건물주'
  return '관리소장 · 시설직원'
}

export function SettingsPage() {
  const session = useAuth()
  const sites = visibleSites()
  const [theme, setTheme] = useState<ThemeId>(readTheme)
  if (!session) return null
  const name = personName(session)
  const account = loginAccount(session)

  return (
    <ManageFrame kicker="계정" title="설정">
      <section className="manage-card">
        <h2>계정</h2>
        <dl className="manage-dl">
          <div>
            <dt>이름</dt>
            <dd>{name || '서버에 등록된 이름이 없습니다.'}</dd>
          </div>
          <div>
            <dt>{session.role === 'exec' || session.entry === 'command' ? '이메일' : '휴대폰'}</dt>
            <dd>{account || '계정 없음'}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{roleText(session.role, session.entry)}</dd>
          </div>
        </dl>
      </section>
      <section className="manage-card">
        <h2>색감</h2>
        <p className="manage-note">고른 색은 이 브라우저에 남습니다. 하늘이 기본입니다.</p>
        <div className="theme-picker" role="group" aria-label="색감">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={theme === item.id ? 'is-on' : ''}
              aria-pressed={theme === item.id}
              onClick={() => {
                setTheme(item.id)
                writeTheme(item.id)
              }}
            >
              <i style={{ background: item.swatch }} />
              {item.label}
            </button>
          ))}
        </div>
      </section>
      <section className="manage-card">
        <h2>배정 건물</h2>
        {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
          <div className="manage-list">
            {sites.map((site) => (
              <div key={site.id} className="manage-row">
                <span>
                  <strong>{site.name}</strong>
                  <em>{site.location || getSite(site.id)?.location || '위치 미등록'}</em>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="manage-card">
        <h2>문서</h2>
        <div className="manage-list">
          <Link className="manage-row" to="/guide"><span><strong>이용방법</strong><em>화면에서 하는 일</em></span></Link>
          <Link className="manage-row" to="/terms"><span><strong>이용약관</strong></span></Link>
          <Link className="manage-row" to="/privacy"><span><strong>개인정보처리방침</strong></span></Link>
        </div>
      </section>
      <section className="manage-card">
        <details className="oss-fold">
          <summary>오픈소스 {OSS_LICENSES.length}</summary>
          <div className="manage-list">
            {OSS_LICENSES.map((item) => (
              <div key={item.name} className="manage-row">
                <span>
                  <strong>{item.name}</strong>
                  <em>{item.note}</em>
                </span>
                <b>{item.license}</b>
              </div>
            ))}
          </div>
        </details>
      </section>
    </ManageFrame>
  )
}
