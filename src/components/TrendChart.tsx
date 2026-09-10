import { lazy, Suspense } from 'react'

// ECharts는 초기 번들의 대부분을 차지한다. 추세가 실제로 그려지는 화면에서만 내려받는다.
const TrendChartCanvas = lazy(() =>
  import('./TrendChartCanvas.tsx').then((module) => ({ default: module.TrendChartCanvas })),
)

type Props = {
  values: number[] | null
  label: string
}

export function TrendChart({ values, label }: Props) {
  if (!values || values.length === 0) {
    return (
      <div className="chart" role="img" aria-label={`${label} 데이터 없음`}>
        <div className="chart-empty">데이터 없음</div>
      </div>
    )
  }

  return (
    <div className="chart" role="img" aria-label={label}>
      <Suspense fallback={<div className="chart-empty">추세 불러오는 중</div>}>
        <TrendChartCanvas values={values} label={label} />
      </Suspense>
    </div>
  )
}
