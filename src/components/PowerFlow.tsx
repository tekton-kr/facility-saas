import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SiteDef } from '../types/domain.ts'
import { listPoints } from '../lib/catalog.ts'
import { formatDateTime } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import { layerOf, peekSiteTags, refreshLatest, refreshSensors, type SensorLatest, type SiteSensor, type TagLayer } from '../lib/siteTags.ts'
import { useScope } from '../lib/useScope.ts'

const SONGDO_PHOTO = '/img/sample/songdo_ait_center_002_3725457f57.webp'

function buildingPhoto(site: SiteDef): string | undefined {
  if (site.photo) return site.photo
  const name = site.name.replace(/\s/g, '').toLowerCase()
  if (name.includes('송도ait')) return SONGDO_PHOTO
  return undefined
}

const LAYERS: { id: TagLayer; label: string }[] = [
  { id: 'plant', label: '기계' },
  { id: 'power', label: '전력' },
  { id: 'meter', label: '계량' },
  { id: 'light', label: '조명' },
  { id: 'fire', label: '소방' },
]

const SERVICES: { id: string; label: string; row: 'top' | 'bottom'; path: string; layer: TagLayer | 'rest' }[] = [
  { id: 'events', label: '기계설비', row: 'top', path: 'apps/events', layer: 'plant' },
  { id: 'power', label: '전력', row: 'top', path: 'apps/power', layer: 'power' },
  { id: 'light', label: '조명', row: 'top', path: 'domains/light', layer: 'light' },
  { id: 'metering', label: '원격검침', row: 'top', path: 'apps/metering', layer: 'meter' },
  { id: 'ehp', label: 'EHP', row: 'top', path: 'domains/ehp', layer: 'plant' },
  { id: 'fire', label: '소방', row: 'bottom', path: 'domains/fire', layer: 'fire' },
  { id: 'elevator', label: '엘리베이터', row: 'bottom', path: 'domains/elevator', layer: 'rest' },
  { id: 'ev', label: '전기차충전기', row: 'bottom', path: 'apps/ev', layer: 'power' },
  { id: 'parking', label: '주차운영', row: 'bottom', path: 'apps/parking', layer: 'rest' },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value)
}

function deskSearch(search: string): string {
  return search.replace(/(^\?|&)view=[^&]*/g, '').replace(/^\?&/, '?').replace(/\?$/, '')
}

function serviceHref(siteId: string, path: string, search: string): string {
  const query = deskSearch(search)
  if (path.startsWith('domains/')) return `/sites/${siteId}/${path}${query}`
  return `/${path}/sites/${siteId}${query}`
}

function NodeIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true">
      {id === 'events' ? <path d="M8 16h48M8 32h48M20 16v16M44 16v16" /> : null}
      {id === 'power' ? <path d="M34 6 18 26h12l-2 16 18-24H34l2-12Z" /> : null}
      {id === 'light' ? <path d="M32 8a12 12 0 0 1 5 22.4V36H27v-5.6A12 12 0 0 1 32 8ZM28 40h8M30 44h4" /> : null}
      {id === 'metering' ? <path d="M10 40h44M16 40V20M32 40V12M48 40V26" /> : null}
      {id === 'ehp' ? <path d="M32 8v6M32 34v6M14 16l5 3M45 29l5 3M14 32l5-3M45 19l5-3M32 18a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" /> : null}
      {id === 'fire' ? <path d="M32 6s12 10 12 18a12 12 0 0 1-24 0c0-4 4-6 4-10 4 2 8 4 8 8 0-6 0-12 0-16Z" /> : null}
      {id === 'elevator' ? <path d="M18 42V8h28v34M18 22h28M32 14l-4 5h8l-4-5ZM32 34l4-5h-8l4 5Z" /> : null}
      {id === 'ev' ? <path d="M10 30h32l-2-10H16L10 30Zm4 0v4m18-4v4M32 14h8l2 6" /> : null}
      {id === 'parking' ? <path d="M18 42V8h16a10 10 0 0 1 0 20H18" /> : null}
    </svg>
  )
}

function SelectedTags({
  label,
  href,
  tags,
  latest,
  rest,
}: {
  label: string
  href: string
  tags: SiteSensor[]
  latest: Map<string, SensorLatest>
  rest: boolean
}) {
  const received = tags.filter((item) => latest.get(item.id)?.value != null)
  const missing = tags.length - received.length
  return (
    <>
      <header>
        <h2>{label}</h2>
        <Link to={href}>이 화면으로</Link>
      </header>
      {rest ? <p>이 시설은 태그 구분에 없습니다.</p> : null}
      {!rest && tags.length === 0 ? <p>이 층에 받은 태그가 없습니다.</p> : null}
      {tags.length > 0 ? <p>{received.length} 수신 · {missing} 수신 없음</p> : null}
      <ul>
        {[...received, ...tags.filter((item) => latest.get(item.id)?.value == null)].map((item) => {
          const reading = latest.get(item.id)
          const value = reading?.value
          return (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {value == null ? '수신 없음' : `${formatValue(value)}${item.unit ? ` ${item.unit}` : ''}`}
                {value != null ? <em>{formatDateTime(reading?.at ?? null)}</em> : null}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Node({
  id,
  label,
  value,
  count,
  selected,
  onSelect,
}: {
  id: string
  label: string
  value: string
  count: number
  selected: boolean
  onSelect: () => void
}): ReactNode {
  return (
    <button type="button" className={`flow-node${selected ? ' is-on' : ''}`} onClick={onSelect}>
      <NodeIcon id={id} />
      <p>
        <b className={value === '수신 없음' ? 'is-empty' : ''}>{value}</b>
      </p>
      <em>{count}개 태그</em>
      <strong>{label}</strong>
    </button>
  )
}

export function PowerFlow({ site }: { site: SiteDef }) {
  const { search } = useScope()
  const [layers, setLayers] = useState<TagLayer[]>(LAYERS.map((item) => item.id))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const knownTags = peekSiteTags(site.id)
  const [sensors, setSensors] = useState<SiteSensor[]>(() => knownTags?.sensors ?? [])
  const [latest, setLatest] = useState<Map<string, SensorLatest>>(() => knownTags?.latest ?? new Map())
  const [tagError, setTagError] = useState('')
  const visible = SERVICES.filter((item) => item.layer === 'rest' || layers.includes(item.layer))
  const top = visible.filter((item) => item.row === 'top')
  const bottom = visible.filter((item) => item.row === 'bottom')
  const selected = SERVICES.find((item) => item.id === selectedId) ?? null
  const photo = buildingPhoto(site)

  useEffect(() => {
    let cancelled = false
    const known = peekSiteTags(site.id)
    if (known) {
      setSensors(known.sensors)
      setLatest(known.latest)
    }
    async function loadList() {
      try {
        const list = await refreshSensors(site.id)
        if (cancelled) return
        setSensors(list)
        setTagError('')
      } catch (err) {
        if (!cancelled && (peekSiteTags(site.id)?.sensors.length ?? 0) === 0) {
          setTagError(err instanceof Error ? err.message : '태그 목록을 받지 못했습니다.')
        }
      }
    }
    async function loadValues() {
      try {
        const values = await refreshLatest(site.id)
        if (!cancelled) setLatest(values)
      } catch {
        /* 최근 값이 늦어도 시설 이름은 남겨 둔다. */
      }
    }
    void loadList()
    void loadValues()
    const timer = window.setInterval(() => void loadValues(), 30_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [site.id])

  function toggleLayer(id: TagLayer) {
    setLayers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    if (selected && selected.layer === id && layers.includes(id)) setSelectedId(null)
  }

  function tagsFor(layer: TagLayer | 'rest'): SiteSensor[] {
    if (layer === 'rest') return []
    return sensors.filter((item) => layerOf(item) === layer)
  }
  const points = listPoints({ siteId: site.id })
  const live = points.filter((row) => {
    const tel = getTelemetry(row, 'live')
    return tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
  })

  return (
    <div className="cmd flow">
      <header className="cmd-head">
        <div>
          <p>{site.name}</p>
          <h1>종합관제</h1>
        </div>
        <p>{site.location || '이 건물'} · 관제점 {points.length} · 수신 {live.length} · 수신 없음 {points.length - live.length}</p>
      </header>
      <section className="building-card" aria-label="건물 정보">
        <div className="building-photo">
          {photo ? <img src={photo} alt={site.name} /> : (
            <svg viewBox="0 0 80 64" aria-hidden="true">
              <path d="M8 56V28L40 8l32 20v28H8Z" />
              <path d="M32 56V36h16v20" />
            </svg>
          )}
        </div>
        <dl>
          <div><dt>주소</dt><dd>{site.location || '미등록'}</dd></div>
          <div><dt>준공일</dt><dd>{site.built || '미등록'}</dd></div>
          <div><dt>연면적</dt><dd>{site.areaM2 ? `${site.areaM2.toLocaleString('ko-KR')} m²` : '미등록'}</dd></div>
          <div><dt>건물주</dt><dd>{site.owner || '미등록'}</dd></div>
          <div><dt>연락처</dt><dd>{site.phone || '미등록'}</dd></div>
          <div><dt>관리</dt><dd>{site.manager || '미등록'}</dd></div>
          <div><dt>상태</dt><dd>{live.length > 0 ? '수신 중' : '수신 대기'}</dd></div>
        </dl>
      </section>
      <div className="flow-layers" role="group" aria-label="관제 층">
        {LAYERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={layers.includes(item.id) ? 'is-on' : ''}
            aria-pressed={layers.includes(item.id)}
            onClick={() => toggleLayer(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tagError ? <p className="manage-note">{tagError}</p> : null}
      <div className="flow-stage">
        <section className="flow-board" aria-label="시설 관제">
          <div className="flow-row is-top">
            {top.map((item) => {
              const tags = item.layer === 'rest' ? [] : tagsFor(item.layer)
              const received = tags.filter((tag) => latest.get(tag.id)?.value != null).length
              return (
                <Node
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  value={tags.length === 0 ? '수신 없음' : `${received} 수신`}
                  count={tags.length}
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              )
            })}
          </div>
          <svg className="flow-wires" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
            <path d="M100 0v28M300 0v28M500 0v28M700 0v28M900 0v28M100 28h800M160 62v28M380 62v28M620 62v28M840 62v28M160 62h680" />
          </svg>
          <div className="flow-row is-bottom">
            {bottom.map((item) => {
              const tags = item.layer === 'rest' ? [] : tagsFor(item.layer)
              const received = tags.filter((tag) => latest.get(tag.id)?.value != null).length
              return (
                <Node
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  value={tags.length === 0 ? '수신 없음' : `${received} 수신`}
                  count={tags.length}
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              )
            })}
          </div>
        </section>
        <aside className="flow-panel" aria-label="선택한 시설">
          {selected ? (
            <SelectedTags
              label={selected.label}
              href={serviceHref(site.id, selected.path, search)}
              tags={selected.layer === 'rest' ? [] : tagsFor(selected.layer)}
              latest={latest}
              rest={selected.layer === 'rest'}
            />
          ) : (
            <p>시설을 고르면 최근 값이 열립니다.</p>
          )}
        </aside>
      </div>
      <section className="cmd-panel flow-points" aria-label="관제점">
        <h2>관제점</h2>
        {points.length === 0 ? <div className="empty">이 건물에 등록된 관제점이 없습니다.</div> : (
          <ul>
            {points.map((row) => {
              const tel = getTelemetry(row, 'live')
              const hasValue = tel.current != null && tel.certainty !== 'unknown' && tel.certainty !== 'estimate'
              const href = `/apps/events/sites/${site.id}/systems/${row.system.id}/equipment/${row.equipment.id}/points/${row.point.id}${search}`
              return (
                <li key={`${row.system.id}-${row.equipment.id}-${row.point.id}`}>
                  <div>
                    <strong>{row.point.name}</strong>
                    <em>{row.equipment.name} · {row.system.name}</em>
                  </div>
                  <Link to={href}>
                    {hasValue ? `${formatValue(tel.current as number)} ${row.point.unit}` : '수신 없음'}
                    <span>{hasValue ? formatDateTime(tel.receivedAt) : '값 없음'}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
