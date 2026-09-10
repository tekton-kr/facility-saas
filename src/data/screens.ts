import type { ScreenDef } from '../types/domain.ts'

const Q = 'GET /api/v1/catalog'
const T = 'GET /api/v1/telemetry'
const A = 'GET /api/v1/alarms'
const F = 'GET /api/v1/findings'
const S = 'GET /api/v1/stream'
const H = 'POST /api/v1/auth/login'

/** 별표 1. 59면. 현장 수로 곱하지 않는다. */
export const SCREENS: ScreenDef[] = [
  { id: 'S01', name: '로그인', group: 'auth', groupLabel: '인증', path: '/login', apis: [H], role: 'any', elements: ['이메일', '비밀번호', '조회 전용 안내'] },
  { id: 'S02', name: '세션 만료', group: 'auth', groupLabel: '인증', path: '/login?reason=expired', apis: [H], role: 'any', elements: ['만료 안내', '재로그인'] },
  { id: 'S03', name: '권한 없음', group: 'auth', groupLabel: '인증', path: '/forbidden', apis: [Q], role: 'any', elements: ['권한 없음 카드', '홈 링크'] },
  { id: 'S04', name: '운전자 홈', group: 'shell', groupLabel: '셸', path: '/apps/events/sites/suwon-off', apis: [Q, A, S], role: 'ops', elements: ['알람 배너', '알람 표', '도면'] },
  { id: 'S05', name: '경영 홈', group: 'shell', groupLabel: '셸', path: '/apps/power?role=exec', apis: [Q, T, F], role: 'exec', elements: ['KPI ≤6', '이상 현장', '추정 절감'] },
  { id: 'S06', name: '명령 팔레트', group: 'shell', groupLabel: '셸', path: '/apps/events/sites/hanam-hq?palette=1', apis: [Q, T, A], role: 'ops', elements: ['점프', '현재값', 'Esc'] },
  { id: 'S07', name: '데이터 품질', group: 'shell', groupLabel: '셸', path: '/quality', apis: [Q, T, A], role: 'ops', elements: ['실측', '지연', '판정 불가'] },
  { id: 'S08', name: '이벤트 포트폴리오', group: 'events', groupLabel: '이벤트', path: '/apps/events?role=exec', apis: [Q, A, F], role: 'exec', elements: ['예외 KPI', '현장 카드'] },
  { id: 'S09', name: '이벤트 현장', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq', apis: [Q, A, S], role: 'ops', elements: ['알람 표', '도면', 'CCTV 링크'] },
  { id: 'S10', name: '알람 상세', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq?event=a-intrusion', apis: [Q, A], role: 'ops', elements: ['선택 행', '도면 강조', '출처'] },
  { id: 'S11', name: '알람 이력', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq?view=history', apis: [Q, A], role: 'ops', elements: ['기간 필터', '이력 표'] },
  { id: 'S12', name: '평면도', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq?view=plan', apis: [Q, A], role: 'ops', elements: ['층 구역', '알람 위치'] },
  { id: 'S13', name: 'CCTV 링크', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq?view=cameras', apis: [Q], role: 'ops', elements: ['딥링크', '아카이브 없음'] },
  { id: 'S14', name: '소방 계통', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq/systems/fire', apis: [Q, A], role: 'ops', elements: ['수신기', '상태점'] },
  { id: 'S15', name: '침입 계통', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq/systems/security', apis: [Q, A], role: 'ops', elements: ['감지기', '상태점'] },
  { id: 'S16', name: '열원 계통', group: 'events', groupLabel: '이벤트', path: '/apps/events/sites/hanam-hq/systems/hvac', apis: [Q, T], role: 'ops', elements: ['AHU', '관제점 표'] },
  { id: 'S17', name: '전력 포트폴리오', group: 'power', groupLabel: '전력', path: '/apps/power?role=exec', apis: [Q, T, F], role: 'exec', elements: ['전력 KPI', '이상 현장'] },
  { id: 'S18', name: '전력 현장', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq', apis: [Q, T, F], role: 'ops', elements: ['KPI', '관제점 표'] },
  { id: 'S19', name: '전력 계통', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq/systems/power', apis: [Q, T], role: 'ops', elements: ['수전', '장비 목록'] },
  { id: 'S20', name: '전력 장비', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq/systems/power/equipment/incomer', apis: [Q, T], role: 'ops', elements: ['추세', '관제점'] },
  { id: 'S21', name: '전력 관제점', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq/systems/power/equipment/incomer/points/main', apis: [Q, T, S], role: 'ops', elements: ['현재값', '수신 시각', '추세'] },
  { id: 'S22', name: '전력 피크', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq?view=peak', apis: [Q, T], role: 'ops', elements: ['최대수요', '비교 기간'] },
  { id: 'S23', name: '전력 EUI', group: 'power', groupLabel: '전력', path: '/apps/power/sites/hanam-hq?view=eui', apis: [Q, T], role: 'ops', elements: ['EUI', '면적 공백'] },
  { id: 'S24', name: '검침 포트폴리오', group: 'metering', groupLabel: '검침', path: '/apps/metering?role=exec', apis: [Q, T, F], role: 'exec', elements: ['검침 KPI', '공백 현장'] },
  { id: 'S25', name: '검침 현장', group: 'metering', groupLabel: '검침', path: '/apps/metering/sites/hanam-hq', apis: [Q, T], role: 'ops', elements: ['전력·수도', '관제점'] },
  { id: 'S26', name: '검침 계통', group: 'metering', groupLabel: '검침', path: '/apps/metering/sites/hanam-hq/systems/metering', apis: [Q, T], role: 'ops', elements: ['미터 목록'] },
  { id: 'S27', name: '검침 장비', group: 'metering', groupLabel: '검침', path: '/apps/metering/sites/hanam-hq/systems/metering/equipment/elec-meter', apis: [Q, T], role: 'ops', elements: ['전력량계 추세'] },
  { id: 'S28', name: '검침 관제점', group: 'metering', groupLabel: '검침', path: '/apps/metering/sites/hanam-hq/systems/metering/equipment/water-meter/points/m3', apis: [Q, T], role: 'ops', elements: ['수도 적산'] },
  { id: 'S29', name: '검침 공백', group: 'metering', groupLabel: '검침', path: '/apps/metering/sites/suwon-off?view=gaps', apis: [Q, T, F], role: 'ops', elements: ['임차 미터 공백', '0 금지'] },
  { id: 'S30', name: '태양광 포트폴리오', group: 'solar', groupLabel: '태양광', path: '/apps/solar?role=exec', apis: [Q, T, F], role: 'exec', elements: ['발전 KPI'] },
  { id: 'S31', name: '태양광 현장', group: 'solar', groupLabel: '태양광', path: '/apps/solar/sites/hanam-hq', apis: [Q, T], role: 'ops', elements: ['출력', '금일 발전'] },
  { id: 'S32', name: '태양광 계통', group: 'solar', groupLabel: '태양광', path: '/apps/solar/sites/hanam-hq/systems/solar', apis: [Q, T], role: 'ops', elements: ['인버터'] },
  { id: 'S33', name: '태양광 장비', group: 'solar', groupLabel: '태양광', path: '/apps/solar/sites/hanam-hq/systems/solar/equipment/inv-1', apis: [Q, T], role: 'ops', elements: ['인버터 추세'] },
  { id: 'S34', name: '태양광 관제점', group: 'solar', groupLabel: '태양광', path: '/apps/solar/sites/hanam-hq/systems/solar/equipment/inv-1/points/ac', apis: [Q, T], role: 'ops', elements: ['AC 출력'] },
  { id: 'S35', name: '태양광 PR 추정', group: 'solar', groupLabel: '태양광', path: '/apps/solar/sites/hanam-hq?view=pr', apis: [Q, T], role: 'ops', elements: ['추정 PR', '가정 문구'] },
  { id: 'S36', name: '주차 포트폴리오', group: 'parking', groupLabel: '주차', path: '/apps/parking?role=exec', apis: [Q, T], role: 'exec', elements: ['점유 KPI'] },
  { id: 'S37', name: '주차 현장', group: 'parking', groupLabel: '주차', path: '/apps/parking/sites/hanam-hq', apis: [Q, T], role: 'ops', elements: ['주차 대수'] },
  { id: 'S38', name: '주차 계통', group: 'parking', groupLabel: '주차', path: '/apps/parking/sites/hanam-hq/systems/parking', apis: [Q, T], role: 'ops', elements: ['주차관제'] },
  { id: 'S39', name: '주차 장비', group: 'parking', groupLabel: '주차', path: '/apps/parking/sites/hanam-hq/systems/parking/equipment/plaza', apis: [Q, T], role: 'ops', elements: ['면수 추세'] },
  { id: 'S40', name: '주차 관제점', group: 'parking', groupLabel: '주차', path: '/apps/parking/sites/hanam-hq/systems/parking/equipment/plaza/points/occ', apis: [Q, T], role: 'ops', elements: ['주차 대수 점'] },
  { id: 'S41', name: 'EV 포트폴리오', group: 'ev', groupLabel: 'EV', path: '/apps/ev?role=exec', apis: [Q, T], role: 'exec', elements: ['충전 KPI'] },
  { id: 'S42', name: 'EV 현장', group: 'ev', groupLabel: 'EV', path: '/apps/ev/sites/hanam-hq', apis: [Q, T], role: 'ops', elements: ['충전 전력'] },
  { id: 'S43', name: 'EV 계통', group: 'ev', groupLabel: 'EV', path: '/apps/ev/sites/hanam-hq/systems/ev', apis: [Q, T], role: 'ops', elements: ['충전기'] },
  { id: 'S44', name: 'EV 장비', group: 'ev', groupLabel: 'EV', path: '/apps/ev/sites/hanam-hq/systems/ev/equipment/cp-1', apis: [Q, T], role: 'ops', elements: ['충전기 추세'] },
  { id: 'S45', name: 'EV 관제점', group: 'ev', groupLabel: 'EV', path: '/apps/ev/sites/hanam-hq/systems/ev/equipment/cp-1/points/kw', apis: [Q, T], role: 'ops', elements: ['충전 kW'] },
  { id: 'S46', name: '유틸리티 현장', group: 'plant', groupLabel: '유틸리티', path: '/apps/power/sites/hanam-plant', apis: [Q, T, A], role: 'ops', elements: ['kind=utility', '수전 KPI'] },
  { id: 'S47', name: '장비 목록', group: 'plant', groupLabel: '유틸리티', path: '/apps/events/sites/hanam-hq/systems/hvac/equipment/ahu-1', apis: [Q, T], role: 'ops', elements: ['AHU-1', '관제점'] },
  { id: 'S48', name: '관제점 추세', group: 'plant', groupLabel: '유틸리티', path: '/apps/events/sites/hanam-hq/systems/hvac/equipment/ahu-1/points/sat', apis: [Q, T, S], role: 'ops', elements: ['급기온도', '추세'] },
  { id: 'S49', name: '비교 기간', group: 'plant', groupLabel: '유틸리티', path: '/apps/power/sites/hanam-hq?view=compare', apis: [Q, T], role: 'ops', elements: ['24h vs 7d', '시리즈 2'] },
  { id: 'S50', name: '로비 종합', group: 'shell', groupLabel: '셸', path: '/lobby', apis: [Q, T, A], role: 'ops', elements: ['삼란', 'KPI', '알람'] },
  { id: 'S51', name: '설정 홈', group: 'settings', groupLabel: '설정', path: '/settings', apis: [Q], role: 'any', elements: ['설정 vs 코드'] },
  { id: 'S52', name: '커넥터', group: 'settings', groupLabel: '설정', path: '/settings?view=connectors', apis: [Q], role: 'any', elements: ['프로토콜', '벤더 비종속'] },
  { id: 'S53', name: '현장 카탈로그', group: 'settings', groupLabel: '설정', path: '/settings?view=sites', apis: [Q], role: 'any', elements: ['현장 목록', '관제점 수'] },
  { id: 'S54', name: '역할 범위', group: 'settings', groupLabel: '설정', path: '/settings?view=roles', apis: [Q], role: 'any', elements: ['운전자', '경영'] },
  { id: 'S55', name: '화면 목록', group: 'settings', groupLabel: '설정', path: '/screens', apis: [Q], role: 'any', elements: ['59면', '별표 1'] },
  { id: 'S56', name: '오픈소스 라이선스', group: 'settings', groupLabel: '설정', path: '/settings?view=licenses', apis: [Q], role: 'any', elements: ['패키지', '라이선스'] },
  { id: 'S57', name: '데이터 없음', group: 'settings', groupLabel: '설정', path: '/apps/parking/sites/yongin-dc', apis: [Q, T], role: 'ops', elements: ['빈 상태', '0 금지'] },
  { id: 'S58', name: '통신 두절', group: 'settings', groupLabel: '설정', path: '/apps/power/sites/suwon-off', apis: [Q, T, A], role: 'ops', elements: ['판정 불가', '두절 알람'] },
  { id: 'S59', name: '판정 불가 모음', group: 'settings', groupLabel: '설정', path: '/quality?view=unknown', apis: [Q, T, F], role: 'ops', elements: ['임차 공백', '면적 없음'] },
]

export function getScreens(): ScreenDef[] {
  return SCREENS
}

export function getScreen(id: string): ScreenDef | undefined {
  return SCREENS.find((item) => item.id === id)
}

export function assertScreenCount(): number {
  return SCREENS.length
}
