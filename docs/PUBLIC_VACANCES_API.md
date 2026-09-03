# Vacances Management — Public API for squaremeter.ma

Public read-only API that exposes the reservation calendar built in **Toolbox → Vacances management** (`category: 3` APIMO properties). The CRM remains the source of truth; `squaremeter.ma` consumes this API to disable booked dates.

Base URL (production): `https://crm.squaremeter.ma/api/public`  
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
curl https://crm.squaremeter.ma/api/public/vacances/reservations/86686477
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
curl "https://crm.squaremeter.ma/api/public/vacances/reservations?ids=86686477,86709240"
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

### Vanilla JS / React
```js
const CRM_API = 'https://crm.squaremeter.ma/api/public';

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
  const res = await fetch(`https://crm.squaremeter.ma/api/public/vacances/reservations/${params.id}`);
  const data = await res.json();
  return { props: { reservedDates: data.reservedDates }, revalidate: 60 };
}
```

### CORS
Allowed origins: `https://squaremeter.ma`, `https://www.squaremeter.ma`, any `*.squaremeter.ma`, `localhost`/`127.0.0.1` for dev, and `no-origin` (SSR/curl). Public routes use `credentials: false`, so no cookies needed.

### Rate limit
`120 req / 15 min` per IP. Exceeding returns `429` with `Retry-After`.

### Caching
- `reservedDates` / `calendar`: `Cache-Control: public, max-age=60`
- `properties`: `public, max-age=300` (5 min), server-side memo.

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
```

## Security notes
- `APIMO_TOKEN` is read only in `controllers/toolbox.*.controller.js:5` via `process.env` and injected as `Basic base64(provider:token)` server-side — never in `src/services/*` or the bundle (`SECURITY_FIXES.md` V1).
- Public API is **read-only** (`GET` only), validated `propertyId` regex `^[A-Za-z0-9_-]+$`, max 50 ids per batch.

