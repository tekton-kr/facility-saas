import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { CONTRACT_LINE_LABEL, contractEvidence, contractForSite, contractLines, daysUntil, getVendor } from '../lib/field.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

export function ContractPage() {
  const { siteId, search } = useScope()
  useField()
  const site = siteId ? getSite(siteId) : undefined

  if (!site) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="" title="유지보수">
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
                    <b>{contract ? (daysUntil(contract.end) < 0 ? '만료' : `만료 ${daysUntil(contract.end)}일`) : '보기'}</b>
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
    <ManageFrame kicker="" title="유지보수">
      <p className="manage-note">{site.location || '위치 미등록'}</p>
      {!contract ? (
        <div className="empty">이 건물에 등록된 유지보수 계약이 없습니다.</div>
      ) : (
        <>
          <section className="manage-card">
            <h2>기간</h2>
            <p className="manage-figure">{contract.start} ~ {contract.end}</p>
            <p className="manage-note">만료까지 {daysUntil(contract.end)}일{vendor ? ` · ${vendor.name}` : ''}</p>
            <p className="manage-note">위험 대응 {contract.slaCriticalMin}분 · 주의 대응 {contract.slaWarningMin}분</p>
          </section>
          <section className="manage-card">
            <h2>범위</h2>
            {contractLines(contract).length === 0 ? (
              <div className="empty">이 계약에 자동제어, 전력, 설비 전력량계 줄이 없습니다.</div>
            ) : (
              <div className="manage-list">
                {contractLines(contract).map((line) => (
                  <div key={line} className="manage-row">
                    <span><strong>{CONTRACT_LINE_LABEL[line]}</strong></span>
                    <b>포함</b>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="manage-card">
            <h2>수행 증거</h2>
            <p className="manage-note">계약 기간 안에 만들어진 작업만 이 계약의 수행입니다.</p>
            {contractEvidence(contract).length === 0 ? (
              <div className="empty">이 기간에 기록된 수행 증거가 없습니다.</div>
            ) : (
              <div className="manage-list">
                {contractEvidence(contract).map((work) => (
                  <Link key={work.id} className="manage-row" to={`/work/${work.id}${search}`}>
                    <span>
                      <strong>{work.title}</strong>
                      <em>{work.createdAt.slice(0, 10)}</em>
                    </span>
                    <b>작업</b>
                  </Link>
                ))}
              </div>
            )}
            <p><Link to={`/sites/${site.id}/work${search}`}>이 건물 작업</Link></p>
          </section>
        </>
      )}
    </ManageFrame>
  )
}
