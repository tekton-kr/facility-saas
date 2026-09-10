import { useEffect, useState } from 'react'
import { formatTime } from '../lib/format.ts'
import { usePrefersReducedMotion } from '../lib/media.ts'
import { lastSyncAt } from '../lib/telemetry.ts'

const STEP_MS = 4500
const MAX_TICK = 3

export function LoginPreview() {
  const reduced = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)
  const arrived = reduced || tick >= 1
  const clock = formatTime(new Date(new Date(lastSyncAt()).getTime() + tick * 60_000).toISOString())

  useEffect(() => {
    if (reduced) return
    let id = 0
    const start = () => {
      id = window.setInterval(() => {
        setTick((value) => (value + 1) % MAX_TICK)
      }, STEP_MS)
    }
    const stop = () => window.clearInterval(id)
    const onVisibility = () => {
      stop()
      if (!document.hidden) start()
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return (
    <aside className="login-preview" aria-hidden="true">
      <div className="login-window">
        <div className="login-window-bar">
          <span />
          <span />
          <span />
          <em>T-ARCH · 이벤트</em>
          <time className="login-window-clock">{clock}</time>
        </div>
        <div className="login-window-body">
          <div className="login-window-kpis">
            <div>
              <small>위험</small>
              <strong key={arrived ? 2 : 1} className={!reduced && arrived ? 'is-tick' : undefined}>
                {arrived ? 2 : 1}
              </strong>
            </div>
            <div>
              <small>주의</small>
              <strong>3</strong>
            </div>
            <div className="is-estimate">
              <small>추정 절감</small>
              <strong>1.2</strong>
              <b>백만원</b>
            </div>
          </div>
          <div className="login-window-split">
            <ul>
              {arrived ? (
                <li className={`is-critical${reduced ? '' : ' is-enter'}`}>2구역 화재 알람</li>
              ) : null}
              <li className="is-warning">수전 통신 두절</li>
              <li>1층 침입 감지</li>
            </ul>
            <figure>
              <img src="/login-plant.jpg" alt="" />
              <figcaption>도면 · {arrived ? '2층' : '전기실'}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </aside>
  )
}
