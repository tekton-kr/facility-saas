import type { AppId } from '../types/domain.ts'

type Props = {
  app: AppId
}

export function AppIcon({ app }: Props) {
  return (
    <svg className="app-icon" viewBox="0 0 20 20" aria-hidden="true">
      {app === 'events' ? (
        <path d="M4 7h12M7 4v3m6-3v3M5 7v8h10V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : null}
      {app === 'power' ? (
        <path d="M11 3 6 11h4l-1 6 6-9h-4l1-5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      ) : null}
      {app === 'metering' ? (
        <path d="M4 15h12M6 15V8m4 7V5m4 10v-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : null}
      {app === 'solar' ? (
        <>
          <circle cx="10" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 3v1.2M10 11.8V13M5.6 5.6l.8.8M13.6 11.6l.8.8M4 8h1.2M14.8 8H16M5.6 10.4l.8-.8M13.6 4.4l.8-.8M5 16h10" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : null}
      {app === 'parking' ? (
        <path d="M5 16V4h6a4 4 0 0 1 0 8H8v4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : null}
      {app === 'ev' ? (
        <path d="M4 13h12l-1.2-6H7L4 13Zm3 0v3m6-3v3M7 7V4h3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      ) : null}
    </svg>
  )
}
