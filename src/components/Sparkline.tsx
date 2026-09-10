type Props = {
  values: number[]
  tone?: 'ok' | 'stale' | 'estimate'
}

export function Sparkline({ values, tone = 'ok' }: Props) {
  if (values.length < 2) return null

  const width = 72
  const height = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)
  const points = values
    .map((value, index) => {
      const x = index * step
      const y = height - ((value - min) / span) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className={`sparkline is-${tone}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" points={points} />
    </svg>
  )
}
