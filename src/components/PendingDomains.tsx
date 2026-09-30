import { Link } from 'react-router-dom'
import { PENDING_SLOTS } from '../lib/collection.ts'

type Props = {
  search: string
}

export function PendingDomains({ search }: Props) {
  return (
    <section className="deck pending-domains">
      <h2>연동 대기</h2>
      <p className="kpi-meta">소방·CCTV·주차·EV·엘리베이터는 아직 수집하지 않습니다. 빈칸을 0으로 채우지 않습니다.</p>
      <div className="pending-list">
        {PENDING_SLOTS.map((slot) => {
          const body = (
            <>
              <strong>{slot.label}</strong>
              <span className="kpi-meta">{slot.note}</span>
            </>
          )
          return slot.app ? (
            <Link key={slot.id} className="pending-slot" to={`/apps/${slot.app}${search}`}>
              {body}
            </Link>
          ) : (
            <div key={slot.id} className="pending-slot">
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
