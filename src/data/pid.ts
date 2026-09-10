import type { PidDiagram } from '../types/domain.ts'

/** 열교환 루프. 현장 id를 넣지 않는다. 장비 id만 받는다. */
export function heatLoopPid(ids: {
  powerSystem: string
  incomer: string
  hvacSystem: string
  exchanger: string
}): PidDiagram {
  const power = { systemId: ids.powerSystem, equipmentId: ids.incomer }
  const hx = { systemId: ids.hvacSystem, equipmentId: ids.exchanger }

  return {
    id: 'heat-loop',
    title: '열교환',
    note: '보호동작은 현장 헤드엔드. 본 화면에서 닫기·제어는 없습니다. 온도 °C, 전력 kW.',
    nodes: [
      { id: 'src', kind: 'source', tag: '', label: '수전함', x: 78, y: 88, slot: 'on', point: { ...power, pointId: 'main' } },
      { id: 'p101', kind: 'pump', tag: 'P-101', x: 188, y: 88, slot: 'above' },
      { id: 'cp101', kind: 'pump', tag: 'CP-101', x: 268, y: 88, slot: 'above' },
      { id: 'fcv101', kind: 'valve', tag: 'FCV-101', x: 348, y: 88, slot: 'above' },
      { id: 'tt101', kind: 'sensor', tag: 'TT-101', x: 428, y: 88, slot: 'below', point: { ...hx, pointId: 'in' } },
      { id: 'e101', kind: 'exchanger', tag: 'E-101', label: '열교환기', x: 548, y: 88, slot: 'above', point: { ...hx, pointId: 'out' } },
      { id: 'tt102', kind: 'sensor', tag: 'TT-102', x: 668, y: 88, slot: 'below', point: { ...hx, pointId: 'out' } },
      { id: 'fcv102', kind: 'valve', tag: 'FCV-102', x: 748, y: 88, slot: 'above' },
      { id: 'out', kind: 'sink', tag: '', label: '출구', x: 838, y: 88, slot: 'on', point: { ...hx, pointId: 'out' } },
      { id: 'fcv103', kind: 'valve', tag: 'FCV-103', x: 548, y: 214, slot: 'below' },
      { id: 'tt103', kind: 'sensor', tag: 'TT-103', x: 428, y: 214, slot: 'below', point: { ...hx, pointId: 'ret' } },
      { id: 'ret', kind: 'sink', tag: '', label: '환수', x: 268, y: 214, slot: 'on', point: { ...hx, pointId: 'ret' } },
    ],
    edges: [
      { from: 'src', to: 'p101' },
      { from: 'p101', to: 'cp101' },
      { from: 'cp101', to: 'fcv101' },
      { from: 'fcv101', to: 'tt101' },
      { from: 'tt101', to: 'e101' },
      { from: 'e101', to: 'tt102' },
      { from: 'tt102', to: 'fcv102' },
      { from: 'fcv102', to: 'out' },
      { from: 'e101', to: 'fcv103' },
      { from: 'fcv103', to: 'tt103' },
      { from: 'tt103', to: 'ret' },
    ],
  }
}
