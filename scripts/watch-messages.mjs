#!/usr/bin/env node
/**
 * Live message listener: prints sender, receiver, message and md5 hash for
 * every new row in the `messages` table, and keeps polling until Ctrl+C.
 *
 *   node scripts/watch-messages.mjs
 *   node scripts/watch-messages.mjs --from-id 0        # start from history
 *   node scripts/watch-messages.mjs --interval 1000    # poll every second
 *   node scripts/watch-messages.mjs --full             # show sealed ciphertext
 *   node scripts/watch-messages.mjs --once             # one poll then exit
 *
 * Reads DB_* / DATABASE_URL from src/backend/.env (falls back to the root .env).
 * The local Postgres is normally the `crm-db` Docker container on localhost:5432.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let value = m[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[m[1]] = value
  }
  return out
}

const env = {
  ...loadEnv(path.join(ROOT, '.env')),
  ...loadEnv(path.join(ROOT, 'src', 'backend', '.env')),
}

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const option = (name) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}

const full = flag('--full') || flag('-f')
const once = flag('--once')
const intervalMs = Math.max(500, Number(option('--interval') || process.env.POLL_MS || 2000))
const fromIdArg = option('--from-id')

const MESSAGES_SQL = `
  SELECT m.id,
         m.conversation_id,
         m.kind,
         m.body,
         m.created_at,
         md5(m.body) AS hash,
         CONCAT(s.first_name, ' ', s.last_name) AS sender,
         COALESCE((
           SELECT string_agg(DISTINCT CONCAT(r.first_name, ' ', r.last_name), ', ')
           FROM conversation_participants rp
           JOIN users r ON r.id = rp.user_id
           WHERE rp.conversation_id = m.conversation_id
             AND rp.user_id <> m.sender_id
         ), '') AS receiver
  FROM messages m
  JOIN users s ON s.id = m.sender_id
  WHERE m.id > $1
  ORDER BY m.id
`

function makePool() {
  if (env.DATABASE_URL) {
    return new pg.Pool({ connectionString: env.DATABASE_URL })
  }
  return new pg.Pool({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT || 5432),
  })
}

function formatDate(value) {
  return new Date(value).toLocaleTimeString('fr-FR', { hour12: false })
}

function formatMessage(row) {
  if (row.kind === 'sealed' && !full) return '[message chiffré E2EE]'
  const body = row.body ?? ''
  if (body.length > 0) return body
  return row.kind === 'call' ? '[appel]' : '(vide)'
}

function printRow(row) {
  console.log(
    `\n[${formatDate(row.created_at)}] #${row.id} conv#${row.conversation_id} ` +
      `${row.sender} -> ${row.receiver || '?'} (${row.kind})`
  )
  const lines = String(formatMessage(row)).replace(/\r\n/g, '\n').split('\n')
  console.log(`  message: ${lines[0]}`)
  for (const line of lines.slice(1)) console.log(`           ${line}`)
  console.log(`  md5:     ${row.hash}`)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pool = makePool()
let lastId = 0
let running = true

async function stop() {
  if (!running) return
  running = false
  console.log('\nListener stopped.')
  try {
    await pool.end()
  } catch {
    // ignore
  }
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

try {
  if (fromIdArg !== undefined) {
    lastId = Number(fromIdArg) || 0
  } else {
    const { rows } = await pool.query('SELECT COALESCE(MAX(id), 0) AS id FROM messages')
    lastId = Number(rows[0].id)
  }
} catch (error) {
  console.error(`[watch] cannot read messages: ${error.message}`)
  await pool.end().catch(() => {})
  process.exit(1)
}

const host = env.DATABASE_URL ? 'DATABASE_URL' : `${env.DB_HOST}:${env.DB_PORT}`
console.log(`Listening for messages on ${env.DB_NAME || 'database'} (${host}).`)
console.log(`Starting after message id ${lastId}. Press Ctrl+C to stop.\n`)

while (running) {
  try {
    const { rows } = await pool.query(MESSAGES_SQL, [lastId])
    for (const row of rows) {
      printRow(row)
      if (Number(row.id) > lastId) lastId = Number(row.id)
    }
  } catch (error) {
    console.error(`[watch] query failed: ${error.message}`)
  }

  if (once) break
  await sleep(intervalMs)
}

if (once) {
  await pool.end().catch(() => {})
}
