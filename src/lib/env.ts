export function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' && 'localStorage' in globalThis
}
