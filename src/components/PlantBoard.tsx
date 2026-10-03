import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SiteDef } from '../types/domain.ts'
import { isMechanical, peekSiteTags, refreshLatest, refreshSensors, type SensorLatest, type SiteSensor } from '../lib/siteTags.ts'
import { PlantDetail } from './PlantDetail.tsx'

const PLANT_CATEGORIES = ['공조', '열원', '전력', '기타'] as const

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function plantCategory(sensor: SiteSensor): (typeof PLANT_CATEGORIES)[number] {
  const hay = `${sensor.name} ${sensor.system} ${sensor.category}`.toLowerCase()
  if (/냉동|냉각|냉수|보일러|chiller|\bchw\b/.test(hay)) return '열원'
  if (/공조|ahu|외기|급기|환기|실내|실온|fcu|\bpac\b/.test(hay)) return '공조'
  if (/acb|전력|계측|전압|전류|\bkw\b|kwh|kvar|\bpf\b/.test(hay)) return '전력'
  return '기타'
}

function equipmentKey(name: string): string {
  const paren = name.match(/\(([^)]+)\)/)
  if (paren?.[1].trim()) return paren[1].trim()
  const acb = name.match(/ACB[_-]?\d+/i)
  if (acb) return acb[0].toUpperCase().replace(/-/g, '_')
  const code = name.match(/\b(?:AHU|FCU|PAC|EHP)[_-]?\d+\b/i)
  if (code) return code[0].toUpperCase()
  return name.trim() || '기타'
}

function groupEquipment(sensors: SiteSensor[]) {
  const map = new Map<string, SiteSensor[]>()
  for (const sensor of sensors) {
    const key = equipmentKey(sensor.name)
    const list = map.get(key)
    if (list) list.push(sensor)
    else map.set(key, [sensor])
  }
  return [...map.entries()]
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })),
    }))
    .sort((a, b) => a.key.localeCompare(b.key, 'ko', { numeric: true }))
}

function groupByCategory(sensors: SiteSensor[]) {
  const buckets = new Map<string, SiteSensor[]>()
  for (const sensor of sensors) {
    const key = plantCategory(sensor)
    const list = buckets.get(key) ?? []
    list.push(sensor)
    buckets.set(key, list)
  }
  return PLANT_CATEGORIES.flatMap((category) => {
    const items = buckets.get(category)
    if (!items?.length) return []
    return [{ category, count: items.length, groups: groupEquipment(items) }]
  })
}

function systemLabel(sensor: SiteSensor): string {
  return `${sensor.system || '계통 없음'} · ${sensor.category || '구분 없음'}`
}

function TagCard({
  sensor,
  latest,
  onOpen,
}: {
  sensor: SiteSensor
  latest: Map<string, SensorLatest>
  onOpen: (id: string) => void
}) {
  const value = latest.get(sensor.id)?.value
  const received = value != null
  return (
    <button type="button" className={`plant-node${received ? '' : ' is-missing'}`} onClick={() => onOpen(sensor.id)}>
      <header>
        <strong>{sensor.name}</strong>
        <em>{received ? '수신' : '수신 없음'}</em>
      </header>
      <b>{received ? `${formatValue(value)}${sensor.unit ? ` ${sensor.unit}` : ''}` : '수신 없음'}</b>
      <span>{systemLabel(sensor)}</span>
    </button>
  )
}

export function PlantBoard({ site }: { site?: SiteDef }) {
  const [params, setParams] = useSearchParams()
  const tagId = params.get('tag') ?? ''
  const cached = site ? peekSiteTags(site.id) : undefined
  const [sensors, setSensors] = useState<SiteSensor[]>(() => cached?.sensors.filter(isMechanical) ?? [])
  const [latest, setLatest] = useState<Map<string, SensorLatest>>(() => cached?.latest ?? new Map())
  const [loading, setLoading] = useState(sensors.length === 0 && Boolean(site))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!site) return
    const siteId = site.id
    let cancelled = false
    const known = peekSiteTags(siteId)
    if (known) {
      setSensors(known.sensors.filter(isMechanical))
      setLatest(known.latest)
      setLoading(false)
    }
    async function loadList() {
      try {
        const list = await refreshSensors(siteId)
        if (cancelled) return
        setSensors(list.filter(isMechanical))
        setError('')
      } catch (err) {
        if (!cancelled && (peekSiteTags(siteId)?.sensors.length ?? 0) === 0) {
          setError(err instanceof Error ? err.message : '태그 목록을 받지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    async function loadValues() {
      try {
        const values = await refreshLatest(siteId)
        if (!cancelled) setLatest(values)
      } catch {
        /* 목록은 유지하고, 값은 수신 없음으로 남긴다. */
      }
    }
    void loadList()
    void loadValues()
    const timer = window.setInterval(() => void loadValues(), 30_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [site?.id])

  const categories = useMemo(() => groupByCategory(sensors), [sensors])
  const receivedCount = sensors.filter((item) => latest.get(item.id)?.value != null).length
  const airCount = sensors.filter((item) => plantCategory(item) === '공조').length
  const heatCount = sensors.filter((item) => plantCategory(item) === '열원').length
  const stats = [
    { label: '태그', value: sensors.length, empty: false },
    { label: '수신', value: receivedCount, empty: receivedCount === 0 },
    { label: '공조', value: airCount, empty: false },
    { label: '열원', value: heatCount, empty: false },
  ]
  const selected = tagId ? sensors.find((item) => item.id === tagId) : undefined
  const selectedKey = selected ? equipmentKey(selected.name) : ''
  const siblings = selected ? sensors.filter((item) => equipmentKey(item.name) === selectedKey) : []

  function openTag(id: string) {
    const next = new URLSearchParams(params)
    const opened = Boolean(params.get('tag'))
    next.set('tag', id)
    setParams(next, { replace: opened })
  }

  function closeTag() {
    const next = new URLSearchParams(params)
    next.delete('tag')
    setParams(next, { replace: true })
  }

  if (tagId) {
    return (
      <div className="cmd desk">
        <header className="cmd-head">
          <div>
            <button type="button" className="plant-back" onClick={closeTag}>← 기계설비</button>
            <h1>{selected ? selectedKey : '태그'}</h1>
          </div>
          <p>
            {site?.name ?? '현장'}
            {selected ? ` · ${selected.name}` : ''}
          </p>
        </header>
        {loading && !selected ? <div className="empty">태그를 찾는 중입니다.</div> : null}
        {!loading && !selected ? <div className="empty">이 태그를 찾지 못했습니다.</div> : null}
        {selected ? (
          <div className="plant-sheet">
            <PlantDetail
              equipment={selectedKey}
              sensor={selected}
              siblings={siblings}
              latest={latest}
              onSelect={openTag}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>기계설비</h1>
        </div>
        <p>
          {site?.location || '이 건물'}
          {' · HVAC이거나 BAS인 태그의 최근 값입니다.'}
        </p>
      </header>
      {sensors.length > 0 ? (
        <section className="plant-stats" aria-label="기계설비 수량">
          {stats.map((item) => (
            <article key={item.label} className={`plant-stat${item.empty ? ' is-empty' : ''}`}>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </article>
          ))}
        </section>
      ) : null}
      {loading ? <div className="empty">태그 목록을 받는 중입니다.</div> : null}
      {error ? <div className="empty">{error}</div> : null}
      {!loading && !error && sensors.length === 0 ? (
        <div className="empty">이 현장에 HVAC 계통이나 BAS 태그가 없습니다.</div>
      ) : null}
      {categories.map((section) => (
        <section key={section.category} className="plant-category" aria-label={section.category}>
          <h2>
            {section.category}
            <em>{section.count}</em>
          </h2>
          <div className="plant-folds">
            {section.groups.map((group) => {
              const got = group.items.filter((item) => latest.get(item.id)?.value != null).length
              return (
                <details key={group.key} className="plant-fold">
                  <summary>
                    <strong>{group.key}</strong>
                    <em>
                      {group.items.length}점
                      {got > 0 ? ` · 수신 ${got}` : ''}
                    </em>
                  </summary>
                  <div className="plant-cards">
                    {group.items.map((sensor) => (
                      <TagCard key={sensor.id} sensor={sensor} latest={latest} onOpen={openTag} />
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
