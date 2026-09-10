import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

function loadDotEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const index = line.indexOf('=')
      if (index < 1) continue
      const key = line.slice(0, index)
      if (!process.env[key]) process.env[key] = line.slice(index + 1)
    }
  } catch {
    /* optional */
  }
}

loadDotEnv()
const base = process.env.BASE_URL || process.env.API_ORIGIN || 'http://localhost:5173'
const email = process.env.CHECK_EMAIL || process.env.DEMO_OPS_EMAIL
const password = process.env.CHECK_PASSWORD || process.env.DEMO_OPS_PASSWORD

const accounts = await fetch(`${base}/api/v1/auth/accounts`).then((item) => item.json())
const login = await fetch(`${base}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!login.ok) {
  console.error(await login.text())
  process.exit(1)
}
const { token } = await login.json()
const snap = await fetch(`${base}/api/v1/snapshot`, { headers: { Authorization: `Bearer ${token}` } }).then((item) => item.json())
const screens = await fetch(`${base}/api/v1/screens`, { headers: { Authorization: `Bearer ${token}` } }).then((item) => item.json())
const write = await fetch(`${base}/api/v1/control`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: '{}',
})
const unauthorized = await fetch(`${base}/api/v1/snapshot`)

const result = {
  accounts: accounts.accounts?.length ?? 0,
  accountHasPassword: JSON.stringify(accounts).includes('password'),
  screens: screens.count,
  sites: snap.catalog?.sites?.length ?? 0,
  telemetryKeys: Object.keys(snap.telemetry ?? {}).length,
  alarms: snap.alarms?.length ?? 0,
  writeStatus: write.status,
  unauthStatus: unauthorized.status,
}

mkdirSync(new URL('../docs', import.meta.url), { recursive: true })
writeFileSync(new URL('../docs/api-verify.json', import.meta.url), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (result.screens !== 59 || result.writeStatus !== 410 || result.unauthStatus !== 401 || result.accountHasPassword) {
  process.exitCode = 1
}
