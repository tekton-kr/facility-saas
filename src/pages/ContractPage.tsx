import { Link, Navigate } from 'react-router-dom'
import { contractForSite, daysUntil, getVendor, siteLabel } from '../lib/field.ts'
import { dutySiteId } from '../lib/roleHome.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

const SCOPE_LABEL: Record<string, string> = {
  hvac: '공조',
  power: '전력',
  fire: '소방',
  security: '침입',
  metering: '검침',
}

export function ContractPage() {
  const { siteId, search, role } = useScope()
  useField()
  const resolved = siteId ?? (role === 'ops' ? dutySiteId('events') : undefined)

  if (!resolved) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>유지보수 계약</h1>
            <p>현장을 고르면 기간·SLA·법정 점검이 열립니다.</p>
          </div>
        </div>
        <div className="empty">포트폴리오에서는 트리를 눌러 현장 계약을 엽니다.</div>
      </>
    )
  }

  if (!siteId && role === 'ops') {
    return <Navigate to={`/sites/${resolved}/contract${search}`} replace />
  }

  const contract = contractForSite(resolved)
  const vendor = getVendor(contract?.vendorId)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>유지보수 계약 · {siteLabel(resolved)}</h1>
          <p>계약이 현장관리의 권한입니다. 설비 제어는 없습니다.</p>
        </div>
      </div>
      {!contract ? (
        <div className="empty">이 현장 계약이 없습니다. 설정에서 현장을 추가하면 계약 한 줄이 생깁니다.</div>
      ) : (
        <>
          <section className="panel">
            <h2>기간 · SLA</h2>
            <p>
              {contract.start} ~ {contract.end}
              <span className="kpi-meta"> · 만료 {daysUntil(contract.end)}일</span>
            </p>
            <p className="kpi-meta">
              범위 {contract.scope.map((item) => SCOPE_LABEL[item] ?? item).join(' · ')}
              {vendor ? ` · ${vendor.name}` : ''}
            </p>
            <p className="kpi-meta">위험 {contract.slaCriticalMin}분 · 주의 {contract.slaWarningMin}분</p>
            <p>
              <Link className="drawer-open" to={`/work${search}`}>이 현장 작업</Link>
            </p>
          </section>
          <section className="deck">
            <h2>법정 점검</h2>
            <div className="list">
              {contract.statutory.map((item) => (
                <div key={item.id} className="list-item">
                  <span>
                    <strong>{item.name}</strong>
                    <div className="kpi-meta">{item.due}</div>
                  </span>
                  <span className={`badge${item.status === 'done' ? ' is-info' : ' is-warning'}`}>
                    {item.status === 'done' ? '완료' : '예정'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
