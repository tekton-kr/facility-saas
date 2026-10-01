export const DEMO_SERVICES = [
  { id: 'events' as const, label: '설비자동제어', value: '24.6', unit: '°C', note: '실내온도 · 운전 18대' },
  { id: 'power' as const, label: '전력', value: '428', unit: 'kW', note: '현재 전력 · 역률 0.96' },
  { id: 'metering' as const, label: '원격검침', value: '3,842', unit: 'kWh', note: '금일 전력량 · 수도 42 m³' },
  { id: 'solar' as const, label: '제로에너지', value: '18', unit: '%', note: '자립률 · 발전 186 kWh' },
]

export const DEMO_SITES = [
  { id: 'songdo-ait', name: '송도 AIT센터', location: '인천 연수구 송도동', lat: 37.3826, lng: 126.6564, tone: 'ok' as const, badge: '정상' },
  { id: 'hanam-misa', name: '하남 미사', location: '경기 하남시 미사강변동', lat: 37.5624, lng: 127.1918, tone: 'warn' as const, badge: '이상 2' },
  { id: 'pangyo-hq', name: '판교 사옥', location: '경기 성남시 분당구', lat: 37.3948, lng: 127.1112, tone: 'wait' as const, badge: '대기' },
  { id: 'yongin-lab', name: '용인 연구소', location: '경기 용인시 기흥구', lat: 37.2673, lng: 127.1002, tone: 'ok' as const, badge: '정상' },
]

export const DEMO_ALARMS = [
  { id: 'a1', siteId: 'hanam-misa', siteName: '하남 미사', title: '공조기 급기온도 이탈', at: '10/01 19:12' },
  { id: 'a2', siteId: 'hanam-misa', siteName: '하남 미사', title: '수전 역률 저하', at: '10/01 18:41' },
  { id: 'a3', siteId: 'pangyo-hq', siteName: '판교 사옥', title: '원격검침 수신 대기', at: '10/01 16:05' },
  { id: 'a4', siteId: 'songdo-ait', siteName: '송도 AIT센터', title: '옥상 인버터 통신 지연', at: '10/01 11:28' },
  { id: 'a5', siteId: 'yongin-lab', siteName: '용인 연구소', title: '냉각수 펌프 야간 운전', at: '09/30 23:16' },
]

export const DEMO_GAUGES = [
  { label: '누설전류 1', value: 25, max: 100, unit: 'mA', color: '#3dd6ff' },
  { label: '누설전류 2', value: 15, max: 100, unit: 'mA', color: '#67e8f9' },
  { label: '수전 전류', value: 45, max: 80, unit: 'A', color: '#f5c15a' },
  { label: '기계실 온도', value: 32, max: 60, unit: '°C', color: '#6ee7b7' },
]

export const DEMO_WEEK_LABELS = ['09/25', '09/26', '09/27', '09/28', '09/29', '09/30', '10/01']
export const DEMO_WEEK_VALUES = [3, 5, 2, 6, 4, 7, 4]

export const DEMO_POWER_LABELS = ['00', '03', '06', '09', '12', '15', '18', '21']
export const DEMO_POWER_VALUES = [180, 160, 210, 360, 510, 470, 428, 240]
