import { useMemo } from 'react'
import EchartsReactCore from 'echarts-for-react/lib/core'
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'

echarts.use([BarChart, GaugeChart, LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer])

const ReactEChartsCore = (
  EchartsReactCore as unknown as { default?: typeof EchartsReactCore }
).default ?? EchartsReactCore

const TEXT = '#9fb3c8'
const GRID = 'rgba(120, 170, 210, 0.16)'

type Slice = { name: string; value: number; color: string }

export function OwnerMix({ slices, total }: { slices: Slice[]; total: number }) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0c1c2e',
      borderColor: 'rgba(120, 180, 220, 0.35)',
      textStyle: { color: '#e7f2ff', fontSize: 12 },
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
        style: { text: String(total), fill: '#f4fbff', fontSize: 28, fontWeight: 700 },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: { text: '건물', fill: TEXT, fontSize: 12 },
      },
    ],
  }), [slices, total])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 168 }} />
}

export function OwnerWeek({ labels, values }: { labels: string[]; values: number[] }) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: { left: 28, right: 8, top: 16, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0c1c2e',
      borderColor: 'rgba(120, 180, 220, 0.35)',
      textStyle: { color: '#e7f2ff', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: GRID } },
      axisLabel: { color: TEXT, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: TEXT, fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 14,
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: '#3dd6ff',
        },
      },
    ],
  }), [labels, values])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 160 }} />
}

export function OwnerGauge({ value, max, color }: { value: number; max: number; color: string }) {
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
        axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(120,170,210,0.18)']] } },
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
          color: '#f4fbff',
          formatter: '{value}',
        },
        data: [{ value }],
      },
    ],
  }), [value, max, color])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 148 }} />
}

export function OwnerLine({ labels, values }: { labels: string[]; values: number[] }) {
  const option = useMemo<EChartsOption>(() => ({
    animation: false,
    grid: { left: 36, right: 12, top: 16, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0c1c2e',
      borderColor: 'rgba(120, 180, 220, 0.35)',
      textStyle: { color: '#e7f2ff', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: GRID } },
      axisLabel: { color: TEXT, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: TEXT, fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#3dd6ff' },
        areaStyle: { color: 'rgba(61, 214, 255, 0.16)' },
      },
    ],
  }), [labels, values])

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 180 }} />
}
