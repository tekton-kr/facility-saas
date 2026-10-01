import { useId } from 'react'

type Props = {
  live?: boolean
}

export function BrandMark({ live = false }: Props) {
  const orbitId = useId().replace(/:/g, '')

  return (
    <span className={`brand-mark${live ? ' is-live' : ''}`} aria-hidden="true">
      {live ? (
        <svg className="brand-mark-orbit" viewBox="0 0 56 56">
          <defs>
            <linearGradient id={orbitId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(56 189 248 / 0)" />
              <stop offset="55%" stopColor="rgb(125 211 252 / 0.2)" />
              <stop offset="82%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="rgb(224 242 254 / 0)" />
            </linearGradient>
          </defs>
          <circle cx="28" cy="28" r="26.2" fill="none" stroke={`url(#${orbitId})`} strokeWidth="1.4" />
        </svg>
      ) : null}
      <span className="brand-mark-plate">
        <svg className="brand-mark-glyph" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5.2 28V15.6a10.8 10.8 0 0 1 21.6 0V28" />
          <rect x="13.5" y="16.2" width="5" height="5" className="is-lit" />
        </svg>
        {live ? <span className="brand-mark-pip" /> : null}
      </span>
    </span>
  )
}
