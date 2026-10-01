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
  const [open, setOpen] = useState<string | undefined>(undefined)
  if (!siteId) return <SiteChoices title="준공 도면" path="drawings" />
  if (!site) return <ManageFrame kicker="도면" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  const rows = drawingsFor(site.id)
  const picked = rows.find((item) => item.id === open)
  return (
    <ManageFrame kicker="" title="준공 도면">
      <p className="manage-note">도면 파일은 서버에 올리지 않습니다. 이름과 구분만 보여 줍니다.</p>
      <section className="manage-card">
        <div className="manage-list">
          {rows.map((item) => (
            <button key={item.id} className="manage-row" type="button" onClick={() => setOpen(item.id)}>
              <span>
                <strong>{item.name}<SampleTag /></strong>
                <em>{item.equipment} · {item.kind}</em>
              </span>
              <b>보기</b>
            </button>
          ))}
        </div>
      </section>
      {picked ? (
        <section className="manage-card">
          <h2>{picked.name}</h2>
          <p className="manage-note">{picked.equipment} · {picked.kind}. 원본 파일은 이 화면에 없습니다.</p>
        </section>
      ) : null}
    </ManageFrame>
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
