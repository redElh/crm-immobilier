import express from 'express'
import cors from 'cors'
import {
  publicGetReservations,
  publicGetReservationsBatch,
  publicGetCalendar,
  publicGetVacancesProperties,
} from '../controllers/toolbox.public.controller.js'

const router = express.Router()

// CORS for public API — allow squaremeter.ma + localhost + no-origin (server-to-server)
const PUBLIC_ALLOWED_ORIGINS = [
  'https://squaremeter.ma',
  'https://www.squaremeter.ma',
  'https://squaremeter-website.vercel.app',
]

const publicCors = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (PUBLIC_ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true)
    // Allow any squaremeter.ma subdomain
    if (/^https:\/\/.*\.squaremeter\.ma$/.test(origin)) return callback(null, true)
    // For public read API, allow all origins but don't send credentials
    return callback(null, true)
  },
  credentials: false,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
})

// Optional API key — if PUBLIC_VACANCES_API_KEY is set, require X-API-Key header
function optionalApiKey(req, res, next) {
  const required = process.env.PUBLIC_VACANCES_API_KEY
  if (!required) return next()
  const sent = req.headers['x-api-key'] || req.query.api_key
  if (sent === required) return next()
  return res.status(401).json({ error: 'Invalid API key. Provide X-API-Key header.' })
}

// Simple in-memory rate limit: 120 req / 15min per IP
const hits = new Map()
function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const max = 120
  let entry = hits.get(ip)
  if (!entry || now - entry.start > windowMs) entry = { start: now, count: 0 }
  entry.count += 1
  hits.set(ip, entry)
  if (entry.count > max) {
    res.set('Retry-After', String(Math.ceil((entry.start + windowMs - now) / 1000)))
    return res.status(429).json({ error: 'Too many requests, try later' })
  }
  next()
}
setInterval(() => {
  const now = Date.now()
  for (const [ip, e] of hits.entries()) if (now - e.start > 15 * 60 * 1000) hits.delete(ip)
}, 60 * 1000).unref()

router.use(publicCors)
router.use(rateLimit)
router.use(optionalApiKey)

// Read-only public endpoints
router.get('/vacances/properties', publicGetVacancesProperties)
router.get('/vacances/reservations', publicGetReservationsBatch) // ?ids=1,2  must be before :id
router.get('/vacances/calendar', publicGetCalendar) // full calendar
router.get('/vacances/reservations/:apimoPropertyId', publicGetReservations)

// Health for public namespace
router.get('/health', (req, res) => res.json({ status: 'OK', scope: 'public/vacances' }))

export default router
