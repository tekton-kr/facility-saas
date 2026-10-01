import type { EquipmentDef, SiteDef, SystemDef } from '../types/domain.ts'
import { getTelemetry } from '../lib/telemetry.ts'

type Charger = {
  id: string
  name: string
  kind: '교류' | '직류'
  model: string
  place: string
  power: string
  energy: string
  voltA: string
  voltB: string
  voltC: string
  ampA: string
  ampB: string
  ampC: string
  soc: string
  sample: boolean
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

function readPoint(siteId: string, system: SystemDef, equipment: EquipmentDef, keys: string[]): string {
  const point = equipment.points.find((item) => {
    const hay = `${item.name} ${item.tags.join(' ')} ${item.unit}`.toLowerCase()
    return keys.some((key) => hay.includes(key))
  })
  if (!point) return '수신 없음'
  const tel = getTelemetry({ siteId, systemId: system.id, equipmentId: equipment.id, pointId: point.id }, 'live')
  if (tel.current == null || tel.certainty === 'unknown' || tel.certainty === 'estimate') return '수신 없음'
  return `${formatValue(tel.current)}${point.unit ? ` ${point.unit}` : ''}`
}

function kindOf(equipment: EquipmentDef): '교류' | '직류' {
  const hay = `${equipment.name} ${equipment.tags.join(' ')}`.toLowerCase()
  if (hay.includes('직류') || hay.includes('dc')) return '직류'
  return '교류'
}

function fromSite(site: SiteDef): Charger[] {
  return site.systems
    .filter((system) => system.domain === 'ev')
    .flatMap((system) => system.equipment.map((equipment) => ({
      id: `${system.id}-${equipment.id}`,
      name: equipment.name,
      kind: kindOf(equipment),
      model: equipment.model || '모델 미등록',
      place: system.wing || site.location || '위치 미등록',
      power: readPoint(site.id, system, equipment, ['충전 전력', '전력', 'kw']),
      energy: readPoint(site.id, system, equipment, ['충전량', 'kwh', '전력량']),
      voltA: readPoint(site.id, system, equipment, ['a상 전압', '전압 a']),
      voltB: readPoint(site.id, system, equipment, ['b상 전압', '전압 b']),
      voltC: readPoint(site.id, system, equipment, ['c상 전압', '전압 c']),
      ampA: readPoint(site.id, system, equipment, ['a상 전류', '전류 a']),
      ampB: readPoint(site.id, system, equipment, ['b상 전류', '전류 b']),
      ampC: readPoint(site.id, system, equipment, ['c상 전류', '전류 c']),
      soc: readPoint(site.id, system, equipment, ['soc', '잔량']),
      sample: false,
    })))
}

function samples(): Charger[] {
  const blank = {
    model: '모델 미등록',
    place: '위치 미등록',
    power: '수신 없음',
    energy: '수신 없음',
    voltA: '수신 없음',
    voltB: '수신 없음',
    voltC: '수신 없음',
    ampA: '수신 없음',
    ampB: '수신 없음',
    ampC: '수신 없음',
    soc: '수신 없음',
    sample: true as const,
  }
  return [
    { id: 'sample-ac-1', name: '교류 1', kind: '교류', ...blank },
    { id: 'sample-ac-2', name: '교류 2', kind: '교류', ...blank },
    { id: 'sample-dc-1', name: '직류 1', kind: '직류', ...blank },
  ]
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}</span>
      <b>{value}</b>
    </p>
  )
}

function ChargerArt({ kind }: { kind: '교류' | '직류' }) {
  const dc = kind === '직류'
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true">
      <rect x="8" y="118" width="204" height="18" rx="6" className="charge-ground" />
      {dc ? (
        <>
          <rect x="28" y="28" width="78" height="96" rx="8" className="charge-body" />
          <rect x="38" y="40" width="58" height="28" rx="4" className="charge-screen" />
          <circle cx="52" cy="84" r="4" className="charge-led" />
          <circle cx="66" cy="84" r="4" className="charge-led is-dim" />
          <path d="M106 70c16 0 18 18 28 18" className="charge-cable" />
          <path d="M106 92c18 2 20 22 32 18" className="charge-cable" />
          <rect x="132" y="58" width="12" height="22" rx="3" className="charge-plug" />
          <rect x="136" y="82" width="12" height="22" rx="3" className="charge-plug" />
          <path d="M156 96h46l-6 22H150l6-22Z" className="charge-car" />
          <circle cx="166" cy="120" r="5" className="charge-wheel" />
          <circle cx="192" cy="120" r="5" className="charge-wheel" />
        </>
      ) : (
        <>
          <rect x="46" y="36" width="46" height="86" rx="8" className="charge-body" />
          <rect x="54" y="46" width="30" height="18" rx="3" className="charge-screen" />
          <circle cx="69" cy="78" r="4" className="charge-led" />
          <path d="M92 78c14 0 16 16 26 14" className="charge-cable" />
          <rect x="116" y="68" width="10" height="20" rx="3" className="charge-plug" />
          <path d="M136 92h52l-7 24h-40l-5-24Z" className="charge-car" />
          <circle cx="148" cy="118" r="5" className="charge-wheel" />
          <circle cx="176" cy="118" r="5" className="charge-wheel" />
          <path d="M168 86h10" className="charge-cable" />
        </>
      )}
    </svg>
  )
}

export function ChargeBoard({ site }: { site?: SiteDef }) {
  const live = site ? fromSite(site) : []
  const chargers = live.length > 0 ? live : samples()
  const sample = live.length === 0
  const ac = chargers.filter((item) => item.kind === '교류').length
  const dc = chargers.filter((item) => item.kind === '직류').length

  return (
    <div className="cmd desk">
      <header className="cmd-head">
        <div>
          <p>{site?.name ?? '현장'}</p>
          <h1>전기차충전</h1>
        </div>
        <p>
          {site?.location || '이 건물'} · 교류 {ac} · 직류 {dc}
          {sample ? ' · 아래 배치는 예시입니다. 전력과 충전량은 수신 없음으로 둡니다.' : ' · 받은 값만 숫자로 둡니다.'}
        </p>
      </header>
      <div className="charge-all">
        {chargers.map((item) => (
          <section key={item.id} className="cmd-panel charge-main">
            <div className="charge-hero">
              <figure className="charge-art">
                <ChargerArt kind={item.kind} />
              </figure>
              <div>
                <h2>{item.name}{item.sample ? <span className="sample-tag">예시</span> : null}</h2>
                <Metric label="오늘 충전량" value={item.energy} />
                <Metric label="오늘 횟수" value="수신 없음" />
                <Metric label="오늘 시간" value="수신 없음" />
                <Metric label="모델" value={item.model} />
                <Metric label="위치" value={item.place} />
                <Metric label="단가" value="미등록" />
              </div>
            </div>
            <div className="charge-grid">
              <Metric label="A상 전압" value={item.voltA} />
              <Metric label="B상 전압" value={item.voltB} />
              <Metric label="C상 전압" value={item.voltC} />
              <Metric label="A상 전류" value={item.ampA} />
              <Metric label="B상 전류" value={item.ampB} />
              <Metric label="C상 전류" value={item.ampC} />
              <Metric label="충전량" value={item.energy} />
              <Metric label="SOC" value={item.soc} />
              <Metric label="실시간 전력" value={item.power} />
            </div>
            <p className="charge-log">충전 기록 수신 없음</p>
          </section>
        ))}
      </div>
    </div>
  )
}
