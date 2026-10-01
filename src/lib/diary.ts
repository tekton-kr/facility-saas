const KEY = 't-arch-diary'
const EVENT = 't-arch-diary'

export type ShiftSlot = '주간' | '석간' | '야간'
export type ShiftPart = '관리' | '전기' | '기계' | '방재'

export const SHIFT_ORDER: ShiftSlot[] = ['주간', '석간', '야간']
export const SHIFT_PARTS: ShiftPart[] = ['관리', '전기', '기계', '방재']
export const SHIFT_HOURS: Record<ShiftSlot, string> = {
  주간: '08:00–16:00',
  석간: '16:00–24:00',
  야간: '00:00–08:00',
}

export type DayNote = {
  siteId: string
  date: string
  text: string
}

export type Shift = {
  id: string
  siteId: string
  date: string
  name: string
  slot: ShiftSlot
  part?: ShiftPart
  duty?: boolean
  sample?: boolean
}

type DiaryState = {
  notes: DayNote[]
  shifts: Shift[]
}

const empty: DiaryState = { notes: [], shifts: [] }

function asSlot(value: unknown): ShiftSlot {
  if (value === '주간' || value === '석간' || value === '야간') return value
  return '주간'
}

function asPart(value: unknown): ShiftPart | undefined {
  if (value === '관리' || value === '전기' || value === '기계' || value === '방재') return value
  return undefined
}

function asShift(value: unknown): Shift | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<Shift>
  if (typeof row.id !== 'string' || typeof row.siteId !== 'string' || typeof row.date !== 'string' || typeof row.name !== 'string') return null
  return {
    id: row.id,
    siteId: row.siteId,
    date: row.date,
    name: row.name,
    slot: asSlot(row.slot),
    part: asPart(row.part),
    duty: Boolean(row.duty),
  }
}

function load(): DiaryState {
  if (typeof window === 'undefined') return empty
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    return {
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts.flatMap((item) => {
        const shift = asShift(item)
        return shift ? [shift] : []
      }) : [],
    }
  } catch {
    return empty
  }
}

let state = load()

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

function write(next: DiaryState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  emit()
}

export function getDiary(): DiaryState {
  return state
}

export function subscribeDiary(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

export function dayNote(siteId: string, date: string): string {
  return state.notes.find((item) => item.siteId === siteId && item.date === date)?.text ?? ''
}

export function saveDayNote(siteId: string, date: string, text: string) {
  const trimmed = text.trim()
  const rest = state.notes.filter((item) => !(item.siteId === siteId && item.date === date))
  write({
    ...state,
    notes: trimmed ? [...rest, { siteId, date, text: trimmed }] : rest,
  })
}

const CREW: Array<{ name: string; part: ShiftPart }> = [
  { name: '이소장', part: '관리' },
  { name: '박전기', part: '전기' },
  { name: '김현장', part: '기계' },
  { name: '최시설', part: '방재' },
  { name: '정설비', part: '기계' },
  { name: '한방재', part: '방재' },
]

function slotRank(slot: ShiftSlot): number {
  return SHIFT_ORDER.indexOf(slot)
}

export function sampleShifts(siteId: string, date: string): Shift[] {
  const stamp = Date.parse(`${date}T12:00:00+09:00`)
  const index = Number.isNaN(stamp) ? 0 : Math.floor(stamp / 86_400_000)
  return SHIFT_ORDER.map((slot, offset) => {
    const person = CREW[(index + offset) % CREW.length]
    return {
      id: `sample-${siteId}-${date}-${slot}`,
      siteId,
      date,
      name: person.name,
      part: person.part,
      slot,
      duty: slot === '야간',
      sample: true,
    }
  })
}

export function shiftsFor(siteId: string, date?: string): Shift[] {
  return state.shifts
    .filter((item) => item.siteId === siteId && (!date || item.date === date))
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a.slot) - slotRank(b.slot))
}

export function rosterFor(siteId: string, date: string): Shift[] {
  const saved = shiftsFor(siteId, date)
  const rows = saved.length > 0 ? saved : sampleShifts(siteId, date)
  return [...rows].sort((a, b) => slotRank(a.slot) - slotRank(b.slot) || a.name.localeCompare(b.name, 'ko'))
}

export function addShift(input: { siteId: string; date: string; name: string; slot: ShiftSlot; part?: ShiftPart; duty?: boolean }) {
  const name = input.name.trim()
  if (!name || !input.date) return
  const shift: Shift = {
    id: `sh-${Date.now().toString(36)}`,
    siteId: input.siteId,
    date: input.date,
    name,
    slot: input.slot,
    part: input.part,
    duty: Boolean(input.duty),
  }
  const shifts = input.duty
    ? state.shifts.map((item) => item.siteId === input.siteId && item.date === input.date ? { ...item, duty: false } : item)
    : state.shifts
  write({ ...state, shifts: [...shifts, shift] })
}

export function removeShift(id: string) {
  write({ ...state, shifts: state.shifts.filter((item) => item.id !== id) })
}
