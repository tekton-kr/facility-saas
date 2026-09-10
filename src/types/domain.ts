export type SiteKind = 'building' | 'utility'
export type Role = 'ops' | 'exec'
export type AppId = 'events' | 'power' | 'metering' | 'solar' | 'parking' | 'ev'
export type SystemDomain = AppId | 'hvac' | 'fire' | 'security'
export type TimeRange = 'live' | '1h' | 'today' | '24h' | '7d' | '30d'
export type Certainty = 'confirmed' | 'estimate' | 'unknown' | 'stale'
export type AlarmSeverity = 'critical' | 'warning' | 'info'
export type AlarmKind = 'fire' | 'intrusion' | 'equipment' | 'data-quality'

export type PointFlags = {
  noTelemetry?: boolean
  stale?: boolean
  offline?: boolean
}

export type ConnectorDef = {
  id: string
  protocol: string
  name: string
}

export type FloorPlan = {
  id: string
  name: string
}

export type CameraRef = {
  id: string
  name: string
  planId?: string
  deepLink: string
}

export type PointDef = {
  id: string
  name: string
  unit: string
  tags: string[]
  flags?: PointFlags
}

export type EquipmentDef = {
  id: string
  name: string
  tags: string[]
  points: PointDef[]
}

export type SystemDef = {
  id: string
  name: string
  domain: SystemDomain
  wing?: string
  equipment: EquipmentDef[]
}

export type SiteDef = {
  id: string
  name: string
  kind: SiteKind
  location: string
  areaM2?: number
  photo?: string
  connectorIds: string[]
  plans: FloorPlan[]
  cameras: CameraRef[]
  systems: SystemDef[]
  pid?: PidDiagram
}

export type Catalog = {
  connectors: ConnectorDef[]
  sites: SiteDef[]
}

export type PointRef = {
  siteId: string
  systemId: string
  equipmentId: string
  pointId: string
}

export type PidPointRef = Omit<PointRef, 'siteId'>

export type PidNodeKind = 'source' | 'pump' | 'valve' | 'exchanger' | 'sensor' | 'sink'
export type PidChipSlot = 'above' | 'below' | 'on'

export type PidNode = {
  id: string
  kind: PidNodeKind
  tag: string
  label?: string
  x: number
  y: number
  slot?: PidChipSlot
  point?: PidPointRef
}

export type PidEdge = {
  from: string
  to: string
  via?: Array<{ x: number; y: number }>
}

export type PidDiagram = {
  id: string
  title: string
  note: string
  nodes: PidNode[]
  edges: PidEdge[]
}

export type Kpi = {
  id: string
  label: string
  value: number | null
  unit: string
  certainty: Certainty
  receivedAt: string | null
  note?: string
  previousValue?: number | null
  series?: number[] | null
}

export type Finding = {
  id: string
  title: string
  narrative: string
  siteId: string
  impact: string
  certainty: Certainty
  estimatedSaving?: number
  audience: Role | 'both'
  note: string
}

export type Alarm = {
  id: string
  severity: AlarmSeverity
  kind: AlarmKind
  title: string
  siteId: string
  systemId?: string
  equipmentId?: string
  pointId?: string
  planId?: string
  cameraIds: string[]
  at: string
  source: string
}

export type Telemetry = {
  current: number | null
  receivedAt: string | null
  series: number[] | null
  certainty: Certainty
  note?: string
}

export type ScreenGroup =
  | 'auth'
  | 'shell'
  | 'events'
  | 'power'
  | 'metering'
  | 'solar'
  | 'parking'
  | 'ev'
  | 'plant'
  | 'settings'

export type ScreenDef = {
  id: string
  name: string
  group: ScreenGroup
  groupLabel: string
  path: string
  apis: string[]
  role: Role | 'any'
  elements: string[]
}

export type QuerySnapshot = {
  catalog: Catalog
  alarms: Alarm[]
  findings: Finding[]
  telemetry: Record<string, Telemetry>
  syncAt: string
}

export type DirectoryRole = Role | 'vendor'
export type WorkKind = 'dispatch' | 'pm' | 'statutory'
export type WorkStatus = 'received' | 'dispatch' | 'on-site' | 'done'
export type StatutoryStatus = 'done' | 'scheduled'
export type PackageStatus = 'candidate' | 'quoted' | 'in-progress' | 'done'
export type SitePreset = 'office' | 'warehouse' | 'hospital' | 'hotel' | 'mart' | 'utility'

export type Vendor = {
  id: string
  name: string
  region: string
}

export type DirectoryAccount = {
  email: string
  name: string
  role: DirectoryRole
  siteScope: string
}

export type StatutoryItem = {
  id: string
  name: string
  due: string
  status: StatutoryStatus
}

export type Contract = {
  id: string
  siteId: string
  vendorId: string
  start: string
  end: string
  scope: SystemDomain[]
  slaCriticalMin: number
  slaWarningMin: number
  statutory: StatutoryItem[]
}

export type WorkOrder = {
  id: string
  siteId: string
  alarmId?: string
  contractId?: string
  vendorId?: string
  kind: WorkKind
  title: string
  status: WorkStatus
  slaDueAt: string
  createdAt: string
  systemId?: string
  equipmentId?: string
  pointId?: string
  note: string
  proofs: string[]
  arrivedAt: string | null
}

export type RenovationPackage = {
  id: string
  siteId: string
  findingId?: string
  title: string
  estimateAmount: number | null
  certainty: Certainty
  status: PackageStatus
  note: string
  pointRef?: PointRef
}
