import { TimeWindow } from './TimeWindow.tsx'
import { KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { KIND_OPTIONS, SEVERITY_OPTIONS, useScope } from '../lib/useScope.ts'

export function EventFilters() {
  const { range, severity, kind, patchParams } = useScope()

  return (
    <div className="live-bar">
      <TimeWindow value={range} onChange={(value) => patchParams({ range: value })} />
      <div className="chip-row" role="group" aria-label="심각도">
        <button
          type="button"
          className={severity ? '' : 'is-active'}
          onClick={() => patchParams({ sev: '' })}
        >
          모든 심각도
        </button>
        {SEVERITY_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={item === severity ? `is-active is-${item}` : ''}
            onClick={() => patchParams({ sev: item === severity ? '' : item })}
          >
            {SEVERITY_LABEL[item]}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="종류">
        <button
          type="button"
          className={kind ? '' : 'is-active'}
          onClick={() => patchParams({ kind: '' })}
        >
          모든 종류
        </button>
        {KIND_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={item === kind ? 'is-active' : ''}
            onClick={() => patchParams({ kind: item === kind ? '' : item })}
          >
            {KIND_ALARM_LABEL[item]}
          </button>
        ))}
      </div>
    </div>
  )
}
