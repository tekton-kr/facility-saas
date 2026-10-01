import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { contractForSite, daysUntil, getVendor } from '../lib/field.ts'
import { visibleSites } from '../lib/siteScope.ts'
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
  const { siteId, search } = useScope()
  useField()
  const site = siteId ? getSite(siteId) : undefined

  if (!site) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="전체 현장" title="계약">
        <p className="manage-note">건물을 고르면 그 현장의 유지보수 계약이 열립니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => {
                const contract = contractForSite(item.id)
                return (
                  <Link key={item.id} className="manage-row" to={`/sites/${item.id}/contract${search}`}>
                    <span>
                      <strong>{item.name}</strong>
                      <em>{contract ? `${contract.start} ~ ${contract.end}` : '등록된 계약 없음'}</em>
                    </span>
                    <b>{contract ? `만료 ${daysUntil(contract.end)}일` : '보기'}</b>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </ManageFrame>
    )
  }

  const contract = contractForSite(site.id)
  const vendor = getVendor(contract?.vendorId)

  return (
    <ManageFrame kicker={site.name} title="계약">
      <p className="manage-note">{site.location || '위치 미등록'}</p>
      {!contract ? (
        <div className="empty">이 건물에 등록된 유지보수 계약이 없습니다.</div>
      ) : (
        <>
          <section className="manage-card">
            <h2>기간</h2>
            <p className="manage-figure">{contract.start} ~ {contract.end}</p>
            <p className="manage-note">만료까지 {daysUntil(contract.end)}일{vendor ? ` · ${vendor.name}` : ''}</p>
            <p className="manage-note">
              범위 {contract.scope.map((item) => SCOPE_LABEL[item] ?? item).join(' · ')}
            </p>
            <p className="manage-note">위험 대응 {contract.slaCriticalMin}분 · 주의 대응 {contract.slaWarningMin}분</p>
            <p><Link to={siteId ? `/sites/${site.id}/work${search}` : `/work${search}`}>이 건물 작업</Link></p>
          </section>
          <section className="manage-card">
            <h2>법정 점검</h2>
            <div className="manage-list">
              {contract.statutory.map((item) => (
                <div key={item.id} className="manage-row">
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.due}</em>
                  </span>
                  <b>{item.status === 'done' ? '완료' : '예정'}</b>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </ManageFrame>
  )
}
