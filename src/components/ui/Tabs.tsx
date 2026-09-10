import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

type Item = {
  id: string
  label: string
}

type Props = {
  value: string
  items: Item[]
  label: string
  onChange: (value: string) => void
  extra?: ReactNode
}

export function UiTabs({ value, items, label, onChange, extra }: Props) {
  return (
    <Tabs.Root value={value} onValueChange={onChange}>
      <Tabs.List className="app-nav" aria-label={label}>
        {items.map((item) => (
          <Tabs.Trigger key={item.id} className="app-nav-tab" value={item.id}>
            {item.label}
          </Tabs.Trigger>
        ))}
        {extra}
      </Tabs.List>
    </Tabs.Root>
  )
}
