import { RANGE_LABEL } from '../lib/format.ts'
import { RANGE_OPTIONS } from '../lib/useScope.ts'
import type { TimeRange } from '../types/domain.ts'

type Props = {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export function TimeWindow({ value, onChange }: Props) {
  return (
    <div className="time-window" role="group" aria-label="기간">
      {RANGE_OPTIONS.map((item) => (
        <button
          key={item}
          type="button"
          className={item === value ? 'is-active' : ''}
          onClick={() => onChange(item)}
        >
          {item === 'live' ? <span className="time-live" aria-hidden="true" /> : null}
          {RANGE_LABEL[item]}
        </button>
      ))}
    </div>
  )
}
