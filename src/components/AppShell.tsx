import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AlarmRail } from './AlarmRail.tsx'
import { BottomNav } from './BottomNav.tsx'
import { CommandPalette } from './CommandPalette.tsx'
import { FilterBar } from './FilterBar.tsx'
import { SiteTree } from './SiteTree.tsx'
import { useCompact } from '../lib/media.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'

export function AppShell() {
  const { search, palette } = useScope()
  useField()
  const compact = useCompact()
  const [treeOpen, setTreeOpen] = useState(false)
  const [alarmCollapsed, setAlarmCollapsed] = useState(false)
  const [commandOpen, setCommandOpen] = useState(palette)

  // ?palette=1 로 들어오거나 그 링크로 이동했을 때만 연다. 닫은 뒤 다시 열지 않는다.
  const [seenPalette, setSeenPalette] = useState(palette)
  if (palette !== seenPalette) {
    setSeenPalette(palette)
    if (palette) setCommandOpen(true)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`shell${alarmCollapsed ? ' is-alarm-collapsed' : ''}${compact ? ' is-compact' : ''}`}>
      <Link className="brand" to={`/apps/events${search}`}>
        <span className="brand-mark">T</span>
        <span>
          <span className="brand-name">T-ARCH</span>
          <span className="brand-sub">감시 · 헤드엔드는 현장에</span>
        </span>
      </Link>
      <FilterBar
        compact={compact}
        onToggleTree={() => {
          setTreeOpen((value) => !value)
        }}
        onOpenCommand={() => setCommandOpen(true)}
      />
      <div className="shell-stage">
        {compact && treeOpen ? (
          <button className="sheet-scrim" type="button" aria-label="현장 닫기" onClick={() => setTreeOpen(false)} />
        ) : null}
        <SiteTree open={treeOpen} onNavigate={() => setTreeOpen(false)} />
        <main className="main">
          <Outlet />
        </main>
      </div>
      {compact ? null : (
        <AlarmRail
          collapsed={alarmCollapsed}
          open={false}
          onToggle={() => setAlarmCollapsed((value) => !value)}
        />
      )}
      {compact ? <BottomNav /> : null}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
