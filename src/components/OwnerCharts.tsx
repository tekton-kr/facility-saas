import { useMemo } from 'react'
import EchartsReactCore from 'echarts-for-react/lib/core'
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { chartTone, readTheme } from '../lib/theme.ts'

echarts.use([BarChart, GaugeChart, LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer])

const ReactEChartsCore = (
  EchartsReactCore as unknown as { default?: typeof EchartsReactCore }
).default ?? EchartsReactCore

type Slice = { name: string; value: number; color: string }

function useTone() {
  const id = readTheme()
  return chartTone(id)
}

export function OwnerMix({ slices, total }: { slices: Slice[]; total: number }) {
  const tone = useTone()
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: tone.tip,
      borderColor: tone.tipLine,
      textStyle: { color: tone.text, fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['62%', '82%'],
        center: ['50%', '50%'],
        label: { show: false },
        data: slices.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: { text: String(total), fill: tone.ink, fontSize: 28, fontWeight: 700 },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: { text: '嫄대Ъ', fill: tone.muted, fontSize: 12 },
      },
    ],
  }), [slices, total, tone])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 96 }} />
}

export function OwnerWeek({ labels, values }: { labels: string[]; values: number[] }) {
  const tone = useTone()
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: { left: 28, right: 8, top: 16, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tone.tip,
      borderColor: tone.tipLine,
      textStyle: { color: tone.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: tone.grid } },
      axisLabel: { color: tone.muted, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: tone.grid } },
      axisLabel: { color: tone.muted, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 14,
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: tone.line,
        },
      },
    ],
  }), [labels, values, tone])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 108 }} />
}

export function OwnerGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const tone = useTone()
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    series: [
      {
        type: 'gauge',
        min: 0,
        max,
        startAngle: 210,
        endAngle: -30,
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, tone.track]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: {
          valueAnimation: false,
          offsetCenter: [0, '4%'],
          fontSize: 26,
          fontWeight: 700,
          color: tone.ink,
          formatter: '{value}',
        },
        data: [{ value }],
      },
    ],
  }), [value, max, color, tone])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 78 }} />
}

export function OwnerLine({ labels, values }: { labels: string[]; values: number[] }) {
  const tone = useTone()
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: { left: 36, right: 12, top: 8, bottom: 20 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tone.tip,
      borderColor: tone.tipLine,
      textStyle: { color: tone.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: tone.grid } },
      axisLabel: { color: tone.muted, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: tone.grid } },
      axisLabel: { color: tone.muted, fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: tone.line },
        areaStyle: { color: tone.area },
      },
    ],
  }), [labels, values, tone])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 92 }} />
}
