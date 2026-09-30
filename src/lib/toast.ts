const EVENT = 't-arch-toast'

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }))
}

export function subscribeToast(onMessage: (message: string) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail
    if (detail) onMessage(detail)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
