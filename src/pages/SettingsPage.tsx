import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SiteWizard } from '../components/SiteWizard.tsx'
import { connectorById, countPoints, getConnectors, getSites } from '../lib/catalog.ts'
import { homePath } from '../lib/auth.ts'
import { addDirectoryAccount, addVendor } from '../lib/field.ts'
import { DIRECTORY_LABEL, KIND_LABEL } from '../lib/format.ts'
import { useField } from '../lib/useField.ts'
import { getScreens } from '../data/screens.ts'
import { OSS_LICENSES } from '../data/licenses.ts'
import { useScope } from '../lib/useScope.ts'
import type { DirectoryRole } from '../types/domain.ts'

const SECTIONS = ['connectors', 'sites', 'roles', 'licenses'] as const
type SettingsSection = (typeof SECTIONS)[number]

const SECTION_LABEL: Record<SettingsSection, string> = {
  connectors: '커넥터',
  sites: '현장 카탈로그',
  roles: '역할 범위',
  licenses: '오픈소스 라이선스',
}

const ROLE_SCOPE = [
  { role: 'ops' as const, note: '근무 현장 하나. 알람·관제점·도면·CCTV 링크.' },
  { role: 'exec' as const, note: '포트폴리오 전체. 예외 현장과 추정. 설비 면밀도·태그는 열지 않습니다.' },
]

export function SettingsPage() {
  const { view } = useScope()
  const focus = SECTIONS.find((item) => item === view)
  const shows = (section: SettingsSection) => !focus || focus === section
  const screens = getScreens()
  const field = useField()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<DirectoryRole>('ops')
  const [vendorName, setVendorName] = useState('')
  const [region, setRegion] = useState('')

  function onAccount(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    addDirectoryAccount({
      email: email.trim(),
      name: name.trim(),
      role,
      siteScope: role === 'exec' ? '포트폴리오' : role === 'vendor' ? '배정 작업만' : '근무 현장',
    })
    setName('')
    setEmail('')
  }

  function onVendor(event: FormEvent) {
    event.preventDefault()
    if (!vendorName.trim()) return
    addVendor({
      id: `v-${Date.now().toString(36).slice(-5)}`,
      name: vendorName.trim(),
      region: region.trim() || '미등록',
    })
    setVendorName('')
    setRegion('')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{focus ? `설정 · ${SECTION_LABEL[focus]}` : '설정'}</h1>
          <p>
            {focus
              ? '설정 홈에서 온 한 조각입니다. 값은 카탈로그에서 옵니다.'
              : '현장 추가 = 프리셋 + 커넥터 + 포인트. 화면 코드는 없습니다.'}
          </p>
        </div>
        {focus ? <Link className="filter-logout" to="/settings">설정 홈</Link> : null}
      </div>

      {focus ? null : (
        <section className="panel">
          <h2>현장 추가</h2>
          <SiteWizard />
        </section>
      )}

      {focus ? null : (
      <section className="panel">
        <h2>사용자</h2>
        <div className="list">
          {field.accounts.map((item) => (
            <div key={item.email} className="list-item">
              <span>
                <strong>{item.name}</strong>
                <div className="kpi-meta">{item.email} · {item.siteScope}</div>
              </span>
              <span className="badge">{DIRECTORY_LABEL[item.role]}</span>
            </div>
          ))}
        </div>
        <form className="field-form" onSubmit={onAccount}>
          <input aria-label="이름" placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
          <input aria-label="이메일" type="email" placeholder="이메일" value={email} onChange={(event) => setEmail(event.target.value)} />
          <select aria-label="역할" value={role} onChange={(event) => setRole(event.target.value as DirectoryRole)}>
            <option value="ops">운전자</option>
            <option value="exec">경영</option>
            <option value="vendor">협력사</option>
          </select>
          <button className="sheet-back" type="submit">추가</button>
        </form>
        <p className="kpi-note">협력사는 작업만 봅니다. 로그인 역할은 운전자·경영입니다.</p>
      </section>
      )}

      {focus ? null : (
      <section className="panel">
        <h2>협력사</h2>
        <div className="list">
          {field.vendors.map((item) => (
            <div key={item.id} className="list-item">
              <span>
                <strong>{item.name}</strong>
                <div className="kpi-meta">{item.region}</div>
              </span>
            </div>
          ))}
        </div>
        <form className="field-form" onSubmit={onVendor}>
          <input aria-label="협력사" placeholder="협력사 이름" value={vendorName} onChange={(event) => setVendorName(event.target.value)} />
          <input aria-label="권역" placeholder="권역" value={region} onChange={(event) => setRegion(event.target.value)} />
          <button className="sheet-back" type="submit">추가</button>
        </form>
      </section>
      )}

      {shows('connectors') ? (
      <section className="panel">
        <h2>커넥터</h2>
        <div className="list">
          {getConnectors().map((item) => (
            <div key={item.id} className="list-item">
              <span>
                <strong>{item.name}</strong>
                <div className="kpi-meta">{item.protocol} · {item.id}</div>
              </span>
              <span className="kpi-meta">
                {getSites().filter((site) => site.connectorIds.includes(item.id)).length}개 현장
              </span>
            </div>
          ))}
        </div>
        <p className="kpi-note">프로토콜은 커넥터가 흡수합니다. 화면은 벤더에 묶이지 않습니다.</p>
      </section>
      ) : null}

      {shows('sites') ? (
      <section className="panel">
        <h2>등록 현장</h2>
        <div className="list">
          {getSites().map((site) => (
            <div key={site.id} className="list-item">
              <span>
                <strong>{site.name}</strong>
                <div className="kpi-meta">
                  {KIND_LABEL[site.kind]} · 관제점 {countPoints(site)} ·{' '}
                  {site.connectorIds.map((id) => connectorById(id)?.protocol).join(', ')}
                </div>
              </span>
              <span className="kpi-meta">{site.areaM2 != null ? `${site.areaM2} m²` : '연면적 미등록'}</span>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {shows('roles') ? (
        <section className="panel">
          <h2>역할 범위</h2>
          <div className="list">
            {ROLE_SCOPE.map((item) => (
              <div key={item.role} className="list-item">
                <span>
                  <strong>{DIRECTORY_LABEL[item.role]}</strong>
                  <div className="kpi-meta">{item.note}</div>
                  <div className="kpi-meta mono-source">첫 화면 {homePath(item.role)}</div>
                </span>
                <span className="kpi-meta">
                  {screens.filter((screen) => screen.role === item.role || screen.role === 'any').length}면
                </span>
              </div>
            ))}
            <div className="list-item">
              <span>
                <strong>{DIRECTORY_LABEL.vendor}</strong>
                <div className="kpi-meta">배정 작업만 봅니다. 로그인 역할이 아닙니다.</div>
              </span>
              <span className="kpi-meta">—</span>
            </div>
          </div>
          <p className="kpi-note">두 역할 모두 조회 전용입니다. 어느 역할에도 설비 쓰기 경로가 없습니다.</p>
        </section>
      ) : null}

      {shows('licenses') ? (
        <section className="panel">
          <h2>오픈소스 라이선스</h2>
          <div className="list">
            {OSS_LICENSES.map((item) => (
              <div key={item.name} className="list-item">
                <span>
                  <strong>{item.name}</strong>
                  <div className="kpi-meta">{item.note}</div>
                </span>
                <span className="kpi-meta">{item.license}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
