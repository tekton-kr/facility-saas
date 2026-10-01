import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadKakao, locatePin, type MapPin } from '../lib/kakaoMap.ts'

type Props = {
  sites: MapPin[]
}

type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

function statusText(pin: MapPin): string {
  const status = pin.attention ? '이상' : pin.waiting ? '수신 대기' : '이상 없음'
  if (pin.sample) return `${status} · 예시`
  if (pin.positionSample) return `${status} · 위치 예시`
  return status
}

function buildSiteMarker(
  pin: MapPin,
  position: KakaoLatLng,
  map: { setCenter: (position: KakaoLatLng) => void },
  cards: HTMLElement[],
  closeCards: () => void,
  navigate: (href: string) => void,
) {
  const root = document.createElement('div')
  root.className = `site-pin${pin.attention ? ' is-attention' : ''}${pin.waiting ? ' is-wait' : ''}${pin.sample ? ' is-sample' : ''}`

  const card = document.createElement('div')
  card.className = 'site-pin-card'
  card.hidden = true
  const title = document.createElement('strong')
  title.textContent = pin.name
  const state = document.createElement('span')
  state.textContent = statusText(pin)
  const place = document.createElement('em')
  place.textContent = pin.location || '위치 미등록'
  card.append(title, state, place)
  if (pin.to) {
    const open = document.createElement('button')
    open.type = 'button'
    open.textContent = '이 건물 보기'
    const href = pin.to
    open.addEventListener('click', (event) => {
      event.stopPropagation()
      navigate(href)
    })
    card.append(open)
  }
  cards.push(card)

  const mark = document.createElement('button')
  mark.type = 'button'
  mark.className = 'site-pin-mark'
  mark.setAttribute('aria-label', pin.name)
  mark.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 28V14l8-7 8 7v14H8z"/><path d="M13 28v-7h6v7"/><rect x="11" y="16" width="3.2" height="3.2"/><rect x="17.8" y="16" width="3.2" height="3.2" class="is-lit"/></svg>'
  mark.addEventListener('click', (event) => {
    event.stopPropagation()
    const willOpen = card.hidden
    closeCards()
    card.hidden = !willOpen
    if (willOpen) map.setCenter(position)
  })

  root.append(card, mark)
  return root
}

export function SiteMap({ sites }: Props) {
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  const pins = useRef(sites)
  const [note, setNote] = useState('')
  const key = useMemo(
    () => sites.map((site) => `${site.id}:${site.lat ?? ''}:${site.lng ?? ''}:${site.location ?? ''}:${site.name}:${site.to ?? ''}:${site.attention ? 1 : 0}:${site.waiting ? 1 : 0}:${site.sample ? 1 : 0}:${site.positionSample ? 1 : 0}`).join('|'),
    [sites],
  )

  useEffect(() => {
    pins.current = sites
  }, [sites])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    const overlays: Array<{ setMap: (map: null) => void }> = []
    let relayout = () => {}

    loadKakao()
      .then(async (maps) => {
        if (cancelled) return
        const map = new maps.Map(el, {
          center: new maps.LatLng(36.4, 127.8),
          level: 12,
        })
        relayout = () => map.relayout()
        const current = pins.current
        const placed: Array<{ pin: MapPin; lat: number; lng: number }> = []
        const cards: HTMLElement[] = []
        const closeCards = () => {
          cards.forEach((card) => {
            card.hidden = true
          })
        }
        for (const pin of current) {
          const point = await locatePin(maps, pin)
          if (cancelled) return
          if (!point) continue
          placed.push({ pin, ...point })
          const position = new maps.LatLng(point.lat, point.lng)
          const marker = buildSiteMarker(pin, position, map, cards, closeCards, navigate)
          const overlay = new maps.CustomOverlay({ position, content: marker, yAnchor: 1, xAnchor: 0.5 })
          overlay.setMap(map)
          overlays.push(overlay)
        }
        if (placed.length === 1) {
          map.setCenter(new maps.LatLng(placed[0].lat, placed[0].lng))
          map.setLevel(4)
        } else if (placed.length > 1) {
          const bounds = new maps.LatLngBounds()
          for (const item of placed) bounds.extend(new maps.LatLng(item.lat, item.lng))
          map.setBounds(bounds)
        }
        const missing = current.filter((pin) => !placed.some((item) => item.pin.id === pin.id))
        setNote(missing.length > 0 ? `지도를 찾지 못한 현장: ${missing.map((pin) => pin.name).join(', ')}` : '')
        map.relayout()
      })
      .catch(() => {
        if (!cancelled) setNote('지도를 불러오지 못했습니다. 카카오 키의 허용 도메인을 확인하십시오.')
      })

    const onResize = () => relayout()
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      overlays.forEach((overlay) => overlay.setMap(null))
    }
  }, [key, navigate])

  return (
    <section className="site-map" aria-label="현장 지도">
      <div ref={host} className="site-map-canvas" />
      {note ? <p className="site-map-note">{note}</p> : null}
    </section>
  )
}
