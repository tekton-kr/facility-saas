import { Link } from 'react-router-dom'
import { getScreens } from '../data/screens.ts'
import { useScope } from '../lib/useScope.ts'

export function ScreenIndexPage() {
  const { search } = useScope()
  const screens = getScreens()
  const groups = [...new Set(screens.map((item) => item.groupLabel))]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>화면 목록 · {screens.length}면</h1>
          <p>별표 1. 현장 수로 곱하지 않습니다. 경로는 조회 API와 연동됩니다.</p>
        </div>
      </div>
      {groups.map((group) => (
        <section className="deck" key={group}>
          <h2>{group}</h2>
          <div className="list">
            {screens.filter((item) => item.groupLabel === group).map((item) => (
              <Link key={item.id} className="list-item" to={`${item.path}${item.path.includes('?') ? '' : search}`}>
                <span>
                  <strong>{item.id} · {item.name}</strong>
                  <div className="kpi-meta">{item.elements.join(' · ')}</div>
                  <div className="kpi-meta">{item.apis.join(' · ')}</div>
                </span>
                <span className="kpi-meta">{item.role === 'any' ? '공통' : item.role === 'exec' ? '경영' : '운전자'}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
