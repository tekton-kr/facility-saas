import { Link } from 'react-router-dom'
import { useScope } from '../lib/useScope.ts'

export function ForbiddenPage() {
  const { search } = useScope()
  return (
    <div className="panel">
      <h1>권한 없음</h1>
      <p>이 역할에서는 해당 화면을 열 수 없습니다. 레이아웃은 유지하고 본문만 막습니다.</p>
      <p><Link to={`/${search}`}>홈</Link></p>
    </div>
  )
}
