import { useMemo } from 'react'
import EchartsReactCore from 'echarts-for-react/lib/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const ReactEChartsCore = (
  EchartsReactCore as unknown as { default?: typeof EchartsReactCore }
).default ?? EchartsReactCore

type Props = {
  values: number[]
  label: string
}

function token(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function TrendChartCanvas({ values, label }: Props) {
  const option = useMemo<EChartsOption>(() => {
    const line = token('--chart-1', '#2563eb')
    const grid = token('--chart-grid', '#eef0f3')
    const text = token('--text-secondary', '#6b7280')

    return {
      animation: false,
      grid: { left: 44, right: 12, top: 16, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        borderWidth: 1,
        borderColor: token('--border', '#e5e7eb'),
        backgroundColor: token('--surface', '#ffffff'),
        textStyle: { color: token('--text', '#111827'), fontSize: 12 },
      },
      xAxis: {
        type: 'category',
        data: values.map((_, index) => String(index + 1)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: grid } },
        axisTick: { show: false },
        axisLabel: { color: text, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: grid } },
        axisLabel: { color: text, fontSize: 11 },
      },
      series: [
        {
          type: 'line',
          name: label,
          data: values,
          showSymbol: false,
          lineStyle: { width: 2, color: line },
          itemStyle: { color: line },
        },
      ],
    }
  }, [label, values])

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: 220, width: '100%' }}
      notMerge
      lazyUpdate
    />
  )
}
