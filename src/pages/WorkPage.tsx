import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WorkQueue } from '../components/WorkQueue.tsx'
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
  const { siteId, search, role } = useScope()
  useField()
  const work = workById(workId)

  if (workId && !work) {
    return (
      <div className="panel">
        <h1>작업 없음</h1>
        <p><Link to={`/work${search}`}>목록</Link></p>
      </div>
    )
  }

  if (!work) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{role === 'exec' ? '작업 · 포트폴리오' : '오늘 작업'}</h1>
            <p>알람이 출동이 됩니다. 설정값·기동정지는 없습니다.</p>
          </div>
        </div>
        <section className="deck">
          <h2>{siteId ? `${siteLabel(siteId)} 작업` : '열린 작업'}</h2>
          <WorkQueue siteId={role === 'ops' ? siteId : undefined} />
        </section>
      </>
    )
  }

  return <WorkDetail key={work.id} work={work} />
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
      <div className="page-head">
        <div>
          <p className="crumbs">
            <Link to={`/work${search}`}>작업</Link>
            <span> / {work.id}</span>
          </p>
          <h1>{work.title}</h1>
          <p>
            {siteLabel(work.siteId)} · {WORK_KIND_LABEL[work.kind]}
            {vendor ? ` · ${vendor.name}` : ''}
            {late ? ' · SLA 초과' : ''}
          </p>
        </div>
      </div>

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
          <p className="kpi-note">완료. 설비 쓰기는 없습니다.</p>
        )}
      </section>

      <section className="panel">
        <h2>증빙</h2>
        <p className="kpi-note">방문 사진 라벨만 남깁니다. CCTV 원본은 저장하지 않습니다.</p>
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
        <p className="kpi-meta">카카오는 이 메모를 전달하는 자리입니다. 설비 명령은 없습니다.</p>
      </section>
    </>
  )
}
