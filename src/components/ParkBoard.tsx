import { useEffect, useState } from 'react'
import type { SiteDef } from '../types/domain.ts'
import {
  peekSiteTags,
  refreshLatest,
  refreshSensors,
  type SensorLatest,
  type SiteSensor,
} from '../lib/siteTags.ts'

type Visit = {
  id: string
  plate: string
  at: string
  place: string
  direction: string
  kind: string
  unit: string
  sample: boolean
}

const SAMPLE: Visit[] = [
  { id: 'sample-in', plate: '00가0000', at: '수신 없음', place: '입구', direction: '입차', kind: '방문차량', unit: '', sample: true },
  { id: 'sample-out', plate: '00나0000', at: '수신 없음', place: '출구', direction: '출차', kind: '등록차량', unit: '101동 101호', sample: true },
]

const COUNTS = [
  { id: 'today-in', label: '당일 입차', keys: ['당일 입차', '금일 입차', '오늘 입차'] },
  { id: 'parked', label: '현재 주차', keys: ['현재 주차', '주차 대수', '재차'] },
  { id: 'prev-in', label: '전일 입차', keys: ['전일 입차', '어제 입차'] },
  { id: 'prev-out', label: '전일 출차', keys: ['전일 출차', '어제 출차'] },
]

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)
}

function countText(sensors: SiteSensor[], latest: Map<string, SensorLatest>, keys: string[]): string {
  const found = sensors.find((item) => {
    const hay = `${item.name} ${item.system}`.toLowerCase()
    return keys.some((key) => hay.includes(key.toLowerCase()))
  })
  const value = found ? latest.get(found.id)?.value : null
  if (value == null) return '수신 없음'
  return `${formatValue(value)}대`
}

export function ParkBoard({ site }: { site?: SiteDef }) {
  const cached = site ? peekSiteTags(site.id) : undefined
  const [sensors, setSensors] = useState<SiteSensor[]>(() => cached?.sensors ?? [])
  const [latest, setLatest] = useState<Map<string, SensorLatest>>(() => cached?.latest ?? new Map())
  const [picked, setPicked] = useState(SAMPLE[0].id)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!site) return
    const siteId = site.id
    let cancelled = false
    const known = peekSiteTags(siteId)
    if (known) {
      setSensors(known.sensors)
      setLatest(known.latest)
    }
    async function loadList() {
      try {
        const list = await refreshSensors(siteId)
        if (!cancelled) setSensors(list)
      } catch (err) {
        if (!cancelled && (peekSiteTags(siteId)?.sensors.length ?? 0) === 0) {
          setError(err instanceof Error ? err.message : '태그 목록을 받지 못했습니다.')
        }
      }
    }
    async function loadValues() {
      try {
        const values = await refreshLatest(siteId)
        if (!cancelled) setLatest(values)
      } catch {
        /* 표는 유지한다. */
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

  const rows = SAMPLE
  const selected = rows.find((item) => item.id === picked) ?? rows[0]

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>주차운영</h1>
        </div>
        <p>{site?.location || '이 건물'} · 입출차 대수만 받은 태그를 보여 줍니다. 차량별 기록과 번호판 사진은 아직 없습니다.</p>
      </header>
      {error ? <div className="empty">{error}</div> : null}
      <section className="park-counts" aria-label="입출차 대수">
        {COUNTS.map((item) => (
          <article key={item.id}>
            <span>{item.label}</span>
            <strong>{countText(sensors, latest, item.keys)}</strong>
          </article>
        ))}
      </section>
      <section className="park-stage">
        <div className="park-photos" aria-label="입출차 사진">
          <figure>
            <figcaption>입차</figcaption>
            <div>사진 없음</div>
          </figure>
          <figure>
            <figcaption>출차</figcaption>
            <div>사진 없음</div>
          </figure>
        </div>
        <div className="park-table-wrap">
          <table className="park-table">
            <caption>
              차량 출입 기록
              <span className="sample-tag sheet-sample">예시</span>
            </caption>
            <thead>
              <tr>
                <th>차량번호</th>
                <th>일시</th>
                <th>장소</th>
                <th>방향</th>
                <th>구분</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.id}
                  className={item.id === selected.id ? 'is-on' : ''}
                  onClick={() => setPicked(item.id)}
                >
                  <td>{item.plate}</td>
                  <td>{item.at}</td>
                  <td>{item.place}</td>
                  <td>{item.direction}</td>
                  <td>{item.kind}{item.unit ? ` · ${item.unit}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="manage-note">예시 행은 받은 출입 기록이 아닙니다.</p>
        </div>
      </section>
    </div>
  )
}
