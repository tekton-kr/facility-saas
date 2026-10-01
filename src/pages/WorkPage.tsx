import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { WorkQueue } from '../components/WorkQueue.tsx'
import { getSite } from '../lib/catalog.ts'
import {
  addWorkProof,
  advanceWork,
  getVendor,
  isSlaOpen,
  nextWorkStatus,
  setWorkNote,
  siteLabel,
  workById,
} from '../lib/field.ts'
import { formatDateTime, WORK_KIND_LABEL, WORK_STATUS_LABEL } from '../lib/format.ts'
import { useCompact } from '../lib/media.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'
import type { WorkOrder } from '../types/domain.ts'

const STATUSES = ['received', 'dispatch', 'on-site', 'done'] as const

export function WorkPage() {
  const { workId } = useParams()
  const { siteId, search } = useScope()
  useField()
  const work = workById(workId)

  if (workId && !work) {
    return (
      <ManageFrame kicker="작업" title="작업을 찾지 못했습니다">
        <p className="manage-note"><Link to={`/work${search}`}>목록으로</Link></p>
      </ManageFrame>
    )
  }

  if (!work) {
    const place = siteId ? (getSite(siteId)?.name ?? '이 현장') : '전체 현장'
    return (
      <ManageFrame kicker={place} title="작업 내역">
        <p className="manage-note">열린 작업과 끝난 이력을 같이 봅니다.</p>
        <section className="manage-card">
          <WorkQueue siteId={siteId} />
        </section>
      </ManageFrame>
    )
  }

  return (
    <ManageFrame kicker="작업" title={work.title}>
      <WorkDetail work={work} />
    </ManageFrame>
  )
}

function WorkDetail({ work }: { work: WorkOrder }) {
  const compact = useCompact()
  const { search, role } = useScope()
  useField()
  const [note, setNote] = useState(work.note)
  const [proof, setProof] = useState('')
  const late = isSlaOpen(work)
  const next = nextWorkStatus(work.status)
  const vendor = getVendor(work.vendorId)

  function onProof(event: FormEvent) {
    event.preventDefault()
    addWorkProof(work.id, proof)
    setProof('')
  }

  return (
    <>
      <p className="crumbs">
        <Link to={`/work${search}`}>목록</Link>
        <span> / {work.id}</span>
      </p>
      <p className="manage-note">
        {siteLabel(work.siteId)} · {WORK_KIND_LABEL[work.kind]}
        {vendor ? ` · ${vendor.name}` : ''}
        {late ? ' · 기한 지남' : ''}
      </p>

      <ol className="work-steps">
        {STATUSES.map((status) => (
          <li key={status} className={work.status === status ? 'is-current' : ''}>
            {WORK_STATUS_LABEL[status]}
          </li>
        ))}
      </ol>

      <section className="panel">
        <h2>출동</h2>
        <p className="kpi-meta">기한 {formatDateTime(work.slaDueAt)} · 도착 {formatDateTime(work.arrivedAt)}</p>
        {work.alarmId ? (
          <p>
            <Link
              className="drawer-open"
              to={`/apps/events/sites/${work.siteId}${search}${search ? '&' : '?'}event=${work.alarmId}`}
            >
              원인 알람
            </Link>
          </p>
        ) : null}
        {work.systemId && work.equipmentId && work.pointId && role === 'ops' ? (
          <p>
            <Link
              className="drawer-open"
              to={`/apps/events/sites/${work.siteId}/systems/${work.systemId}/equipment/${work.equipmentId}/points/${work.pointId}${search}`}
            >
              관련 관제점 (조회)
            </Link>
          </p>
        ) : null}
        {next ? (
          <button className="login-submit field-action" type="button" onClick={() => advanceWork(work.id)}>
            {next === 'dispatch' ? '출동' : next === 'on-site' ? '도착' : '완료'}
          </button>
        ) : (
          <p className="manage-note">이 작업은 완료되었습니다.</p>
        )}
      </section>

      <section className="panel">
        <h2>증빙</h2>
        <p className="manage-note">방문 내용을 짧게 남깁니다.</p>
        {work.proofs.length === 0 ? <p className="kpi-meta">증빙 없음</p> : (
          <div className="proof-grid">
            {work.proofs.map((item) => (
              <div key={item} className="proof-tile">{item}</div>
            ))}
          </div>
        )}
        <form className="field-form" onSubmit={onProof}>
          <input
            aria-label="증빙"
            placeholder="전기실 명판"
            value={proof}
            onChange={(event) => setProof(event.target.value)}
          />
          <button className="sheet-back" type="submit">증빙 추가</button>
        </form>
      </section>

      <section className="panel">
        <h2>메모</h2>
        <textarea
          className="field-note"
          rows={compact ? 3 : 4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => setWorkNote(work.id, note)}
        />
        <p className="manage-note">입력칸에서 벗어나면 이 브라우저에 저장됩니다.</p>
      </section>
    </>
  )
}
