import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CertaintyBadge } from './CertaintyBadge.tsx'
import { DataTable } from './DataTable.tsx'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import { getTelemetry } from '../lib/telemetry.ts'
import type { Certainty, EquipmentDef, PointDef, SiteDef, SystemDef, TimeRange } from '../types/domain.ts'

export type PointRow = {
  site: SiteDef
  system: SystemDef
  equipment: EquipmentDef
  point: PointDef
}

type DisplayRow = PointRow & {
  id: string
  value: number | null
  unit: string
  certainty: Certainty
  receivedAt: string | null
}

type Props = {
  rows: PointRow[]
  range: TimeRange
  onOpen: (row: PointRow) => void
  showSite?: boolean
}

export function PointTable({ rows, range, onOpen, showSite = false }: Props) {
  const data = useMemo<DisplayRow[]>(() => (
    rows.map((row) => {
      const ref = {
        siteId: row.site.id,
        systemId: row.system.id,
        equipmentId: row.equipment.id,
        pointId: row.point.id,
      }
      const tel = getTelemetry(ref, range)
      return {
        ...row,
        id: `${ref.siteId}.${ref.systemId}.${ref.equipmentId}.${ref.pointId}`,
        value: tel.current,
        unit: row.point.unit,
        certainty: tel.certainty,
        receivedAt: tel.receivedAt,
      }
    })
  ), [range, rows])

  const columns = useMemo<ColumnDef<DisplayRow, unknown>[]>(() => {
    const siteColumn: ColumnDef<DisplayRow, unknown> = {
      accessorKey: 'site.name',
      header: '현장',
      cell: ({ row }) => row.original.site.name,
    }
    return [
      ...(showSite ? [siteColumn] : []),
      {
        accessorFn: (row) => row.system.name,
        id: 'system',
        header: '계통',
      },
      {
        accessorFn: (row) => row.equipment.name,
        id: 'equipment',
        header: '장비',
      },
      {
        accessorFn: (row) => row.point.name,
        id: 'point',
        header: '관제점',
      },
      {
        accessorFn: (row) => row.value,
        id: 'value',
        header: '값',
        cell: ({ row }) => (
          <span className="mono">{formatNumber(row.original.value)} {row.original.unit}</span>
        ),
      },
      {
        accessorFn: (row) => row.certainty,
        id: 'certainty',
        header: '성격',
        cell: ({ row }) => <CertaintyBadge certainty={row.original.certainty} />,
      },
      {
        accessorFn: (row) => row.receivedAt ?? '',
        id: 'receivedAt',
        header: '수신',
        cell: ({ row }) => formatDateTime(row.original.receivedAt),
      },
    ]
  }, [showSite])

  return (
    <DataTable
      data={data}
      columns={columns}
      empty="이 앱·범위에 관제점이 없습니다. 현장을 추가해도 화면 코드는 바꾸지 않습니다."
      getRowId={(row) => row.id}
      onRowClick={(row) => onOpen(row)}
    />
  )
}
