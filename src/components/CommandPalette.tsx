import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { APP_IDS, listPoints, siteHasApp, systemMatchesApp } from '../lib/catalog.ts'
import { visibleSiteIds, visibleSites } from '../lib/siteScope.ts'
import { packagesForScope, worksForScope } from '../lib/field.ts'
import { APP_LABEL, formatNumber, KIND_LABEL } from '../lib/format.ts'
import { alarmsForScope, getTelemetry } from '../lib/telemetry.ts'
import { useScope } from '../lib/useScope.ts'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const { app, range, role, goApp, goSite, goSystem, goEquipment, goPoint, eventHref } = useScope()
  const sites = visibleSites().filter((site) => siteHasApp(site, app))
  const points = listPoints({
    app: app === 'events' ? undefined : app,
    siteIds: visibleSiteIds(),
  }).slice(0, 80)
  const alarms = alarmsForScope({ app: app === 'events' ? 'events' : app }).slice(0, 12)
  const works = worksForScope().slice(0, 8)
  const packs = packagesForScope().slice(0, 8)

  function close() {
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="cmdk-overlay" onMouseDown={close}>
      <Command
        className="cmdk"
        label={role === 'exec' ? '현장·예외 검색' : '현장·장비·관제점 검색'}
        loop
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
      >
        <Command.Input autoFocus placeholder={role === 'exec' ? '현장·예외' : '현장·장비·관제점 · 현재값과 같이 점프'} />
        <Command.List>
          <Command.Empty>결과 없음</Command.Empty>
          <Command.Group heading="앱">
            {APP_IDS.map((id) => (
              <Command.Item
                key={id}
                value={`앱 ${APP_LABEL[id]} ${id}`}
                onSelect={() => {
                  goApp(id)
                  close()
                }}
              >
                <span>{APP_LABEL[id]}</span>
                <span className="cmdk-meta">도메인 앱</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="현장">
            {sites.map((site) => (
              <Command.Item
                key={site.id}
                value={`현장 ${site.name} ${site.location} ${KIND_LABEL[site.kind]}`}
                onSelect={() => {
                  goSite(site.id)
                  close()
                }}
              >
                <span>{site.name}</span>
                <span className="cmdk-meta">{KIND_LABEL[site.kind]} · {site.location}</span>
              </Command.Item>
            ))}
          </Command.Group>
          {role === 'ops' ? (
          <Command.Group heading="계통">
            {sites.flatMap((site) =>
              site.systems
                .filter((system) => app === 'events' || systemMatchesApp(system, app))
                .map((system) => (
                  <Command.Item
                    key={`${site.id}.${system.id}`}
                    value={`계통 ${site.name} ${system.name} ${system.wing ?? ''}`}
                    onSelect={() => {
                      goSystem(site.id, system.id)
                      close()
                    }}
                  >
                    <span>{system.wing ? `${system.wing} · ` : ''}{system.name}</span>
                    <span className="cmdk-meta">{site.name}</span>
                  </Command.Item>
                )),
            )}
          </Command.Group>
          ) : null}
          {role === 'ops' ? (
          <Command.Group heading="관제점">
            {points.map((row) => {
              const tel = getTelemetry(row, range)
              return (
                <Command.Item
                  key={`${row.siteId}.${row.systemId}.${row.equipmentId}.${row.pointId}`}
                  value={`관제점 ${row.site.name} ${row.system.name} ${row.equipment.name} ${row.point.name} ${row.point.tags.join(' ')}`}
                  onSelect={() => {
                    goPoint(row.site.id, row.system.id, row.equipment.id, row.point.id)
                    close()
                  }}
                >
                  <span>
                    {row.point.name}
                    <span className="cmdk-meta">
                      {' '}{row.site.name} · {row.equipment.name}
                    </span>
                  </span>
                  <span className="cmdk-value">
                    {formatNumber(tel.current)} {row.point.unit}
                  </span>
                </Command.Item>
              )
            })}
          </Command.Group>
          ) : null}
          <Command.Group heading="작업">
            {works.map((work) => (
              <Command.Item
                key={work.id}
                value={`작업 ${work.title} ${work.id}`}
                onSelect={() => {
                  navigate(`/work/${work.id}`)
                  close()
                }}
              >
                <span>{work.title}</span>
                <span className="cmdk-meta">{work.status}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="개보수">
            {packs.map((item) => (
              <Command.Item
                key={item.id}
                value={`개보수 ${item.title} ${item.id}`}
                onSelect={() => {
                  navigate(`/packages/${item.id}`)
                  close()
                }}
              >
                <span>{item.title}</span>
                <span className="cmdk-meta">{item.status}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="알람">
            {alarms.map((alarm) => (
              <Command.Item
                key={alarm.id}
                value={`알람 ${alarm.title} ${alarm.kind} ${alarm.severity}`}
                onSelect={() => {
                  navigate(eventHref(alarm.id, alarm.siteId))
                  close()
                }}
              >
                <span>{alarm.title}</span>
                <span className="cmdk-meta">{alarm.severity}</span>
              </Command.Item>
            ))}
          </Command.Group>
          {role === 'ops' ? (
          <Command.Group heading="장비">
            {sites.flatMap((site) =>
              site.systems
                .filter((system) => app === 'events' || systemMatchesApp(system, app))
                .flatMap((system) =>
                  system.equipment.map((equipment) => (
                    <Command.Item
                      key={`${site.id}.${system.id}.${equipment.id}`}
                      value={`장비 ${site.name} ${system.name} ${equipment.name}`}
                      onSelect={() => {
                        goEquipment(site.id, system.id, equipment.id)
                        close()
                      }}
                    >
                      <span>{equipment.name}</span>
                      <span className="cmdk-meta">{site.name} · {system.name}</span>
                    </Command.Item>
                  )),
                ),
            )}
          </Command.Group>
          ) : null}
        </Command.List>
      </Command>
    </div>
  )
}
