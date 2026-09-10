import { useState, type FormEvent } from 'react'
import { SiteWizard } from '../components/SiteWizard.tsx'
import { connectorById, countPoints, getConnectors, getSites } from '../lib/catalog.ts'
import { addDirectoryAccount, addVendor } from '../lib/field.ts'
import { DIRECTORY_LABEL, KIND_LABEL } from '../lib/format.ts'
import { useField } from '../lib/useField.ts'
import { OSS_LICENSES } from '../data/licenses.ts'
import { useScope } from '../lib/useScope.ts'
import type { DirectoryRole } from '../types/domain.ts'

export function SettingsPage() {
  const { view } = useScope()
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
          <h1>설정</h1>
          <p>현장 추가 = 프리셋 + 커넥터 + 포인트. 화면 코드는 없습니다.</p>
        </div>
      </div>

      <section className="panel">
        <h2>현장 추가</h2>
        <SiteWizard />
      </section>

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

      <section className="panel">
        <h2>커넥터</h2>
        <div className="list">
          {getConnectors().map((item) => (
            <div key={item.id} className="list-item">
              <span>
                <strong>{item.name}</strong>
                <div className="kpi-meta">{item.protocol} · {item.id}</div>
              </span>
            </div>
          ))}
        </div>
      </section>

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

      {view === 'licenses' ? (
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
