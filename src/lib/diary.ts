const KEY = 't-arch-diary'
const EVENT = 't-arch-diary'

export type ShiftSlot = '주간' | '야간'

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
}

type DiaryState = {
  notes: DayNote[]
  shifts: Shift[]
}

const empty: DiaryState = { notes: [], shifts: [] }

function load(): DiaryState {
  if (typeof window === 'undefined') return empty
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    return {
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
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

export function shiftsFor(siteId: string, date?: string): Shift[] {
  return state.shifts
    .filter((item) => item.siteId === siteId && (!date || item.date === date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))
}

export function addShift(input: { siteId: string; date: string; name: string; slot: ShiftSlot }) {
  const name = input.name.trim()
  if (!name || !input.date) return
  const shift: Shift = {
    id: `sh-${Date.now().toString(36)}`,
    siteId: input.siteId,
    date: input.date,
    name,
    slot: input.slot,
  }
  write({ ...state, shifts: [...state.shifts, shift] })
}

export function removeShift(id: string) {
  write({ ...state, shifts: state.shifts.filter((item) => item.id !== id) })
}
