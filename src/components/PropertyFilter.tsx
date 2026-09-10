import { getSite } from '../lib/catalog.ts'
import { KIND_ALARM_LABEL, KIND_LABEL, RANGE_LABEL, ROLE_LABEL, SEVERITY_LABEL } from '../lib/format.ts'
import { useScope } from '../lib/useScope.ts'

export function PropertyFilter() {
  const { siteId, range, query, severity, kind, role, goHome, patchParams } = useScope()
  const site = getSite(siteId)

  const chips: Array<{ key: string; label: string; value: string; clear: () => void }> = []
  if (site) {
    chips.push({
      key: 'site',
      label: '현장',
      value: `${site.name} · ${KIND_LABEL[site.kind]}`,
      clear: goHome,
    })
  }
  if (range !== '24h') {
    chips.push({
      key: 'range',
      label: '기간',
      value: RANGE_LABEL[range],
      clear: () => patchParams({ range: '24h' }),
    })
  }
  if (query) {
    chips.push({
      key: 'q',
      label: '검색',
      value: query,
      clear: () => patchParams({ q: '' }),
    })
  }
  if (severity) {
    chips.push({
      key: 'sev',
      label: '심각도',
      value: SEVERITY_LABEL[severity],
      clear: () => patchParams({ sev: '' }),
    })
  }
  if (kind) {
    chips.push({
      key: 'kind',
      label: '종류',
      value: KIND_ALARM_LABEL[kind],
      clear: () => patchParams({ kind: '' }),
    })
  }
  if (role !== 'ops') {
    chips.push({
      key: 'role',
      label: '역할',
      value: ROLE_LABEL[role],
      clear: () => patchParams({ role: 'ops' }),
    })
  }

  if (chips.length === 0) {
    return <p className="filter-chips-empty">필터 없음 · 현장·기간·검색은 URL과 같습니다</p>
  }

  return (
    <div className="filter-chips" aria-label="활성 필터">
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="filter-chip" onClick={chip.clear}>
          <span>{chip.label}</span>
          <strong>{chip.value}</strong>
          <span aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  )
}
