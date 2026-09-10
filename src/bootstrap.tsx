import { useEffect, useState, type ReactNode } from 'react'
import { getSession, getToken, restoreSession } from './lib/auth.ts'

type BootState = 'wait' | 'ready' | 'error'

export function Bootstrap({ children }: { children: ReactNode }) {
  // 새로고침·직접 링크로 들어오면 세션은 sessionStorage에 남아 있지만 조회 스냅샷은 비어 있다.
  // 하이드레이션 전에 화면을 그리면 모든 실측이 판정 불가로 보인다.
  const [state, setState] = useState<BootState>(() => (getSession() && getToken() ? 'wait' : 'ready'))

  useEffect(() => {
    if (state !== 'wait') return
    let cancelled = false
    void restoreSession().then((session) => {
      if (!cancelled) setState(session ? 'ready' : 'error')
    })
    return () => {
      cancelled = true
    }
  }, [state])

  if (state === 'wait') {
    return (
      <div className="boot-wait">
        <p>조회 API에 연결하는 중입니다.</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="boot-error">
        <div className="panel">
          <h1>조회 API에 연결하지 못했습니다</h1>
          <p className="kpi-meta">
            세션은 지웠습니다. <code>.env</code>의 <code>API_ORIGIN</code>이 중앙 조회 서버를 가리키는지 확인하십시오.
          </p>
          <p>
            <a href="/login">로그인으로</a>
          </p>
        </div>
      </div>
    )
  }

  return children
}
