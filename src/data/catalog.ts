import type { Catalog } from '../types/domain.ts'

/**
 * 현장 추가 = 커넥터 + 이 카탈로그.
 * 화면 코드를 현장마다 분기하지 않는다.
 */
export const catalog: Catalog = {
  connectors: [
    { id: 'bacnet-edge', protocol: 'BACnet', name: 'Facilio형 엣지' },
    { id: 'modbus-meters', protocol: 'Modbus', name: '검침 게이트웨이' },
    { id: 'haystack', protocol: 'Haystack', name: 'Niagara / Haystack' },
    { id: 'mqtt-ev', protocol: 'MQTT', name: 'EV 충전 브로커' },
    { id: 'opc-plant', protocol: 'OPC UA', name: '유틸리티 헤드엔드' },
  ],
  sites: [
    {
      id: 'hanam-hq',
      name: '하남 본사',
      kind: 'building',
      location: '경기 하남시',
      areaM2: 4200,
      connectorIds: ['bacnet-edge', 'haystack', 'modbus-meters', 'mqtt-ev'],
      plans: [
        { id: '1f', name: '1층' },
        { id: 'b1', name: '지하 1층' },
      ],
      cameras: [
        { id: 'cam-lobby', name: '로비', planId: '1f', deepLink: 'vms://headend/hanam-hq/cam-lobby' },
        { id: 'cam-elec', name: '전기실', planId: 'b1', deepLink: 'vms://headend/hanam-hq/cam-elec' },
      ],
      systems: [
        {
          id: 'fire',
          name: '소방',
          domain: 'fire',
          wing: '전관',
          equipment: [
            {
              id: 'facp',
              name: '수신기',
              tags: ['fire'],
              points: [
                { id: 'z3', name: '3구역 상태', unit: '', tags: ['fire', 'sensor'] },
              ],
            },
          ],
        },
        {
          id: 'security',
          name: '침입',
          domain: 'security',
          wing: '1동',
          equipment: [
            {
              id: 'pir-1f',
              name: '1층 감지기',
              tags: ['security'],
              points: [
                { id: 'state', name: '감지 상태', unit: '', tags: ['security', 'sensor'] },
              ],
            },
          ],
        },
        {
          id: 'power',
          name: '전력',
          domain: 'power',
          wing: '지하',
          equipment: [
            {
              id: 'incomer',
              name: '수전반',
              tags: ['elec'],
              points: [
                { id: 'main', name: '수전 유효전력', unit: 'kW', tags: ['elec', 'sensor'] },
                { id: 'daily', name: '금일 유효전력량', unit: 'kWh', tags: ['elec', 'meter'] },
                { id: 'peak', name: '최대수요', unit: 'kW', tags: ['elec', 'sensor'] },
              ],
            },
          ],
        },
        {
          id: 'metering',
          name: '검침',
          domain: 'metering',
          wing: '전관',
          equipment: [
            {
              id: 'elec-meter',
              name: '전력량계',
              tags: ['meter', 'elec'],
              points: [
                { id: 'kwh', name: '유효전력량', unit: 'kWh', tags: ['meter', 'elec'] },
              ],
            },
            {
              id: 'water-meter',
              name: '수도미터',
              tags: ['meter', 'water'],
              points: [
                { id: 'm3', name: '적산유량', unit: 'm³', tags: ['meter', 'water'] },
              ],
            },
          ],
        },
        {
          id: 'solar',
          name: '태양광',
          domain: 'solar',
          wing: '옥상',
          equipment: [
            {
              id: 'inv-1',
              name: '인버터 1',
              tags: ['solar'],
              points: [
                { id: 'ac', name: 'AC 출력', unit: 'kW', tags: ['solar', 'sensor'] },
                { id: 'today', name: '금일 발전량', unit: 'kWh', tags: ['solar', 'meter'] },
              ],
            },
          ],
        },
        {
          id: 'parking',
          name: '주차',
          domain: 'parking',
          wing: '지하',
          equipment: [
            {
              id: 'plaza',
              name: '주차관제',
              tags: ['parking'],
              points: [
                { id: 'occ', name: '주차 대수', unit: '대', tags: ['parking', 'sensor'] },
                { id: 'cap', name: '총 면수', unit: '면', tags: ['parking'] },
              ],
            },
          ],
        },
        {
          id: 'ev',
          name: 'EV 충전',
          domain: 'ev',
          wing: '지하',
          equipment: [
            {
              id: 'cp-1',
              name: '충전기 1',
              tags: ['ev'],
              points: [
                { id: 'kw', name: '충전 전력', unit: 'kW', tags: ['ev', 'sensor'] },
                { id: 'kwh', name: '금일 충전량', unit: 'kWh', tags: ['ev', 'meter'] },
              ],
            },
          ],
        },
        {
          id: 'hvac',
          name: '열원',
          domain: 'hvac',
          wing: '기계실',
          equipment: [
            {
              id: 'ahu-1',
              name: 'AHU-1',
              tags: ['hvac'],
              points: [
                { id: 'sat', name: '급기온도', unit: '°C', tags: ['hvac', 'sensor'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'yongin-dc',
      name: '용인 물류',
      kind: 'building',
      location: '경기 용인시',
      connectorIds: ['bacnet-edge', 'modbus-meters'],
      plans: [{ id: 'wh1', name: '창고 1' }],
      cameras: [
        { id: 'cam-dock', name: '하역장', planId: 'wh1', deepLink: 'vms://headend/yongin-dc/cam-dock' },
      ],
      systems: [
        {
          id: 'power',
          name: '전력',
          domain: 'power',
          equipment: [
            {
              id: 'incomer',
              name: '수전반',
              tags: ['elec'],
              points: [
                { id: 'main', name: '수전 유효전력', unit: 'kW', tags: ['elec', 'sensor'] },
                { id: 'daily', name: '금일 유효전력량', unit: 'kWh', tags: ['elec', 'meter'], flags: { stale: true } },
                { id: 'peak', name: '최대수요', unit: 'kW', tags: ['elec', 'sensor'] },
              ],
            },
          ],
        },
        {
          id: 'metering',
          name: '검침',
          domain: 'metering',
          equipment: [
            {
              id: 'gas-meter',
              name: '가스미터',
              tags: ['meter', 'gas'],
              points: [
                { id: 'nm3', name: '가스 적산', unit: 'Nm³', tags: ['meter', 'gas'] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'suwon-off',
      name: '수원 오피스',
      kind: 'building',
      location: '경기 수원시',
      areaM2: 1800,
      connectorIds: ['bacnet-edge'],
      plans: [{ id: '2f', name: '2층' }],
      cameras: [
        { id: 'cam-2f', name: '2층 복도', planId: '2f', deepLink: 'vms://headend/suwon-off/cam-2f' },
      ],
      systems: [
        {
          id: 'fire',
          name: '소방',
          domain: 'fire',
          equipment: [
            {
              id: 'facp',
              name: '수신기',
              tags: ['fire'],
              points: [
                { id: 'z2', name: '2구역 상태', unit: '', tags: ['fire', 'sensor'], flags: { offline: true } },
              ],
            },
          ],
        },
        {
          id: 'power',
          name: '전력',
          domain: 'power',
          equipment: [
            {
              id: 'incomer',
              name: '수전반',
              tags: ['elec'],
              points: [
                { id: 'main', name: '수전 유효전력', unit: 'kW', tags: ['elec', 'sensor'], flags: { offline: true } },
                { id: 'daily', name: '금일 유효전력량', unit: 'kWh', tags: ['elec', 'meter'] },
                { id: 'tenant', name: '임차 구간 전력량', unit: 'kWh', tags: ['elec', 'meter'], flags: { noTelemetry: true } },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'hanam-plant',
      name: '하남 열원',
      kind: 'utility',
      location: '경기 하남시',
      connectorIds: ['opc-plant', 'haystack'],
      plans: [{ id: 'yard', name: '열원 부지' }],
      cameras: [
        { id: 'cam-yard', name: '부지 입구', planId: 'yard', deepLink: 'vms://headend/hanam-plant/cam-yard' },
      ],
      systems: [
        {
          id: 'power',
          name: '수전',
          domain: 'power',
          equipment: [
            {
              id: 'swgr',
              name: '배전반',
              tags: ['elec'],
              points: [
                { id: 'main', name: '수전 유효전력', unit: 'kW', tags: ['elec', 'sensor'] },
                { id: 'daily', name: '금일 유효전력량', unit: 'kWh', tags: ['elec', 'meter'] },
                { id: 'peak', name: '최대수요', unit: 'kW', tags: ['elec', 'sensor'] },
              ],
            },
          ],
        },
        {
          id: 'hvac',
          name: '열공급',
          domain: 'hvac',
          equipment: [
            {
              id: 'hx-1',
              name: '열교환기 1',
              tags: ['hvac'],
              points: [
                { id: 'out', name: '출구온도', unit: '°C', tags: ['hvac', 'sensor'] },
              ],
            },
          ],
        },
      ],
    },
  ],
}
