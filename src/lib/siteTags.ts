import { fetchSiteDashboard, fetchSiteSensors } from './api.ts'

export type SiteSensor = {
  id: string
  name: string
  category: string
  system: string
  unit: string
}

export type SensorLatest = {
  value: number | null
  at: string | null
}

const LIST_KEYS = ['sensors', 'items', 'data', 'rows', 'tags', 'list', 'result', 'content', 'records', 'readings']
const ID_KEYS = ['sensorId', 'sensor_id', 'id', 'tagId', 'tag_id', 'pointId', 'point_id']
const NAME_KEYS = ['name', 'tagName', 'tag_name', 'label', 'description', 'pointName', 'title']
const CATEGORY_KEYS = ['category', 'cat', 'group']
const SYSTEM_KEYS = ['system', 'systemName', 'system_name']
const UNIT_KEYS = ['unit', 'engUnit', 'eng_unit', 'uom']
const VALUE_KEYS = ['value', 'current', 'val', 'latestValue', 'latest_value', 'data']
const TIME_KEYS = ['time', 'timestamp', 'at', 'receivedAt', 'received_at', 'updatedAt', 'updated_at', 'ts']

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function textOf(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function numberOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function recordsOf(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.flatMap((item) => {
      const row = asRecord(item)
      return row ? [row] : []
    })
  }
  const bag = asRecord(body)
  if (!bag) return []
  for (const key of LIST_KEYS) {
    const value = bag[key]
    if (Array.isArray(value)) return recordsOf(value)
    const nested = asRecord(value)
    if (!nested) continue
    if (textOf(nested, ID_KEYS)) return [nested]
    for (const inner of LIST_KEYS) {
      if (Array.isArray(nested[inner])) return recordsOf(nested[inner])
    }
    return Object.entries(nested).flatMap(([id, item]) => {
      if (typeof item === 'number') return [{ id, value: item }]
      const row = asRecord(item)
      if (!row) return []
      return [{ id, ...row }]
    })
  }
  if (textOf(bag, ID_KEYS)) return [bag]
  return []
}

function readingOf(row: Record<string, unknown>): { value: number | null; at: string | null } {
  for (const key of ['latest', 'reading', 'last', 'current']) {
    const nested = asRecord(row[key])
    if (!nested) continue
    const value = numberOf(textOf(nested, VALUE_KEYS) || nested.value)
    if (value != null || textOf(nested, TIME_KEYS)) {
      return { value: numberOf(nested.value) ?? value, at: textOf(nested, TIME_KEYS) || null }
    }
  }
  let value: number | null = null
  for (const key of VALUE_KEYS) {
    value = numberOf(row[key])
    if (value != null) break
  }
  return { value, at: textOf(row, TIME_KEYS) || null }
}

export function readSensors(body: unknown): SiteSensor[] {
  const seen = new Set<string>()
  return recordsOf(body).flatMap((row) => {
    const id = textOf(row, ID_KEYS)
    if (!id || seen.has(id)) return []
    seen.add(id)
    const name = textOf(row, NAME_KEYS) || id
    return [{
      id,
      name,
      category: textOf(row, CATEGORY_KEYS).toUpperCase(),
      system: textOf(row, SYSTEM_KEYS),
      unit: textOf(row, UNIT_KEYS),
    }]
  })
}

export function readLatest(body: unknown): Map<string, SensorLatest> {
  const latest = new Map<string, SensorLatest>()
  for (const row of recordsOf(body)) {
    const id = textOf(row, ID_KEYS)
    if (!id) continue
    const reading = readingOf(row)
    latest.set(id, reading)
  }
  return latest
}

export type TagLayer = 'plant' | 'power' | 'meter' | 'light' | 'fire'

function isLightTag(hay: string): boolean {
  if (/조명|전등|점등|소등|디밍|릴레이/.test(hay)) return true
  if (hay.includes('LIGHT') || hay.includes('DALI') || hay.includes('LUX') || hay.includes('RELAY')) return true
  if (hay.includes('0-10') || hay.includes('0~10')) return true
  return /\d+_CH\d*\b/.test(hay) || /\bCH[_-]?\d+/.test(hay)
}

export function layerOf(sensor: SiteSensor): TagLayer | null {
  const category = sensor.category.toUpperCase()
  const hay = `${sensor.system} ${sensor.name}`.toUpperCase()
  if (category === 'METER') return 'meter'
  if (category === 'POWER') return 'power'
  if (hay.includes('소방') || hay.includes('FIRE')) return 'fire'
  if (isLightTag(hay)) return 'light'
  if (category === 'ZEB' || category === 'BEMS' || category === 'OTHER') return null
  if (hay.includes('HVAC') || category === 'BAS') return 'plant'
  return null
}

export function isMechanical(sensor: SiteSensor): boolean {
  return layerOf(sensor) === 'plant'
}

type TagBundle = {
  sensors: SiteSensor[]
  latest: Map<string, SensorLatest>
}

const bundles = new Map<string, TagBundle>()

export function peekSiteTags(siteId: string): TagBundle | undefined {
  return bundles.get(siteId)
}

function store(siteId: string, patch: Partial<TagBundle>) {
  const prev = bundles.get(siteId)
  bundles.set(siteId, {
    sensors: patch.sensors ?? prev?.sensors ?? [],
    latest: patch.latest ?? prev?.latest ?? new Map(),
  })
}

export async function refreshSensors(siteId: string): Promise<SiteSensor[]> {
  const sensors = readSensors(await fetchSiteSensors(siteId))
  store(siteId, { sensors })
  return sensors
}

export async function refreshLatest(siteId: string): Promise<Map<string, SensorLatest>> {
  const latest = readLatest(await fetchSiteDashboard(siteId))
  store(siteId, { latest })
  return latest
}

export async function loadSiteTags(siteId: string): Promise<TagBundle> {
  const [sensors, latest] = await Promise.all([
    refreshSensors(siteId),
    refreshLatest(siteId),
  ])
  return { sensors, latest }
}

export async function loadMechanicalTags(siteId: string): Promise<{ sensors: SiteSensor[]; latest: Map<string, SensorLatest> }> {
  const loaded = await loadSiteTags(siteId)
  return {
    sensors: loaded.sensors.filter(isMechanical),
    latest: loaded.latest,
  }
}
