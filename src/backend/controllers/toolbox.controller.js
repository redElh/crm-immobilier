import pool from '../config/db.js'
import { notifyVacancesUpdate } from '../services/vacancesNotify.service.js'

const APIMO_BASE = 'https://api.apimo.pro'

function getApimoConfig() {
  const providerId = process.env.APIMO_PROVIDER_ID || '4567'
  const token = process.env.APIMO_TOKEN || 'd07da6e744bb033d1299469f1f6f7334531ec05c'
  const agencyId = process.env.APIMO_AGENCY_ID || '25311'
  return { providerId, token, agencyId }
}

function getAuthHeader() {
  const { providerId, token } = getApimoConfig()
  if (!providerId || !token) return null
  const creds = `${providerId}:${token}`
  return `Basic ${Buffer.from(creds).toString('base64')}`
}

async function ensureVacancesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacances_reservations (
        id SERIAL PRIMARY KEY,
        apimo_property_id VARCHAR(64) NOT NULL,
        reserved_date DATE NOT NULL,
        note TEXT DEFAULT '',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(apimo_property_id, reserved_date)
      )
    `)
  } catch (_) {}
}

async function fetchWithRetry(url, options, retries = 2) {
  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
      }
      return res
    } catch (e) {
      lastErr = e
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
        continue
      }
      throw e
    }
  }
  throw lastErr
}

export async function getVacancesProperties(req, res) {
  try {
    const auth = getAuthHeader()
    if (!auth) {
      return res.status(500).json({ error: 'APIMO credentials not configured', properties: [], total_items: 0 })
    }
    const { agencyId } = getApimoConfig()
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const offset = parseInt(req.query.offset) || 0
    // If caller explicitly passes status, use it; otherwise fetch published (1) only
    // Test showed status=1 already returns 66 category-3 items, so default is fine
    const status = req.query.status !== undefined ? String(req.query.status) : '1'

    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.set('status', status)
    if (req.query.category) params.set('category', String(req.query.category))

    const url = `${APIMO_BASE}/agencies/${agencyId}/properties?${params.toString()}`
    console.log('[Toolbox] fetching APIMO', url)
    const r = await fetchWithRetry(url, {
      method: 'GET',
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      console.error('[Toolbox] APIMO fetch failed', r.status, txt.slice(0, 500))
      return res.status(r.status).json({ error: `APIMO ${r.status}`, properties: [], total_items: 0 })
    }
    const data = await r.json()
    let props = Array.isArray(data.properties) ? data.properties : []
    console.log(`[Toolbox] APIMO returned ${props.length} raw, total_items=${data.total_items}, sample category=${props[0]?.category}`)
    // Filter category === 3 (vacances) — APIMO category 3 = vacances per spec
    const filtered = props.filter(p => Number(p.category) === 3)
    console.log(`[Toolbox] after category=3 filter: ${filtered.length}`)
    res.json({
      properties: filtered,
      total_items: filtered.length,
      total_items_raw: data.total_items,
      timestamp: data.timestamp,
    })
  } catch (e) {
    console.error('[Toolbox] getVacancesProperties error', e)
    res.status(500).json({ error: 'Failed to fetch APIMO properties', properties: [], total_items: 0 })
  }
}

export async function getVacancesReservations(req, res) {
  try {
    const { apimoPropertyId } = req.params
    if (!apimoPropertyId) return res.status(400).json({ error: 'apimoPropertyId required' })
    await ensureVacancesTable()
    const result = await pool.query(
      'SELECT id, apimo_property_id, reserved_date, note, created_by, created_at FROM vacances_reservations WHERE apimo_property_id = $1 ORDER BY reserved_date ASC',
      [String(apimoPropertyId)]
    )
    const dates = result.rows.map(r => ({
      id: r.id,
      date: new Date(r.reserved_date).toISOString().slice(0, 10),
      note: r.note || '',
    }))
    res.json({ propertyId: String(apimoPropertyId), dates })
  } catch (e) {
    if (String(e.code) === '42P01') {
      await ensureVacancesTable()
      return res.json({ propertyId: String(req.params.apimoPropertyId), dates: [] })
    }
    console.error('getVacancesReservations error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function putVacancesReservations(req, res) {
  try {
    await ensureVacancesTable()
    const { apimoPropertyId } = req.params
    const { dates, note } = req.body
    if (!apimoPropertyId) return res.status(400).json({ error: 'apimoPropertyId required' })
    if (!Array.isArray(dates)) return res.status(400).json({ error: 'dates must be array of YYYY-MM-DD' })
    // Validate dates
    const validDates = []
    for (const d of dates) {
      if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
      const dt = new Date(d)
      if (isNaN(dt.getTime())) continue
      validDates.push(d)
    }
    const unique = [...new Set(validDates)].sort()
    const userId = req.user?.id || null

    // Replace strategy: delete dates not in list, insert new ones
    // Keep it transactional
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // delete dates not in new set
      if (unique.length === 0) {
        await client.query('DELETE FROM vacances_reservations WHERE apimo_property_id = $1', [String(apimoPropertyId)])
      } else {
        await client.query(
          `DELETE FROM vacances_reservations WHERE apimo_property_id = $1 AND reserved_date::text NOT IN (${unique.map((_, i) => `$${i + 2}`).join(',')})`,
          [String(apimoPropertyId), ...unique]
        )
        // upsert each date
        for (const d of unique) {
          await client.query(
            `INSERT INTO vacances_reservations (apimo_property_id, reserved_date, note, created_by)
             VALUES ($1, $2::date, $3, $4)
             ON CONFLICT (apimo_property_id, reserved_date) DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()`,
            [String(apimoPropertyId), d, note || '', userId]
          )
        }
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    const result = await pool.query(
      'SELECT reserved_date FROM vacances_reservations WHERE apimo_property_id = $1 ORDER BY reserved_date ASC',
      [String(apimoPropertyId)]
    )
    const finalDates = result.rows.map(r => new Date(r.reserved_date).toISOString().slice(0, 10))
    res.json({
      propertyId: String(apimoPropertyId),
      dates: finalDates,
    })
    // Fire-and-forget: instantly inform www/api.squaremeter.ma (webhook + CF purge + WS)
    notifyVacancesUpdate(String(apimoPropertyId), finalDates).catch(() => {})
  } catch (e) {
    console.error('putVacancesReservations error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function toggleVacancesDate(req, res) {
  try {
    await ensureVacancesTable()
    const { apimoPropertyId } = req.params
    const { date } = req.body
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'date required YYYY-MM-DD' })
    const userId = req.user?.id || null
    const existing = await pool.query(
      'SELECT id FROM vacances_reservations WHERE apimo_property_id = $1 AND reserved_date = $2::date',
      [String(apimoPropertyId), date]
    )
    let reserved
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM vacances_reservations WHERE apimo_property_id = $1 AND reserved_date = $2::date', [String(apimoPropertyId), date])
      reserved = false
    } else {
      await pool.query(
        'INSERT INTO vacances_reservations (apimo_property_id, reserved_date, created_by) VALUES ($1, $2::date, $3) ON CONFLICT DO NOTHING',
        [String(apimoPropertyId), date, userId]
      )
      reserved = true
    }
    const r = await pool.query('SELECT reserved_date FROM vacances_reservations WHERE apimo_property_id = $1 ORDER BY reserved_date ASC', [String(apimoPropertyId)])
    const finalDates = r.rows.map(x => new Date(x.reserved_date).toISOString().slice(0, 10))
    res.json({ date, reserved })
    notifyVacancesUpdate(String(apimoPropertyId), finalDates).catch(() => {})
    return
  } catch (e) {
    console.error('toggleVacancesDate error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}
