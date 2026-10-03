export type PhotoSheet = {
  id: string
  siteId: string
  trade: string
  takenOn: string
  caption: string
  image: string
  sample?: boolean
}

const KEY = 't-arch-photo-sheets'
const EVENT = 't-arch-photo-sheets'
const SAMPLE_IMAGE = '/img/sample/songdo_ait_center_002_3725457f57.webp'

function sampleSheets(siteId: string): PhotoSheet[] {
  return [
    {
      id: `sample-${siteId}-1`,
      siteId,
      trade: '수배전반 점검',
      takenOn: '2026-10-02',
      caption: '문 개방 후 외관 확인',
      image: SAMPLE_IMAGE,
      sample: true,
    },
    {
      id: `sample-${siteId}-2`,
      siteId,
      trade: '기계실 순찰',
      takenOn: '2026-10-02',
      caption: '바닥 누수 없음',
      image: SAMPLE_IMAGE,
      sample: true,
    },
  ]
}

function load(): PhotoSheet[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PhotoSheet[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((row) => row && typeof row.id === 'string' && typeof row.siteId === 'string' && typeof row.image === 'string')
  } catch {
    return []
  }
}

let rows = load()

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

function write(next: PhotoSheet[]) {
  rows = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    throw new Error('사진이 커서 이 브라우저에 더 저장하지 못했습니다.')
  }
  emit()
}

export function savedSheets(siteId: string): PhotoSheet[] {
  return rows
    .filter((item) => item.siteId === siteId && !item.sample)
    .sort((a, b) => b.takenOn.localeCompare(a.takenOn) || b.id.localeCompare(a.id))
}

export function sheetsFor(siteId: string): PhotoSheet[] {
  const saved = savedSheets(siteId)
  return saved.length > 0 ? saved : sampleSheets(siteId)
}

export function subscribePhotoSheets(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

export function addPhotoSheet(input: Omit<PhotoSheet, 'id' | 'sample'>) {
  const trade = input.trade.trim()
  const caption = input.caption.trim()
  if (!trade || !caption || !input.takenOn || !input.image) return
  write([
    {
      id: `ps-${Date.now().toString(36)}`,
      siteId: input.siteId,
      trade,
      takenOn: input.takenOn,
      caption,
      image: input.image,
    },
    ...rows,
  ])
}

export function removePhotoSheet(id: string) {
  write(rows.filter((item) => item.id !== id))
}

export function sheetDateLabel(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  return `${Number(match[2])}월 ${match[3]}일 ${match[1]}년`
}

export async function fileToJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const max = 1280
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('사진을 읽지 못했습니다.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.72)
}
