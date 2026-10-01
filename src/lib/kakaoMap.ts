export type MapPoint = {
  lat: number
  lng: number
}

export type MapPin = {
  id: string
  name: string
  location?: string
  lat?: number
  lng?: number
  to?: string
  attention?: boolean
  waiting?: boolean
}

function firstHit(rows: Array<{ x: string; y: string }> | undefined): MapPoint | null {
  const row = rows?.[0]
  if (!row) return null
  const lat = Number(row.y)
  const lng = Number(row.x)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function search(run: (callback: (rows: Array<{ x: string; y: string }>, status: string) => void) => void, ok: string) {
  return new Promise<MapPoint | null>((resolve) => {
    run((rows, status) => {
      resolve(status === ok ? firstHit(rows) : null)
    })
  })
}

export function loadKakao(): Promise<NonNullable<Window['kakao']>['maps']> {
  const ready = () => new Promise<NonNullable<Window['kakao']>['maps']>((resolve, reject) => {
    const maps = window.kakao?.maps
    if (!maps?.load) {
      reject(new Error('kakao'))
      return
    }
    maps.load(() => resolve(maps))
  })

  if (window.kakao?.maps?.load) return ready()

  const script = document.querySelector<HTMLScriptElement>('script[data-kakao-map]')
  if (!script) return Promise.reject(new Error('kakao'))

  const entry = performance.getEntriesByName(script.src)[0] as PerformanceResourceTiming | undefined
  if (entry && entry.responseEnd > 0) return Promise.reject(new Error('kakao'))

  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => { ready().then(resolve, reject) }, { once: true })
    script.addEventListener('error', () => reject(new Error('kakao')), { once: true })
  })
}

export async function locatePin(maps: NonNullable<Window['kakao']>['maps'], pin: MapPin): Promise<MapPoint | null> {
  if (pin.lat != null && pin.lng != null) return { lat: pin.lat, lng: pin.lng }
  const queries = [...new Set([pin.location?.trim(), pin.name.trim(), [pin.name, pin.location].filter(Boolean).join(' ').trim()].filter((item): item is string => Boolean(item)))]
  if (queries.length === 0) return null
  const geocoder = new maps.services.Geocoder()
  const places = new maps.services.Places()
  for (const query of queries) {
    const address = await search((callback) => geocoder.addressSearch(query, callback), maps.services.Status.OK)
    if (address) return address
    const keyword = await search((callback) => places.keywordSearch(query, callback), maps.services.Status.OK)
    if (keyword) return keyword
  }
  return null
}
