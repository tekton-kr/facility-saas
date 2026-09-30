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
        <svg className="brand-mark-glyph" viewBox="0 0 32 32">
          <rect x="7.4" y="8.6" width="17.2" height="2.3" rx="0.2" />
          <rect x="14.85" y="8.6" width="2.3" height="13.4" rx="0.2" />
          <rect x="12.4" y="21.8" width="7.2" height="1.35" rx="0.2" />
        </svg>
        {live ? <span className="brand-mark-pip" /> : null}
      </span>
    </span>
  )
}
