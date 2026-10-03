import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ManageFrame } from '../components/ManageFrame.tsx'
import { getSite } from '../lib/catalog.ts'
import {
  addPhotoSheet,
  fileToJpeg,
  removePhotoSheet,
  savedSheets,
  sheetDateLabel,
  sheetsFor,
  subscribePhotoSheets,
  type PhotoSheet,
} from '../lib/photoSheet.ts'
import { downloadPhotoSheet } from '../lib/photoSheetExcel.ts'
import { visibleSites } from '../lib/siteScope.ts'
import { useScope } from '../lib/useScope.ts'

function seoulToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function Paper({ item, page }: { item: PhotoSheet; page: number }) {
  return (
    <article className={`sheet-paper${item.sample ? ' is-sample' : ''}`}>
      <header>
        <h2>사진대지</h2>
        {item.sample ? <span className="sample-tag sheet-sample">예시</span> : (
          <button type="button" onClick={() => removePhotoSheet(item.id)}>빼기</button>
        )}
      </header>
      <img src={item.image} alt={item.caption} />
      <table className="sheet-table">
        <tbody>
          <tr>
            <th>공종명</th>
            <td>{item.trade}</td>
            <th>촬영일자</th>
            <td>{sheetDateLabel(item.takenOn)}</td>
          </tr>
          <tr>
            <th>사진설명</th>
            <td colSpan={3}>{item.caption}</td>
          </tr>
        </tbody>
      </table>
      <p className="sheet-page-no">{page} 페이지</p>
    </article>
  )
}

export function PhotoSheetPage() {
  const { siteId, search } = useScope()
  const site = siteId ? getSite(siteId) : undefined
  const [rows, setRows] = useState<PhotoSheet[]>(() => siteId ? sheetsFor(siteId) : [])
  const [trade, setTrade] = useState('')
  const [takenOn, setTakenOn] = useState(seoulToday)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => subscribePhotoSheets(() => {
    if (siteId) setRows(sheetsFor(siteId))
  }), [siteId])

  if (!siteId) {
    const sites = visibleSites()
    return (
      <ManageFrame kicker="" title="사진대지">
        <p className="manage-note">건물을 고르면 그 현장 사진대지가 열립니다.</p>
        <section className="manage-card">
          {sites.length === 0 ? <div className="empty">배정된 건물이 없습니다.</div> : (
            <div className="manage-list">
              {sites.map((item) => (
                <Link key={item.id} className="manage-row" to={`/sites/${item.id}/sheets${search}`}>
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
    return <ManageFrame kicker="사진대지" title="현장을 찾지 못했습니다"><div className="empty">배정 목록에 없는 건물입니다.</div></ManageFrame>
  }

  const sample = rows.length > 0 && rows.every((item) => item.sample)
  const stored = savedSheets(site.id)

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('사진을 고르십시오.')
      return
    }
    try {
      const image = await fileToJpeg(file)
      addPhotoSheet({ siteId: site!.id, trade, takenOn, caption, image })
      setTrade('')
      setCaption('')
      setFile(null)
      const input = document.getElementById('sheet-file') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : '사진을 저장하지 못했습니다.')
    }
  }

  async function onExport() {
    setExporting(true)
    setError('')
    try {
      await downloadPhotoSheet(stored.length > 0 ? stored : rows, site!.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : '엑셀 파일을 만들지 못했습니다.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <ManageFrame kicker="" title="사진대지">
      <p className="manage-note">작업 사진을 보고할 때 씁니다. 등록한 사진은 이 브라우저에 남고, 예시는 받은 보고가 아닙니다.</p>
      <div className="sheet-actions">
        <button type="button" onClick={() => void onExport()} disabled={exporting || rows.length === 0}>
          {exporting ? '만드는 중' : sample ? '예시 엑셀' : '엑셀로 보내기'}
        </button>
      </div>
      {error ? <p className="manage-note">{error}</p> : null}
      <div className="sheet-list">
        {rows.map((item, index) => <Paper key={item.id} item={item} page={index + 1} />)}
      </div>
      <section className="manage-card">
        <h2>사진 올리기</h2>
        <form className="cal-note" onSubmit={(event) => void onAdd(event)}>
          <label htmlFor="sheet-trade">공종명</label>
          <input id="sheet-trade" value={trade} onChange={(event) => setTrade(event.target.value)} placeholder="한 일" required />
          <label htmlFor="sheet-date">촬영일자</label>
          <input id="sheet-date" type="date" value={takenOn} onChange={(event) => setTakenOn(event.target.value)} required />
          <label htmlFor="sheet-caption">사진설명</label>
          <input id="sheet-caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="사진에 보이는 내용" required />
          <label htmlFor="sheet-file">사진</label>
          <input id="sheet-file" type="file" accept="image/*" capture="environment" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button type="submit">추가</button>
        </form>
      </section>
    </ManageFrame>
  )
}
