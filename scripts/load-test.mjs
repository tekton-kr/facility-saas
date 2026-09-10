import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

function loadDotEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const index = line.indexOf('=')
      if (index < 1) continue
      const key = line.slice(0, index)
      const value = line.slice(index + 1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    /* optional */
  }
}

loadDotEnv()

const base = process.env.BASE_URL || process.env.API_ORIGIN || 'http://localhost:5173'
const email = process.env.CHECK_EMAIL || process.env.DEMO_OPS_EMAIL || ''
const password = process.env.CHECK_PASSWORD || process.env.DEMO_OPS_PASSWORD || ''
const concurrency = Number(process.env.LOAD_CONCURRENCY || 20)
const total = Number(process.env.LOAD_REQUESTS || 200)

async function login() {
  const response = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(`login ${response.status}`)
  return response.json()
}

async function timed(token) {
  const start = performance.now()
  const response = await fetch(`${base}/api/v1/snapshot`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const ms = performance.now() - start
  if (!response.ok) throw new Error(`snapshot ${response.status}`)
  return ms
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index]
}

const { token } = await login()
const control = await fetch(`${base}/api/v1/control`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: '{}',
})

const samples = []
let cursor = 0
async function worker() {
  while (cursor < total) {
    cursor += 1
    samples.push(await timed(token))
  }
}

const started = Date.now()
await Promise.all(Array.from({ length: concurrency }, () => worker()))
const elapsed = Date.now() - started
const result = {
  base,
  concurrency,
  total,
  elapsedMs: elapsed,
  rps: Number((total / (elapsed / 1000)).toFixed(2)),
  p50: Number(percentile(samples, 50).toFixed(1)),
  p95: Number(percentile(samples, 95).toFixed(1)),
  p99: Number(percentile(samples, 99).toFixed(1)),
  writeStatus: control.status,
  pass: control.status === 410 && percentile(samples, 95) < 800,
  samples,
}

mkdirSync(new URL('../docs', import.meta.url), { recursive: true })
writeFileSync(new URL('../docs/load-test-raw.json', import.meta.url), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ ...result, samples: undefined }, null, 2))
if (!result.pass) process.exitCode = 1
