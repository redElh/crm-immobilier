import pool from '../config/db.js'

const APIMO_BASE = 'https://api.apimo.pro'

function getApimoConfig() {
  const providerId = process.env.APIMO_PROVIDER_ID || '4567'
  const token = process.env.APIMO_TOKEN || 'd07da6e744bb033d1299469f1f6f7334531ec05c'
  const agencyId = process.env.APIMO_AGENCY_ID || '25311'
  return { providerId, token, agencyId }
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

// --- Public: reserved days for one property ---
export async function publicGetReservations(req, res) {
  try {
    await ensureVacancesTable()
    const { apimoPropertyId } = req.params
    if (!apimoPropertyId || !/^[A-Za-z0-9_-]+$/.test(apimoPropertyId)) {
      return res.status(400).json({ error: 'Invalid propertyId' })
    }
    const result = await pool.query(
      'SELECT reserved_date FROM vacances_reservations WHERE apimo_property_id = $1 ORDER BY reserved_date ASC',
      [String(apimoPropertyId)]
    )
    const dates = result.rows.map(r => new Date(r.reserved_date).toISOString().slice(0, 10))
    res.set({
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
    })
    return res.json({ propertyId: String(apimoPropertyId), reservedDates: dates, count: dates.length })
  } catch (e) {
    if (String(e.code) === '42P01') {
      await ensureVacancesTable()
      return res.json({ propertyId: String(req.params.apimoPropertyId), reservedDates: [], count: 0 })
    }
    console.error('publicGetReservations error', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// --- Public: batch (query ?ids=1,2,3 or ?propertyIds=...) ---
export async function publicGetReservationsBatch(req, res) {
  try {
    await ensureVacancesTable()
    const raw = req.query.ids || req.query.propertyIds || req.query.propertyId || ''
    if (!raw) return res.status(400).json({ error: 'Missing ids query param. Use ?ids=86686477,86686478' })
    const ids = String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(id => /^[A-Za-z0-9_-]+$/.test(id))
      .slice(0, 50)
    if (ids.length === 0) return res.status(400).json({ error: 'No valid ids' })

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
    const result = await pool.query(
      `SELECT apimo_property_id, reserved_date FROM vacances_reservations WHERE apimo_property_id IN (${placeholders}) ORDER BY apimo_property_id, reserved_date ASC`,
      ids
    )
    const map = {}
    ids.forEach(id => (map[id] = []))
    for (const r of result.rows) {
      const pid = String(r.apimo_property_id)
      const d = new Date(r.reserved_date).toISOString().slice(0, 10)
      if (map[pid]) map[pid].push(d)
      else map[pid] = [d]
    }
    res.set({ 'Cache-Control': 'public, max-age=60' })
    return res.json({ reservations: map })
  } catch (e) {
    console.error('publicGetReservationsBatch error', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// --- Public: full calendar (all properties) ---
export async function publicGetCalendar(req, res) {
  try {
    await ensureVacancesTable()
    const result = await pool.query(
      'SELECT apimo_property_id, reserved_date FROM vacances_reservations ORDER BY apimo_property_id, reserved_date ASC'
    )
    const calendar = {}
    for (const r of result.rows) {
      const pid = String(r.apimo_property_id)
      const d = new Date(r.reserved_date).toISOString().slice(0, 10)
      if (!calendar[pid]) calendar[pid] = []
      calendar[pid].push(d)
    }
    const totalDates = Object.values(calendar).reduce((s, arr) => s + arr.length, 0)
    res.set({ 'Cache-Control': 'public, max-age=60' })
    return res.json({
      calendar,
      totalProperties: Object.keys(calendar).length,
      totalDates,
    })
  } catch (e) {
    console.error('publicGetCalendar error', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// --- Public: vacances properties list (category 3) — proxied, cached 5min ---
let _propertiesCache = null
let _propertiesCacheAt = 0
export async function publicGetVacancesProperties(req, res) {
  try {
    const now = Date.now()
    if (_propertiesCache && now - _propertiesCacheAt < 5 * 60 * 1000) {
      res.set({ 'Cache-Control': 'public, max-age=300' })
      return res.json(_propertiesCache)
    }
    const { agencyId, providerId, token } = getApimoConfig()
    if (!providerId || !token) return res.status(500).json({ error: 'APIMO not configured' })
    const auth = `Basic ${Buffer.from(`${providerId}:${token}`).toString('base64')}`
    const limit = Math.min(parseInt(req.query.limit) || 100, 100)
    const offset = parseInt(req.query.offset) || 0
    const status = req.query.status !== undefined ? String(req.query.status) : '1'
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.set('status', status)
    const url = `${APIMO_BASE}/agencies/${agencyId}/properties?${params.toString()}`
    const r = await fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      console.error('[Public Toolbox] APIMO fetch failed', r.status, txt.slice(0, 300))
      return res.status(502).json({ error: `APIMO ${r.status}` })
    }
    const data = await r.json()
    const props = (Array.isArray(data.properties) ? data.properties : []).filter(p => Number(p.category) === 3)
    // Return minimal fields for public consumption
    const minimal = props.map(p => ({
      id: String(p.id),
      reference: String(p.reference ?? p.id),
      category: p.category,
      city: p.city?.name || null,
      price: p.price?.value ?? null,
      currency: p.price?.currency || 'MAD',
      pictures: (p.pictures || []).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 1).map(pic => pic.url),
      title: (p.comments?.find(c => c.language === 'fr') || p.comments?.[0])?.title || `Bien #${p.id}`,
    }))
    const payload = { properties: minimal, total: minimal.length, total_raw: data.total_items }
    _propertiesCache = payload
    _propertiesCacheAt = now
    res.set({ 'Cache-Control': 'public, max-age=300' })
    return res.json(payload)
  } catch (e) {
    console.error('publicGetVacancesProperties error', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
