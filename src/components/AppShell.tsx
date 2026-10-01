import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { BrandMark } from './BrandMark.tsx'
import { AlarmRail, type RailMode } from './AlarmRail.tsx'
import { BottomNav } from './BottomNav.tsx'
import { CommandPalette } from './CommandPalette.tsx'
import { FilterBar, BackButton } from './FilterBar.tsx'
import { SiteTree } from './SiteTree.tsx'
import { useCompact } from '../lib/media.ts'
import { useField } from '../lib/useField.ts'
import { useScope } from '../lib/useScope.ts'
import { readTheme, type ThemeId } from '../lib/theme.ts'

export function AppShell() {
  const { search, palette } = useScope()
  useField()
  const compact = useCompact()
  const [treeOpen, setTreeOpen] = useState(false)
  const [rail, setRail] = useState<RailMode>('closed')
  const [theme, setTheme] = useState<ThemeId>(readTheme)
  const light = theme === 'day' || theme === 'sky' || theme === 'sand' || theme === 'mint'

  useEffect(() => {
    function syncTheme() {
      setTheme(readTheme())
    }
    window.addEventListener('t-arch-theme', syncTheme)
    return () => window.removeEventListener('t-arch-theme', syncTheme)
  }, [])
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
    <div className={`shell theme-${theme}${light ? ' is-light' : ''}${rail === 'closed' ? ' is-alarm-collapsed' : ''}${compact ? ' is-compact' : ''}`}>
      <div className="brand">
        <Link className="brand-lockup" to={`/apps/events${search}`} title="T-ARCH · 시설을 돌보다">
          <BrandMark />
          <span>
            <span className="brand-name">T-ARCH</span>
            <span className="brand-sub">운영·유지보수</span>
          </span>
        </Link>
        <BackButton />
      </div>
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
          mode={rail}
          onMode={setRail}
        />
      )}
      {compact ? <BottomNav /> : null}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
