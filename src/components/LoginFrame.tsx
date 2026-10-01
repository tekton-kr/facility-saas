import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LoginPreview } from './LoginPreview.tsx'

type Props = {
  children: ReactNode
}

export function LoginFrame({ children }: Props) {
  return (
    <div className="login">
      <LoginPreview />
      <div className="login-main">
        <p className="login-slogan">
          <svg className="login-slogan-figure" viewBox="0 0 96 52" aria-hidden="true">
            <path d="M3 48V22L22 8l19 14v26" />
            <path d="M16 48V34h10v14" />
            <rect x="11" y="26" width="6" height="6" className="is-lit" />
            <rect x="24" y="26" width="6" height="6" />
            <circle cx="58" cy="18" r="5" />
            <path d="M48 48c1.6-8 5.2-11.5 10-11.5S66.4 40 68 48" />
            <path d="M50 30 40 34" />
            <rect x="74" y="22" width="16" height="20" rx="1.6" />
            <path d="M77.5 28h9M77.5 32.5h9M77.5 37h6" />
          </svg>
          <span>시설을 돌보다</span>
        </p>
        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-brand">
              <span className="brand-name">T-ARCH</span>
            </div>
            {children}
          </div>
        </div>
        <footer className="login-copy">
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <span>© 2026 TEKTON</span>
        </footer>
      </div>
    </div>
  )
}
