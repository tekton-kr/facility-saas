import { Link, useParams } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { CertaintyBadge } from '../components/CertaintyBadge.tsx'
import { getSite } from '../lib/catalog.ts'
import { advancePackage, packageById, packagesForScope, siteLabel } from '../lib/field.ts'
import { formatNumber, PACKAGE_STATUS_LABEL } from '../lib/format.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

const NEXT_LABEL = {
  candidate: '견적 단계로',
  quoted: '시공 시작',
  'in-progress': '준공',
  done: '',
} as const

export function PackagesPage() {
  const { packageId } = useParams()
  const { siteId, search } = useScope()
  useField()
  const selected = packageById(packageId)
  const rows = packagesForScope(siteId)
  const place = siteId ? (getSite(siteId)?.name ?? '이 현장') : '전체 현장'

  if (packageId && !selected) {
    return (
      <ManageFrame kicker="개보수" title="항목을 찾지 못했습니다">
        <p className="manage-note"><Link to={`/packages${search}`}>목록으로</Link></p>
      </ManageFrame>
    )
  }

  if (selected) {
    return (
      <ManageFrame kicker={siteLabel(selected.siteId)} title={selected.title}>
        <p className="crumbs">
          <Link to={`/packages${search}`}>목록</Link>
          <span> / {PACKAGE_STATUS_LABEL[selected.status]}</span>
        </p>
        <section className="manage-card">
          <h2>진행</h2>
          <p className="manage-figure">
            {selected.estimateAmount != null ? `${formatNumber(selected.estimateAmount)}천원` : '금액 미정'}
          </p>
          <p className="manage-note"><CertaintyBadge certainty={selected.certainty} /> {selected.note}</p>
          {selected.status !== 'done' ? (
            <button className="login-submit field-action" type="button" onClick={() => advancePackage(selected.id)}>
              {NEXT_LABEL[selected.status]}
            </button>
          ) : (
            <p className="manage-note">준공된 항목입니다.</p>
          )}
        </section>
      </ManageFrame>
    )
  }

  return (
    <ManageFrame kicker={place} title="개보수">
      <p className="manage-note">손볼 후보입니다. 항목을 누르면 견적과 진행을 봅니다.</p>
      <section className="manage-card">
        {rows.length === 0 ? <div className="empty">이 범위에 개보수 후보가 없습니다.</div> : (
          <div className="manage-list">
            {rows.map((item) => (
              <Link key={item.id} className="manage-row" to={`/packages/${item.id}${search}`}>
                <span>
                  <strong>{item.title}</strong>
                  <em>{siteLabel(item.siteId)} · {item.note}</em>
                </span>
                <b>
                  {PACKAGE_STATUS_LABEL[item.status]}
                  {item.estimateAmount != null ? ` · ${formatNumber(item.estimateAmount)}천원` : ''}
                </b>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ManageFrame>
  )
}
