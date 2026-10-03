import type { SiteDef } from '../types/domain.ts'
import { EhpBoard } from './EhpBoard.tsx'
import { ChargeBoard } from './ChargeBoard.tsx'
import { FireReceiver } from './FireReceiver.tsx'
import { MeterBoard } from './MeterBoard.tsx'
import { LiftBoard } from './LiftBoard.tsx'
import { PowerBoard } from './PowerBoard.tsx'
import { PlantBoard } from './PlantBoard.tsx'
import { LightBoard } from './LightBoard.tsx'
import { ParkBoard } from './ParkBoard.tsx'

export type DeskId = 'events' | 'power' | 'light' | 'metering' | 'ehp' | 'fire' | 'elevator' | 'ev' | 'parking'

export function DomainDesk({ site, desk }: { site?: SiteDef; desk: DeskId }) {
  if (desk === 'events') return <PlantBoard site={site} />
  if (desk === 'ehp') return <EhpBoard site={site} />
  if (desk === 'ev') return <ChargeBoard site={site} />
  if (desk === 'fire') return <FireReceiver site={site} />
  if (desk === 'metering') return <MeterBoard site={site} />
  if (desk === 'elevator') return <LiftBoard site={site} />
  if (desk === 'power') return <PowerBoard site={site} />
  if (desk === 'light') return <LightBoard site={site} />
  return <ParkBoard site={site} />
}
