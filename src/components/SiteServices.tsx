import { Link } from 'react-router-dom'
import type { AppId, SystemDef } from '../types/domain.ts'
import { alarmsForScope } from '../lib/telemetry.ts'

export const OWNER_SERVICES: { id: 'events' | 'power' | 'metering' | 'solar'; label: string }[] = [
  { id: 'events', label: '기계설비' },
  { id: 'power', label: '전력' },
  { id: 'metering', label: '원격검침' },
  { id: 'solar', label: '제로에너지' },
]

type Tone = 'ok' | 'warn' | 'wait'

function covers(systems: SystemDef[], app: AppId): boolean {
  if (app === 'events') {
    return systems.some((item) => item.domain === 'events' || item.domain === 'hvac')
  }
  return systems.some((item) => item.domain === app)
}

export function serviceState(siteId: string, systems: SystemDef[], app: AppId): { tone: Tone; line: string; detail: string } {
  const alarms = alarmsForScope({ siteId, app }).filter((item) => item.severity === 'critical' || item.severity === 'warning')
  if (alarms.length > 0) {
    return { tone: 'warn', line: `이상 ${alarms.length}`, detail: alarms[0]?.title ?? '확인이 필요합니다' }
  }
  if (!covers(systems, app)) {
    return { tone: 'wait', line: '수신 대기', detail: '계측이 오면 채워집니다' }
  }
  return { tone: 'ok', line: '이상 없음', detail: '열린 위험·주의 없음' }
}

type Props = {
  siteId: string
  systems: SystemDef[]
  search: string
  current?: AppId
}

export function SiteServices({ siteId, systems, search, current }: Props) {
  return (
    <div className="dash-services">
      {OWNER_SERVICES.map((item) => {
        const state = serviceState(siteId, systems, item.id)
        return (
          <Link
            key={item.id}
            className={`dash-service is-${state.tone}${current === item.id ? ' is-on' : ''}`}
            to={`/apps/${item.id}/sites/${siteId}${search}`}
          >
            <strong>{item.label}</strong>
            <em>{state.line}</em>
            <span>{state.detail}</span>
          </Link>
        )
      })}
    </div>
  )
}
