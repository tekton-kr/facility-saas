import * as Dialog from '@radix-ui/react-dialog'
import { CertaintyBadge } from './CertaintyBadge.tsx'
import { TrendChart } from './TrendChart.tsx'
import { getSite } from '../lib/catalog.ts'
import { formatDateTime, formatNumber } from '../lib/format.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'
import type { PointRow } from './PointTable.tsx'
import type { TimeRange } from '../types/domain.ts'

type Props = {
  row: PointRow | null
  range: TimeRange
  onClose: () => void
  onOpenPage: () => void
}

export function PointDrawer({ row, range, onClose, onOpenPage }: Props) {
  const tel = row
    ? getTelemetry({
        siteId: row.site.id,
        systemId: row.system.id,
        equipmentId: row.equipment.id,
        pointId: row.point.id,
      }, range)
    : null
  const site = row ? getSite(row.site.id) : undefined
  const related = row
    ? alarmsForScope({ siteId: row.site.id }).filter((alarm) => alarm.pointId === row.point.id)
    : []
  const cameras = (site?.cameras ?? []).filter((camera) =>
    related.some((alarm) => alarm.cameraIds.includes(camera.id)),
  )

  return (
    <Dialog.Root open={row !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-backdrop" />
        <Dialog.Content className="drawer" aria-describedby="point-drawer-note">
          {row && tel ? (
            <>
              <div className="drawer-head">
                <Dialog.Title>{row.point.name}</Dialog.Title>
                <Dialog.Close className="drawer-close">닫기</Dialog.Close>
              </div>
              <p className="kpi-meta">{row.site.name} · {row.system.name} · {row.equipment.name}</p>
              <p className="kpi-meta">{row.point.tags.join(' · ')}</p>
              <div className="kpi-top drawer-value">
                <span className="kpi-value">
                  {formatNumber(tel.current)}
                  <span className="kpi-unit">{row.point.unit}</span>
                </span>
                <CertaintyBadge certainty={tel.certainty} />
              </div>
              <p className="kpi-meta">수신 {formatDateTime(tel.receivedAt)}</p>
              {tel.note ? <p className="kpi-note">{tel.note}</p> : null}
              <div className="panel drawer-chart">
                <h2>추세</h2>
                <TrendChart values={tel.series} label={`${row.point.name} 추세`} />
              </div>
              <h3 className="subhead">관련 CCTV</h3>
              {cameras.length === 0 ? (
                <p className="kpi-meta">연결된 카메라가 없습니다. 영상 아카이브는 보유하지 않습니다.</p>
              ) : (
                cameras.map((camera) => (
                  <div key={camera.id} className="cctv-card">
                    <div className="cctv-tile" aria-hidden="true" />
                    <strong>{camera.name}</strong>
                    <p className="kpi-meta">딥링크만 전달합니다. 재생·보관은 현장 VMS입니다.</p>
                    <code>{camera.deepLink}</code>
                  </div>
                ))
              )}
              <p className="kpi-note drawer-note" id="point-drawer-note">
                조회 전용입니다. 쓰기는 현장 헤드엔드에 남깁니다.
              </p>
              <button className="drawer-open" type="button" onClick={onOpenPage}>
                관제점 화면으로
              </button>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
