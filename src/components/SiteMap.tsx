import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadKakao, locatePin, type MapPin } from '../lib/kakaoMap.ts'

type Props = {
  sites: MapPin[]
}

export function SiteMap({ sites }: Props) {
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  const pins = useRef(sites)
  const [note, setNote] = useState('')
  const key = useMemo(
    () => sites.map((site) => `${site.id}:${site.lat ?? ''}:${site.lng ?? ''}:${site.location ?? ''}:${site.to ?? ''}:${site.attention ? 1 : 0}`).join('|'),
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
        for (const pin of current) {
          const point = await locatePin(maps, pin)
          if (cancelled) return
          if (!point) continue
          placed.push({ pin, ...point })
          const position = new maps.LatLng(point.lat, point.lng)
          const button = document.createElement('button')
          button.type = 'button'
          button.className = pin.attention ? 'site-map-pin is-attention' : 'site-map-pin'
          button.textContent = pin.name
          if (pin.to) {
            const href = pin.to
            button.addEventListener('click', () => navigate(href))
          }
          const overlay = new maps.CustomOverlay({ position, content: button, yAnchor: 1.15 })
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
        const missing = current.length - placed.length
        setNote(missing > 0 ? `위치를 찾지 못한 현장이 ${missing}곳입니다.` : '')
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
