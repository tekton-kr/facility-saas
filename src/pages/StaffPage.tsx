import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import { getSession } from '../lib/auth.ts'
import { visibleSites } from '../lib/siteScope.ts'
import {
  STAFF_RANKS,
  formatPhone,
  listStaff,
  subscribeStaff,
  unassignStaff,
  upsertStaff,
  type StaffRank,
  type StaffRecord,
} from '../lib/staffRoster.ts'
import { useScope } from '../lib/useScope.ts'

const SAMPLE = [
  { name: '김현장', phone: '010-1234-5678', rank: '시설직원' },
  { name: '이소장', phone: '010-2222-3333', rank: '관리소장' },
  { name: '최시설', phone: '010-3333-4444', rank: '방재실' },
]

const RANK_ORDER = new Map(STAFF_RANKS.map((rank, index) => [rank, index]))

function canManage(): boolean {
  return Boolean(getSession())
}

export function StaffPage() {
  const { siteId, search } = useScope()
  const [rows, setRows] = useState<StaffRecord[]>(() => listStaff(getSession()?.tenantId ?? 'tekton'))
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [rank, setRank] = useState<StaffRank>('시설직원')
  const [error, setError] = useState('')
  const site = siteId ? getSite(siteId) : undefined
  const manager = canManage()

  useEffect(() => subscribeStaff(() => setRows(listStaff(getSession()?.tenantId ?? 'tekton'))), [])

  if (!siteId) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="" title="직원관리">
        <p className="manage-note">건물을 고르면 그 현장 직원이 열립니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => (
                <Link key={item.id} className="manage-row" to={`/sites/${item.id}/staff${search}`}>
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.location || '위치 미등록'}</em>
                  </span>
                  <b>열기</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </ManageFrame>
    )
  }

  if (!site) {
    return (
      <ManageFrame kicker="직원" title="현장을 찾지 못했습니다">
        <div className="empty">배정 목록에 없는 건물입니다.</div>
      </ManageFrame>
    )
  }

  const people = rows
    .filter((item) => item.siteIds.includes(site.id))
    .sort((a, b) => (RANK_ORDER.get(a.rank) ?? 9) - (RANK_ORDER.get(b.rank) ?? 9) || a.name.localeCompare(b.name, 'ko'))

  function resetForm() {
    setEditing(null)
    setName('')
    setPhone('')
    setRank('시설직원')
    setError('')
  }

  function onEdit(item: StaffRecord) {
    setEditing(item.phone)
    setName(item.name)
    setPhone(item.phone)
    setRank(item.rank)
    setError('')
  }

  function onSave(event: FormEvent) {
    event.preventDefault()
    const current = editing ? rows.find((item) => item.phone === editing) : undefined
    const siteIds = current ? [...new Set([...current.siteIds, site!.id])] : [site!.id]
    try {
      upsertStaff({
        phone,
        name,
        rank,
        tenantId: getSession()?.tenantId ?? current?.tenantId ?? 'tekton',
        siteIds,
        previousPhone: editing ?? undefined,
      })
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했습니다.')
    }
  }

  function onRemove(item: StaffRecord) {
    setError('')
    try {
      unassignStaff(item.phone, site!.id)
      if (editing === item.phone) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : '빼지 못했습니다.')
    }
  }

  return (
    <ManageFrame kicker="" title="직원관리">
      <p className="manage-note">
        {site.name} 직원입니다. 이름, 연락처, 직급을 등록하고 뺄 수 있습니다. 바꾼 내용은 이 브라우저에 남고, 로그인 계정 발급은 따로입니다.
      </p>
      <section className="manage-card">
        {people.length === 0 ? (
          <>
            <p className="manage-note">이 건물에 등록된 직원이 없습니다. 아래 표는 예시입니다.</p>
            <table className="asset-table">
              <thead>
                <tr><th>성함</th><th>연락처</th><th>직급</th></tr>
              </thead>
              <tbody>
                {SAMPLE.map((item) => (
                  <tr key={item.phone}>
                    <td>{item.name}<span className="sample-tag">예시</span></td>
                    <td>{item.phone}</td>
                    <td>{item.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <table className="asset-table">
            <thead>
              <tr><th>성함</th><th>연락처</th><th>직급</th><th></th></tr>
            </thead>
            <tbody>
              {people.map((item) => (
                <tr key={item.phone}>
                  <td>{item.name}</td>
                  <td>{formatPhone(item.phone)}</td>
                  <td>{item.rank}</td>
                  <td>
                    {manager ? (
                      <span className="staff-actions">
                        <button type="button" onClick={() => onEdit(item)}>고치기</button>
                        <button type="button" onClick={() => onRemove(item)}>삭제</button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {manager ? (
          <form className="cal-note" onSubmit={onSave}>
            <label htmlFor="staff-name">성함</label>
            <input id="staff-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" />
            <label htmlFor="staff-phone">연락처</label>
            <input
              id="staff-phone"
              inputMode="numeric"
              autoComplete="tel"
              value={formatPhone(phone)}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="010-1234-5678"
            />
            <label htmlFor="staff-rank">직급</label>
            <select id="staff-rank" value={rank} onChange={(event) => setRank(event.target.value as StaffRank)}>
              {STAFF_RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className="staff-actions">
              <button type="submit">{editing ? '저장' : '추가'}</button>
              {editing ? <button type="button" onClick={resetForm}>취소</button> : null}
            </div>
          </form>
        ) : null}
        {error ? <p className="manage-note" role="alert">{error}</p> : null}
      </section>
    </ManageFrame>
  )
}
