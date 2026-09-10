import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const src = readFileSync(new URL('../src/data/screens.ts', import.meta.url), 'utf8')
const ids = [...src.matchAll(/id: 'S(\d+)'/g)].map((item) => item[1])
const findings = []

if (ids.length !== 59) {
  findings.push({ id: 'S-COUNT', severity: 'high', item: '별표 1 화면 수', detail: `${ids.length}면. 59면이어야 함.` })
}

const auth = readFileSync(new URL('../src/lib/auth.ts', import.meta.url), 'utf8')
if (/password:\s*'/.test(auth) || /password:\s*"/.test(auth)) {
  findings.push({ id: 'CRED-1', severity: 'high', item: '자격증명 하드코딩', detail: 'src/lib/auth.ts에 비밀번호 리터럴이 있습니다.' })
}

const ui = [
  readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFileSync(new URL('../src/pages/LoginPage.tsx', import.meta.url), 'utf8'),
].join('\n')
if (/setPoint|스케줄 변경|기동\/정지/.test(ui) && /type="submit"[^>]*>제어/.test(ui)) {
  findings.push({ id: 'WRITE-UI', severity: 'high', item: '쓰기 UI', detail: '제어 제출 버튼이 있습니다.' })
}

const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: true })
let auditHigh = 0
try {
  const parsed = JSON.parse(audit.stdout || '{}')
  auditHigh = (parsed.metadata?.vulnerabilities?.high ?? 0) + (parsed.metadata?.vulnerabilities?.critical ?? 0)
} catch {
  findings.push({ id: 'AUDIT', severity: 'info', item: 'npm audit', detail: 'audit JSON을 파싱하지 못했습니다.' })
}

mkdirSync(new URL('../docs', import.meta.url), { recursive: true })
const report = {
  checkedAt: new Date().toISOString(),
  screens: ids.length,
  npmAuditHighOrCritical: auditHigh,
  findings,
  writePath: 'POST /api/v1/control 은 410을 반환해야 함 (런타임 재확인)',
}
writeFileSync(new URL('../docs/security-check.json', import.meta.url), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (findings.some((item) => item.severity === 'high')) process.exitCode = 1
