/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_NOTIFY_KEY?: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
