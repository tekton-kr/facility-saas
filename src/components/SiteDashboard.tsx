import type { AppId } from '../types/domain.ts'
import type { SiteDef } from '../types/domain.ts'
import { alarmsForScope } from '../lib/telemetry.ts'
import { SiteMap } from './SiteMap.tsx'

const COPY: Record<'events' | 'power' | 'metering' | 'solar', { title: string; note: string; metrics: string[] }> = {
  events: {
    title: '설비자동제어',
    note: '운전과 실내 환경을 먼저 봅니다. 값이 들어오면 이 칸이 채워집니다.',
    metrics: ['실내온도', '실내습도', '급기온도', '운전', '설정온도', '외기온도'],
  },
  power: {
    title: '전력',
    note: '수전 전압·전류·전력을 한 화면에 둡니다.',
    metrics: ['A상 전압', 'B상 전압', 'C상 전압', '전류', '유효전력', '역률'],
  },
  metering: {
    title: '원격검침',
    note: '전력량과 수도를 원격으로 읽습니다. 없는 값은 0으로 채우지 않습니다.',
    metrics: ['전력량', '수도', '가스', '열량', '전일 전력량', '전일 수도'],
  },
  solar: {
    title: '제로에너지',
    note: '사용과 생산을 나란히 두고, 자립 여부를 봅니다.',
    metrics: ['사용 에너지', '생산 에너지', '탄소', '자립률', '금일 사용', '금일 생산'],
  },
}

export function SiteDashboard({ site, service }: { site: SiteDef; service: AppId }) {
  const focus = service === 'power' || service === 'metering' || service === 'solar' ? service : 'events'
  const copy = COPY[focus]
  const alarms = alarmsForScope({ siteId: site.id }).filter((item) => item.severity === 'critical' || item.severity === 'warning')

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <p className="page-kicker">{site.name}</p>
          <h1>{site.name} · {copy.title}</h1>
          <p>{site.location ? `${site.location}. ` : ''}{copy.note}</p>
        </div>
      </header>
      <section className="dash-stats" aria-label="현장 상태">
        <article>
          <span>이상</span>
          <strong>{alarms.length}</strong>
          <em>{alarms.length > 0 ? '시설팀 확인' : '열린 위험·주의 없음'}</em>
        </article>
        <article>
          <span>수신</span>
          <strong>대기</strong>
          <em>현장 계측이 아직 없습니다</em>
        </article>
        <article>
          <span>설비</span>
          <strong>{site.systems.length}</strong>
          <em>{site.systems.length > 0 ? '구성됨' : '자동제어 연동 대기'}</em>
        </article>
        <article>
          <span>서비스</span>
          <strong>{copy.title}</strong>
          <em>설비자동제어가 기본입니다</em>
        </article>
      </section>
      <SiteMap
        sites={[{
          id: site.id,
          name: site.name,
          location: site.location,
          lat: site.lat,
          lng: site.lng,
        }]}
      />
      <div className="dash-grid">
        <section className="dash-live" aria-label="실시간">
          <h2>실시간</h2>
          <div className="dash-metrics">
            {copy.metrics.map((label) => (
              <article key={label}>
                <strong>—</strong>
                <span>{label}</span>
                <em>수신 대기</em>
              </article>
            ))}
          </div>
        </section>
        <section className="dash-side" aria-label="상태">
          <h2>상태</h2>
          <ul>
            <li><i className="is-wait" />수신 대기</li>
            <li><i className={alarms.length > 0 ? 'is-warn' : 'is-ok'} />{alarms.length > 0 ? `이상 ${alarms.length}` : '이상 없음'}</li>
            <li><i className="is-ok" />제어는 현장 설비에 둡니다</li>
          </ul>
          {alarms.length > 0 ? (
            <div className="dash-alarms">
              {alarms.slice(0, 4).map((alarm) => (
                <p key={alarm.id}>{alarm.title}</p>
              ))}
            </div>
          ) : (
            <p className="dash-quiet">계측이 연결되면 온도와 전력량이 이 자리에 들어옵니다.</p>
          )}
        </section>
      </div>
    </div>
  )
}
