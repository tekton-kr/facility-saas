import { useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSession } from './auth.ts'
import { APP_IDS, getSite, siteHasApp } from './catalog.ts'
import { dutySiteId } from './roleHome.ts'
import { alarmsForScope } from './telemetry.ts'
import { visibleSiteIds } from './siteScope.ts'
import type { AlarmKind, AlarmSeverity, AppId, Role, TimeRange } from '../types/domain.ts'

const RANGES: TimeRange[] = ['live', '1h', 'today', '24h', '7d', '30d']
const SEVERITIES: AlarmSeverity[] = ['critical', 'warning', 'info']
const KINDS: AlarmKind[] = ['fire', 'intrusion', 'equipment', 'data-quality']

function parseRange(value: string | null): TimeRange {
  return RANGES.find((item) => item === value) ?? '24h'
}

function parseSeverity(value: string | null): AlarmSeverity | '' {
  return SEVERITIES.find((item) => item === value) ?? ''
}

function parseKind(value: string | null): AlarmKind | '' {
  return KINDS.find((item) => item === value) ?? ''
}

function parseApp(value: string | undefined): AppId {
  return APP_IDS.find((item) => item === value) ?? 'events'
}

function parseRole(value: string | null): Role {
  return value === 'exec' ? 'exec' : 'ops'
}

const VIEWS = ['peak', 'eui', 'pr', 'gaps', 'compare', 'history', 'plan', 'cameras', 'connectors', 'sites', 'roles', 'licenses', 'unknown'] as const
type ScreenView = (typeof VIEWS)[number] | ''

function parseView(value: string | null): ScreenView {
  return VIEWS.find((item) => item === value) ?? ''
}

export function useScope() {
  const navigate = useNavigate()
  const location = useLocation()
  const { app: appParam, siteId, systemId, equipmentId, pointId } = useParams()
  const [params, setParams] = useSearchParams()
  const app = parseApp(appParam)

  const range = parseRange(params.get('range'))
  const query = params.get('q') ?? ''
  const eventId = params.get('event') ?? ''
  const severity = parseSeverity(params.get('sev'))
  const kind = parseKind(params.get('kind'))
  const session = getSession()
  const role = session?.role ?? parseRole(params.get('role'))
  const command = session?.entry === 'command'
  const view = parseView(params.get('view'))
  const palette = params.get('palette') === '1'

  const search = useMemo(() => {
    const next = new URLSearchParams()
    if (range !== '24h') next.set('range', range)
    if (query) next.set('q', query)
    if (eventId) next.set('event', eventId)
    if (severity) next.set('sev', severity)
    if (kind) next.set('kind', kind)
    if (role !== 'ops') next.set('role', role)
    if (view) next.set('view', view)
    const text = next.toString()
    return text ? `?${text}` : ''
  }, [eventId, kind, query, range, role, severity, view])

  function patchParams(next: {
    range?: TimeRange
    q?: string
    event?: string | null
    sev?: AlarmSeverity | ''
    kind?: AlarmKind | ''
    role?: Role
    view?: ScreenView
  }) {
    const copy = new URLSearchParams(params)
    if (next.range !== undefined) {
      if (next.range === '24h') copy.delete('range')
      else copy.set('range', next.range)
    }
    if (next.q !== undefined) {
      if (!next.q) copy.delete('q')
      else copy.set('q', next.q)
    }
    if (next.event !== undefined) {
      if (!next.event) copy.delete('event')
      else copy.set('event', next.event)
    }
    if (next.sev !== undefined) {
      if (!next.sev) copy.delete('sev')
      else copy.set('sev', next.sev)
    }
    if (next.kind !== undefined) {
      if (!next.kind) copy.delete('kind')
      else copy.set('kind', next.kind)
    }
    if (next.role !== undefined) {
      if (next.role === 'ops') copy.delete('role')
      else copy.set('role', next.role)
    }
    if (next.view !== undefined) {
      if (!next.view) copy.delete('view')
      else copy.set('view', next.view)
    }
    setParams(copy, { replace: true })
  }

  function goApp(nextApp: AppId) {
    const assigned = visibleSiteIds()
    if (command) {
      if (nextApp === 'events' && !siteId) {
        navigate(`/apps/events${search}`)
        return
      }
      if (siteId) {
        navigate(`/apps/${nextApp}/sites/${siteId}${search}`)
        return
      }
      navigate(`/apps/${nextApp}/sites/${dutySiteId(nextApp)}${search}`)
      return
    }
    if (role === 'ops') {
      const current = getSite(siteId)
      const site = current && siteHasApp(current, nextApp) ? current.id : dutySiteId(nextApp)
      navigate(`/apps/${nextApp}/sites/${site}${search}`)
      return
    }
    if (assigned.length === 1) {
      navigate(`/apps/${nextApp}/sites/${assigned[0]}${search}`)
      return
    }
    navigate(siteId ? `/apps/${nextApp}/sites/${siteId}${search}` : `/apps/${nextApp}${search}`)
  }

  function goSite(nextSiteId: string) {
    const path = location.pathname
    if (path.startsWith('/sites/') && path.endsWith('/contract')) {
      navigate(`/sites/${nextSiteId}/contract${search}`)
      return
    }
    if (path.startsWith('/sites/') && path.endsWith('/work')) {
      navigate(`/sites/${nextSiteId}/work${search}`)
      return
    }
    if (path === '/work' || path.startsWith('/work/')) {
      navigate(`/sites/${nextSiteId}/work${search}`)
      return
    }
    if (path.startsWith('/packages')) {
      navigate(`/packages${search}`)
      return
    }
    navigate(`/apps/${app}/sites/${nextSiteId}${search}`)
  }

  function goSystem(nextSiteId: string, nextSystemId: string) {
    if (role === 'exec') {
      navigate(`/apps/${app}/sites/${nextSiteId}${search}`)
      return
    }
    navigate(`/apps/${app}/sites/${nextSiteId}/systems/${nextSystemId}${search}`)
  }

  function goEquipment(nextSiteId: string, nextSystemId: string, nextEquipmentId: string) {
    if (role === 'exec') {
      navigate(`/apps/${app}/sites/${nextSiteId}${search}`)
      return
    }
    navigate(`/apps/${app}/sites/${nextSiteId}/systems/${nextSystemId}/equipment/${nextEquipmentId}${search}`)
  }

  function goPoint(nextSiteId: string, nextSystemId: string, nextEquipmentId: string, nextPointId: string) {
    if (role === 'exec') {
      navigate(`/apps/${app}/sites/${nextSiteId}${search}`)
      return
    }
    navigate(`/apps/${app}/sites/${nextSiteId}/systems/${nextSystemId}/equipment/${nextEquipmentId}/points/${nextPointId}${search}`)
  }

  function goHome() {
    if (role === 'exec' || command) {
      navigate(`/apps/${app}${search}`)
      return
    }
    navigate(`/apps/${app}/sites/${dutySiteId(app)}${search}`)
  }

  function goRole(next: Role) {
    if (session) return
    const copy = new URLSearchParams(params)
    copy.delete('event')
    if (next === 'ops') copy.delete('role')
    else copy.set('role', 'exec')
    const text = copy.toString()
    const suffix = text ? `?${text}` : ''
    if (next === 'exec') navigate(`/apps/events${suffix}`)
    else navigate(`/apps/events/sites/${dutySiteId('events')}${suffix}`)
  }

  function eventHref(id: string, atSiteId?: string) {
    const target = atSiteId ?? siteId
    const kept = new URLSearchParams(params)
    kept.delete('event')
    const keptText = kept.toString()
    const keptSuffix = keptText ? `?${keptText}` : ''
    if (role === 'exec') {
      return target ? `/apps/${app}/sites/${target}${keptSuffix}` : `/apps/${app}${keptSuffix}`
    }
    const alarm = alarmsForScope({ siteId: target || atSiteId }).find((item) => item.id === id)
    if (alarm?.systemId && alarm.equipmentId && target) {
      const place = alarm.pointId
        ? `/apps/${app}/sites/${alarm.siteId}/systems/${alarm.systemId}/equipment/${alarm.equipmentId}/points/${alarm.pointId}`
        : `/apps/${app}/sites/${alarm.siteId}/systems/${alarm.systemId}/equipment/${alarm.equipmentId}`
      return `${place}${keptSuffix}`
    }
    const next = new URLSearchParams(params)
    next.set('event', id)
    const text = next.toString()
    const suffix = text ? `?${text}` : ''
    return target ? `/apps/events/sites/${target}${suffix}` : `/apps/events${suffix}`
  }

  return {
    app,
    siteId,
    systemId,
    equipmentId,
    pointId,
    range,
    query,
    eventId,
    severity,
    kind,
    role,
    command,
    view,
    palette,
    search,
    patchParams,
    goApp,
    goSite,
    goSystem,
    goEquipment,
    goPoint,
    goHome,
    goRole,
    eventHref,
  }
}

export const RANGE_OPTIONS = RANGES
export const SEVERITY_OPTIONS = SEVERITIES
export const KIND_OPTIONS = KINDS
