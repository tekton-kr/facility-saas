import { useEffect, useState, type ReactNode } from 'react'
import { getSession, getToken, restoreSession } from './lib/auth.ts'

export function Bootstrap({ children }: { children: ReactNode }) {
  // 새로고침·직접 링크로 들어오면 세션은 sessionStorage에 남아 있지만 조회 스냅샷은 비어 있다.
  // 하이드레이션 전에 화면을 그리면 모든 실측이 판정 불가로 보인다.
  const [ready, setReady] = useState(() => !(getSession() && getToken()))

  useEffect(() => {
    if (ready) return
    let cancelled = false
    void restoreSession().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="boot">
        <span className="brand-mark">T</span>
        <p>조회 API에 연결하는 중입니다.</p>
      </div>
    )
  }

  return children
}
