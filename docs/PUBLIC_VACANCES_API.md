# Vacances Management — Public API for squaremeter.ma

Public read-only API that exposes the reservation calendar built in **Toolbox → Vacances management** (`category: 3` APIMO properties). The CRM remains the source of truth; `squaremeter.ma` consumes this API to disable booked dates.

Base URL (production): `https://api.squaremeter.ma/api/public` ← Railway Express backend (`BACKEND_URL`)
> ⚠️ `https://crm.squaremeter.ma` and `https://www.squaremeter.ma` are **frontends** (Vercel/Cloudflare, SPA). Calling `/api/public` there returns `text/html` or `404`. Always call the **backend** `api.squaremeter.ma` from `squaremeter.ma`.
Base URL (local dev): `http://localhost:5000/api/public`

> No authentication required. If `PUBLIC_VACANCES_API_KEY` is set in the CRM backend `.env`, send it as `X-API-Key` (or `?api_key=`).

---

## Endpoints

### 1. Single property — reserved days
```
GET /vacances/reservations/:apimoPropertyId
```
**Example**
```bash
curl https://api.squaremeter.ma/api/public/vacances/reservations/86686477
# expected 200 JSON; if you curl https://www.squaremeter.ma/api/... you will get 404 (no serverless function there)
# and https://crm.squaremeter.ma/api/... returns SPA html — use api.squaremeter.ma
```
**Response `200`**
```json
{
  "propertyId": "86686477",
  "reservedDates": ["2026-09-02","2026-09-03","2026-09-04"],
  "count": 3
}
```
Dates are `YYYY-MM-DD` (Africa/Casablanca), sorted ASC. Empty array if no bookings.

### 2. Batch — multiple properties (max 50)
```
GET /vacances/reservations?ids=86686477,86686478,86686479
# alias: ?propertyIds= or ?propertyId=
```
```bash
curl "https://api.squaremeter.ma/api/public/vacances/reservations?ids=86686477,86709240"
```
```json
{
  "reservations": {
    "86686477": ["2026-09-02","2026-09-03"],
    "86709240": []
  }
}
```

### 3. Full calendar — all properties
```
GET /vacances/calendar
```
```json
{
  "calendar": {
    "86686477": ["2026-09-02","2026-09-03","2026-09-04"],
    "86709240": ["2026-09-10"]
  },
  "totalProperties": 2,
  "totalDates": 4
}
```
Use to hydrate a global cache. `Cache-Control: public, max-age=60`.

### 4. Vacances properties list (APIMO category 3, cached 5min)
```
GET /vacances/properties?limit=100&offset=0&status=1
```
```json
{
  "properties": [
    {
      "id": "86686477",
      "reference": "86686477",
      "category": 3,
      "city": "Essaouira",
      "price": 500,
      "currency": "MAD",
      "pictures": ["https://media.apimo.pro/cache/...jpg"],
      "title": "Le Rooftop d'Essaouira"
    }
  ],
  "total": 66,
  "total_raw": 66
}
```
Server-side filters `category===3`, so only vacances are returned. Credentials never leave the server (`APIMO_PROVIDER_ID/TOKEN` via `Authorization: Basic`).

---

## squaremeter.ma integration

### Vanilla JS / React — call the backend, not the frontend
```js
const CRM_API = 'https://api.squaremeter.ma/api/public'; // NOT https://www.squaremeter.ma/api/public and NOT https://crm.squaremeter.ma/api/public

// 1. Single property page
async function getReservedDates(propertyId) {
  const res = await fetch(`${CRM_API}/vacances/reservations/${propertyId}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`CRM ${res.status}`);
  const { reservedDates } = await res.json();
  return new Set(reservedDates); // use to disable calendar days
}

// 2. Listing / search — batch
async function getBatch(ids) {
  const res = await fetch(`${CRM_API}/vacances/reservations?ids=${ids.join(',')}`);
  const { reservations } = await res.json();
  return reservations; // { "86686477": [...] }
}

// Example: disable in a date picker
const blocked = await getReservedDates('86686477');
const isBlocked = (isoDate) => blocked.has(isoDate); // "2026-09-03" => true
```

### Next.js (ISR — revalidate every 60s)
```js
export async function getStaticProps({ params }) {
  const res = await fetch(`https://api.squaremeter.ma/api/public/vacances/reservations/${params.id}`);
  const data = await res.json();
  return { props: { reservedDates: data.reservedDates }, revalidate: 60 };
}
```

### CORS
Allowed origins: `https://squaremeter.ma`, `https://www.squaremeter.ma`, any `*.squaremeter.ma`, `localhost`/`127.0.0.1` for dev, and `no-origin` (SSR/curl). Public routes use `credentials: false`, so no cookies needed.
Backend `CORS_ORIGIN` already includes these via `app.js:52` (`PUBLIC_CORS_ALLOW` + `*.squaremeter.ma`), so cross-origin `fetch` from `www.squaremeter.ma` to `api.squaremeter.ma` succeeds.

### Troubleshooting — why you got `404` / `text/html`
| You called | Result | Why |
|---|---|---|
| `crm.squaremeter.ma/api/public/...` | `200 text/html` SPA | `crm.*` is the CRM frontend (React/Vercel), not Express |
| `www.squaremeter.ma/api/public/...` | `404 NOT_FOUND` | `www.*` has no `/api/public/vacances.js` function |
| `api.squaremeter.ma/api/public/...` | `200 JSON` | Correct — Railway Express (`BACKEND_URL`) |

**Fix:** change `CRM_API` to `https://api.squaremeter.ma/api/public` (see above). No code deploy needed on `crm` or `www`.

#### Optional — same-origin proxy on `www.squaremeter.ma` (avoids CORS entirely)
If you prefer `fetch('/api/public/vacances/...')` from the browser, add a rewrite on the **www** repo:

**Next.js (`next.config.js`)**
```js
async rewrites() {
  return [{ source: '/api/public/:path*', destination: 'https://api.squaremeter.ma/api/public/:path*' }];
}
```
**Vercel (`vercel.json`)**
```json
{ "rewrites": [{ "source": "/api/public/:path*", "destination": "https://api.squaremeter.ma/api/public/:path*" }] }
```
Then `fetch('/api/public/vacances/reservations/86686477')` works same-origin.

#### Example webhook handler on `www.squaremeter.ma` (Next.js App Router)
Create `app/api/revalidate-vacances/route.js`:
```js
import { revalidateTag, revalidatePath } from 'next/cache';
export async function POST(req) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.CRM_WEBHOOK_SECRET) return new Response('unauthorized', { status: 401 });
  const { propertyId } = await req.json();
  // If you use fetch(..., { next:{ tags:['vacances'] } })
  revalidateTag('vacances');
  revalidateTag(`vacances:${propertyId}`);
  // Or if you use ISR per page
  // revalidatePath(`/properties/${propertyId}`);
  return Response.json({ revalidated: true, propertyId });
}
```
Set `CRM_WEBHOOK_SECRET` in `www` env and `SQUAREMETER_WEBHOOK_SECRET` in CRM Railway to same value, and `SQUAREMETER_WEBHOOK_URL=https://www.squaremeter.ma/api/revalidate-vacances`.

### Instant updates — no waiting after CRM save
Saving in **Toolbox → Vacances → Gérer calendrier → Enregistrer** (`PUT /api/toolbox/vacances/:id/reservations`) now **instantly** propagates:
1. **DB write is immediate** — next `GET /api/public/vacances/reservations/:id` reads fresh rows.
2. **CDN cache is short** — `Cache-Control: public, max-age=5, stale-while-revalidate=10` (was 60). Worst delay 5s; Cloudflare also respects `CDN-Cache-Control: max-age=5`.
3. **Webhook (optional, for 0s)** — if `SQUAREMETER_WEBHOOK_URL=https://www.squaremeter.ma/api/revalidate-vacances` is set in Railway, CRM `POST`s `{ propertyId, reservedDates }` with `X-Webhook-Secret` **at the moment of save** (`services/vacancesNotify.service.js`). Your `www` should expose that endpoint to `revalidateTag('vacances')` / `revalidatePath` or purge. Without webhook, you still get 5s freshness.
4. **SSE live stream (optional, for 0s without polling)** — `GET https://api.squaremeter.ma/api/public/vacances/stream` is a `text/event-stream` that pushes `data: {"type":"vacances.calendar.updated","propertyId":"...","reservedDates":[...]}` instantly. In `www`:
```js
const es = new EventSource('https://api.squaremeter.ma/api/public/vacances/stream');
es.onmessage = e => {
  const { propertyId, reservedDates } = JSON.parse(e.data);
  if (propertyId === currentId) setBlocked(new Set(reservedDates));
};
```
For ISR, also fetch with `cache:'no-store'` or `next:{revalidate:0}` if you want to bypass Next fetch cache:
```js
fetch(`${CRM_API}/vacances/reservations/${id}`, { cache:'no-store' })
fetch(`${CRM_API}/vacances/reservations/${id}`, { next:{ revalidate:0 } })
```

### Rate limit
`120 req / 15 min` per IP. Exceeding returns `429` with `Retry-After`.

### Caching
- `reservedDates` / `calendar` / `?ids=`: `Cache-Control: public, max-age=5, stale-while-revalidate=10, must-revalidate` + `CDN-Cache-Control: max-age=5` (was 60) — instant within 5s, webhook makes it 0s.
- `properties`: `public, max-age=300` (5 min), server-side memo.
- `stream`: `no-cache, no-transform` SSE.

---

## Admin / CRM (private, requires JWT)

These remain auth-protected for the CRM UI:

```
GET    /api/toolbox/vacances/properties          (Bearer token)
GET    /api/toolbox/vacances/:id/reservations    (Bearer token)
PUT    /api/toolbox/vacances/:id/reservations    (Bearer token, body { dates: ["YYYY-MM-DD"] })
POST   /api/toolbox/vacances/:id/toggle          (Bearer token, body { date: "YYYY-MM-DD" })
```

---

## Env

```env
# Required (server only, never expose to browser)
APIMO_PROVIDER_ID=4567
APIMO_TOKEN=d07da6e744bb033d1299469f1f6f7334531ec05c
APIMO_AGENCY_ID=25311

# Optional — if set, public API requires X-API-Key
PUBLIC_VACANCES_API_KEY=your-random-secret
CORS_ORIGIN=https://squaremeter.ma,https://www.squaremeter.ma,http://localhost:3000

# Optional — instant webhook to www.squaremeter.ma (0s, recommended if you use ISR)
SQUAREMETER_WEBHOOK_URL=https://www.squaremeter.ma/api/revalidate-vacances
SQUAREMETER_WEBHOOK_SECRET=shared-random-secret
# aliases: SQUAREMETER_REVALIDATE_URL / SQUAREMETER_REVALIDATE_SECRET
# Optional — Cloudflare purge on save (CF Zone ID + Token)
# CF_ZONE_ID=...
# CF_API_TOKEN=...
```

## Security notes
- `APIMO_TOKEN` is read only in `controllers/toolbox.*.controller.js:5` via `process.env` and injected as `Basic base64(provider:token)` server-side — never in `src/services/*` or the bundle (`SECURITY_FIXES.md` V1).
- Public API is **read-only** (`GET` only), validated `propertyId` regex `^[A-Za-z0-9_-]+$`, max 50 ids per batch.

