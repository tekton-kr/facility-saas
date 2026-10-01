import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { packagesForScope, siteLabel } from '../lib/field.ts'
import {
  cyclesFor,
  drawingsFor,
  inspectionsFor,
  notesFor,
  visitsFor,
} from '../lib/maintain.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

function SampleTag() {
  return <span className="sample-tag">예시</span>
}

function SiteChoices({ title, path }: { title: string; path: string }) {
  const { search } = useScope()
  const sites = visibleSites()
  return (
    <ManageFrame kicker="" title={title}>
      <p className="manage-note">건물을 고르면 그 현장 기록이 열립니다.</p>
      <section className="manage-card">
        {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
          <div className="manage-list">
            {sites.map((site) => (
              <Link key={site.id} className="manage-row" to={`/sites/${site.id}/${path}${search}`}>
                <span>
                  <strong>{site.name}</strong>
                  <em>{site.location || '위치 미등록'}</em>
                </span>
                <b>열기</b>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ManageFrame>
  )
}

function usePlace() {
  const { siteId } = useParams()
  const site = siteId ? getSite(siteId) : undefined
  return { siteId, site, place: site?.name ?? '이 현장' }
}

export function InspectionsPage() {
  const { siteId, site } = usePlace()
  if (!siteId) return <SiteChoices title="설비 점검" path="inspections" />
  if (!site) return <ManageFrame kicker="점검" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const rows = inspectionsFor(site.id)
  return (
    <ManageFrame kicker="" title="설비 점검">
      <p className="manage-note">다음에 손볼 점검입니다. 예시 표시는 아직 서버 점검 기록이 아닙니다.</p>
      <section className="manage-card">
        <div className="manage-list">
          {rows.map((item) => (
            <div key={item.id} className="manage-row">
              <span>
                <strong>{item.equipment}{item.sample ? <SampleTag /> : null}</strong>
                <em>{item.owner} · {item.result}</em>
              </span>
              <b>{item.due}</b>
            </div>
          ))}
        </div>
      </section>
    </ManageFrame>
  )
}

export function CyclesPage() {
  const { siteId, site } = usePlace()
  if (!siteId) return <SiteChoices title="세척·교체 주기" path="cycles" />
  if (!site) return <ManageFrame kicker="주기" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const rows = cyclesFor(site.id)
  return (
    <ManageFrame kicker="" title="세척·교체 주기">
      <p className="manage-note">기한이 가까운 것부터입니다.</p>
      <section className="manage-card">
        <div className="manage-list">
          {rows.map((item) => (
            <div key={item.id} className="manage-row">
              <span>
                <strong>{item.equipment} · {item.kind}<SampleTag /></strong>
                <em>{item.every} · 마지막 {item.last}</em>
              </span>
              <b>다음 {item.next}</b>
            </div>
          ))}
        </div>
      </section>
    </ManageFrame>
  )
}

export function PhotosPage() {
  const { siteId, site } = usePlace()
  if (!siteId) return <SiteChoices title="사진·설명" path="photos" />
  if (!site) return <ManageFrame kicker="사진" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const rows = notesFor(site.id)
  return (
    <ManageFrame kicker="" title="사진·설명">
      <p className="manage-note">설비마다 어디 있고 어떻게 생겼는지 적습니다. 사진은 아직 서버에 없습니다.</p>
      <div className="photo-grid">
        {rows.map((item) => (
          <article key={item.id} className="manage-card photo-card">
            <div className="photo-placeholder">사진 <SampleTag /></div>
            <h2>{item.equipment}</h2>
            <p className="manage-note">{item.caption}</p>
          </article>
        ))}
      </div>
    </ManageFrame>
  )
}

export function DrawingsPage() {
  const { siteId, site } = usePlace()
  const rows = siteId ? drawingsFor(siteId) : []
  const [open, setOpen] = useState<string | undefined>(rows[0]?.id)
  if (!siteId) return <SiteChoices title="준공 도면" path="drawings" />
  if (!site) return <ManageFrame kicker="도면" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const picked = rows.find((item) => item.id === open) ?? rows[0]
  return (
    <ManageFrame kicker="" title="준공 도면">
      <p className="manage-note">원본 도면 파일은 아직 없습니다. 아래 그림은 배치 예시입니다.</p>
      <div className="drawing-layout">
        <section className="manage-card">
          <h2>도면</h2>
          <div className="manage-list">
            {rows.map((item) => (
              <button key={item.id} className={`manage-row${item.id === picked?.id ? ' is-on' : ''}`} type="button" onClick={() => setOpen(item.id)}>
                <span>
                  <strong>{item.name}<SampleTag /></strong>
                  <em>{item.equipment} · {item.kind}</em>
                </span>
              </button>
            ))}
          </div>
        </section>
        {picked ? <DrawingSheet name={picked.name} kind={picked.kind} /> : null}
      </div>
    </ManageFrame>
  )
}

function DrawingSheet({ name, kind }: { name: string; kind: string }) {
  return (
    <section className="manage-card drawing-sheet" aria-label={name}>
      <h2>{name}<SampleTag /></h2>
      <p className="manage-note">{kind}. 격자 위의 선은 예시이고, 현장 준공도와 같지 않습니다.</p>
      <svg viewBox="0 0 640 360" className="drawing-plan" role="img" aria-label={`${name} 예시`}>
        <rect x="24" y="24" width="592" height="312" className="drawing-frame" />
        {Array.from({ length: 8 }, (_, index) => (
          <line key={`v-${index}`} x1={24 + index * 84} y1="24" x2={24 + index * 84} y2="336" className="drawing-grid" />
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <line key={`h-${index}`} x1="24" y1={24 + index * 78} x2="616" y2={24 + index * 78} className="drawing-grid" />
        ))}
        {kind === '계통도' ? (
          <>
            <line x1="80" y1="70" x2="560" y2="70" className="drawing-power" />
            <line x1="140" y1="70" x2="140" y2="250" className="drawing-power" />
            <line x1="280" y1="70" x2="280" y2="250" className="drawing-power" />
            <line x1="420" y1="70" x2="420" y2="250" className="drawing-power" />
            <rect x="112" y="240" width="56" height="36" className="drawing-symbol" />
            <rect x="252" y="240" width="56" height="36" className="drawing-symbol" />
            <rect x="392" y="240" width="56" height="36" className="drawing-symbol" />
            <text x="118" y="262">수전</text>
            <text x="258" y="262">분전</text>
            <text x="398" y="262">부하</text>
          </>
        ) : kind === '준공도' && name.includes('소화') ? (
          <>
            <rect x="70" y="60" width="500" height="240" className="drawing-room" />
            <line x1="70" y1="120" x2="570" y2="120" className="drawing-pipe" />
            <line x1="70" y1="200" x2="570" y2="200" className="drawing-pipe" />
            <circle cx="160" cy="120" r="8" className="drawing-head" />
            <circle cx="300" cy="120" r="8" className="drawing-head" />
            <circle cx="440" cy="120" r="8" className="drawing-head" />
            <circle cx="220" cy="200" r="8" className="drawing-head" />
            <circle cx="380" cy="200" r="8" className="drawing-head" />
            <text x="84" y="96">소화 배관</text>
          </>
        ) : (
          <>
            <rect x="60" y="56" width="220" height="140" className="drawing-room" />
            <rect x="300" y="56" width="250" height="140" className="drawing-room" />
            <rect x="60" y="214" width="490" height="90" className="drawing-room" />
            <text x="78" y="92">기계실</text>
            <text x="318" y="92">공조실</text>
            <text x="78" y="250">복도</text>
            <rect x="150" y="120" width="48" height="32" className="drawing-symbol" />
            <rect x="390" y="120" width="48" height="32" className="drawing-symbol" />
          </>
        )}
      </svg>
    </section>
  )
}

export function SchedulePage() {
  const { siteId, site } = usePlace()
  useField()
  if (!siteId) return <SiteChoices title="일정" path="schedule" />
  if (!site) return <ManageFrame kicker="일정" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const rows = visitsFor(site.id)
  const packaged = packagesForScope(site.id).map((item) => ({
    id: item.id,
    title: item.title,
    vendor: siteLabel(item.siteId),
    equipment: item.note,
    date: '일정 미정',
    sample: false as const,
  }))
  const works = [
    ...rows.filter((item) => item.kind === '공사'),
    ...packaged,
  ]
  const visits = rows.filter((item) => item.kind === '방문')
  return (
    <ManageFrame kicker="" title="공사·방문 일정">
      <p className="manage-note">누가 오는지, 어떤 설비를 손보는지입니다.</p>
      <section className="manage-card">
        <h2>공사 일정</h2>
        <ScheduleList rows={works} />
      </section>
      <section className="manage-card">
        <h2>업체 방문</h2>
        <ScheduleList rows={visits} />
      </section>
    </ManageFrame>
  )
}

function ScheduleList({ rows }: { rows: { id: string; title: string; vendor: string; equipment: string; date: string; sample?: boolean }[] }) {
  if (rows.length === 0) return <div className="empty">일정이 없습니다.</div>
  return (
    <div className="manage-list">
      {rows.map((item) => (
        <div key={item.id} className="manage-row">
          <span>
            <strong>{item.title}{item.sample === false ? null : <SampleTag />}</strong>
            <em>{item.vendor} · {item.equipment}</em>
          </span>
          <b>{item.date}</b>
        </div>
      ))}
    </div>
  )
}
