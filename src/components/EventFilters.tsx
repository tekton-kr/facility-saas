import { TimeWindow } from './TimeWindow.tsx'
import { isAlarmKindCollected } from '../lib/collection.ts'
import { KIND_ALARM_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { KIND_OPTIONS, SEVERITY_OPTIONS, useScope } from '../lib/useScope.ts'

export function EventFilters() {
  const { range, severity, kind, patchParams } = useScope()
  const pendingKind = kind && !isAlarmKindCollected(kind)

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
          붙은 계통
        </button>
        {KIND_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${item === kind ? 'is-active' : ''}${isAlarmKindCollected(item) ? '' : ' is-pending'}`}
            onClick={() => patchParams({ kind: item === kind ? '' : item })}
          >
            {KIND_ALARM_LABEL[item]}
            {isAlarmKindCollected(item) ? '' : ' · 대기'}
          </button>
        ))}
      </div>
      {pendingKind ? (
        <p className="kpi-meta">이 종류는 연동 대기입니다. 0으로 채우지 않습니다.</p>
      ) : null}
    </div>
  )
}
