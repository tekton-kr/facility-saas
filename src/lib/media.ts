import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1100px)'

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(query).matches
  ))

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useCompact() {
  return useMedia(QUERY)
}

export function usePrefersReducedMotion() {
  return useMedia('(prefers-reduced-motion: reduce)')
}
