import type { AppId, Finding } from '../types/domain.ts'
import { isSiteAllowed } from './siteScope.ts'

const SOURCE: Finding[] = [
    {
      id: 'f1',
      title: 'AHU-1 외기냉방 미사용 추정',
      narrative: '하남 본사 AHU-1이 외기냉방이 가능한 구간에서도 열원을 쓰는 패턴입니다. 스케줄·외기온 가정이며 실측 절감이 아닙니다.',
      siteId: 'hanam-hq',
      impact: '에너지',
      certainty: 'estimate',
      estimatedSaving: 420,
      audience: 'both',
      note: '스케줄·외기온 가정. Clockworks식 우선순위이며 실측 절감이 아님',
    },
    {
      id: 'f2',
      title: '야간 열원 운전이 이어짐',
      narrative: '하남 열원 열교환기가 야간에도 출구온도를 유지합니다. 부하 곡선 가정이 있어 경영 판단용 추정입니다.',
      siteId: 'hanam-plant',
      impact: '에너지',
      certainty: 'estimate',
      estimatedSaving: 180,
      audience: 'exec',
      note: '유틸리티 현장. 차단·보호 동작은 헤드엔드에 남김',
    },
    {
      id: 'f3',
      title: '임차 구간 검침 공백',
      narrative: '수원 오피스 임차 구간 전력량에 실측이 없습니다. 0으로 채우지 않고 판정 불가로 둡니다.',
      siteId: 'suwon-off',
      impact: '데이터',
      certainty: 'unknown',
      audience: 'both',
      note: '실측 없음. 0으로 채우지 않음',
    },
    {
      id: 'f4',
      title: '용인 물류 전력량 수신 지연',
      narrative: '용인 물류 금일 전력량이 마지막 수신 이후 지연입니다. 수치는 지연 배지로만 읽어야 합니다.',
      siteId: 'yongin-dc',
      impact: '데이터',
      certainty: 'stale',
      audience: 'ops',
      note: '검침 게이트웨이 지연',
    },
  ]

let findingCache: Finding[] | null = null

export function generateFindings(): Finding[] {
  return SOURCE
}

export function hydrateFindings(items: Finding[]) {
  findingCache = items
}

export function findingsForScope(options: { app: AppId; siteId?: string }): Finding[] {
  const all = findingCache ?? SOURCE
  return all.filter((item) => {
    if (!isSiteAllowed(item.siteId)) return false
    if (options.siteId && item.siteId !== options.siteId) return false
    if (options.app === 'events') return true
    if (options.app === 'power' || options.app === 'metering') return item.impact === '에너지' || item.impact === '데이터'
    if (options.app === 'solar') return item.impact === '에너지'
    return false
  })
}
