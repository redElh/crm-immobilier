# APIMO API — Fetch Properties Guide

How the SquareMeter project fetches real-estate properties from APIMO, and how to reuse the same pattern in another project.

> Based on the actual implementation in this repo: `api/apimo.js:30`, `src/services/apimoService.ts:4`, `src/setupProxy.js:54`, `scripts/generate_sitemap.js:29`

---

## 1. Overview

* **Provider:** APIMO CRM — `https://api.apimo.pro`
* **Our agency:** `25311` (SquareMeter) — see `src/services/apimoService.ts:7`
* **Data source:** `GET /agencies/{agencyId}/properties`
* **Auth:** HTTP Basic Auth with `providerId:token` → Base64
* **Security model in this project:** Credentials **never** leave the server. The browser calls a same-origin proxy (`/api/apimo/*`) which injects the `Authorization` header server-side (`api/apimo.js:54`, `src/setupProxy.js:19`).

```
Browser (fetch /api/apimo/...) → Proxy (adds Basic Auth) → https://api.apimo.pro/...
```

---

## 2. Credentials

Get these from your APIMO account / provider dashboard.

| Variable | Description | Example |
|---|---|---|
| `APIMO_PROVIDER_ID` | Provider ID | `4567` |
| `APIMO_TOKEN` | API token/secret | `d@...` (keep private) |
| `APIMO_AGENCY_ID` | Agency to query | `25311` |

`.env` / `.env.local` / Vercel env vars (`vercel.json`, `.env.example:4`):

```env
APIMO_PROVIDER_ID=4567
APIMO_TOKEN=your-apimo-token
APIMO_AGENCY_ID=25311
```

> **Do not** hardcode `providerId`/`token` in client JS. `SECURITY_FIXES.md:11` explains why they were removed from `src/services/apimoService.ts` and why `api/apimo.js:56` now fails closed if env vars are missing.

---

## 3. Authentication

```js
const providerId = process.env.APIMO_PROVIDER_ID;
const token = process.env.APIMO_TOKEN;
const credentials = `${providerId}:${token}`;
const base64Credentials = Buffer.from(credentials).toString('base64');
// Node: Buffer.from(...).toString('base64')
// Browser: btoa(`${providerId}:${token}`)

headers: {
  'Authorization': `Basic ${base64Credentials}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}
```

Used in:
- Vercel proxy: `api/apimo.js:60-76`
- Dev proxy: `src/setupProxy.js:24-65`
- Build script: `scripts/generate_sitemap.js:27`

---

## 4. Endpoints

### Base URL

```
https://api.apimo.pro
```

### List properties

```
GET /agencies/{agencyId}/properties
```

Full URL example (see `scripts/generate_sitemap.js:30`):

```
https://api.apimo.pro/agencies/25311/properties?limit=1000
```

Through the project's proxy (what the frontend actually calls, `src/services/apimoService.ts:526`):

```
GET /api/apimo/agencies/25311/properties?limit=100&offset=0&status=1
 → proxied to https://api.apimo.pro/agencies/25311/properties?limit=100&offset=0&status=1
```

Proxy path rewriting: `api/apimo.js:64` strips `/api/apimo` prefix, `src/setupProxy.js:61` does the same via `http-proxy-middleware`.

### Single property

APIMO has no dedicated `GET /properties/{id}` in this project. `src/services/apimoService.ts:653` fetches `limit=1000` and finds by `id` client-side:

```ts
const { properties } = await apimoService.getProperties({ limit: 1000 });
const one = properties.find(p => p.id === propertyId);
```

If you need true single-fetch, APIMO also supports filtering by `id`/`reference` depending on your provider — check `https://apimo.net/fr/api/webservice/` and test with the proxy.

---

## 5. Query Parameters

All are optional. Built via `URLSearchParams` in `src/services/apimoService.ts:518`:

| Param | Type | Description |
|---|---|---|
| `limit` | int | Page size (e.g. `10`, `100`, `1000`) |
| `offset` | int | Pagination offset |
| `timestamp` | int (unix) | Incremental sync — only items updated since timestamp |
| `step` | int | Publication step / workflow state |
| `status` | int | **Single value only.** `1` = published/live, `30`/`31`/`32` = sold. See `SOLD_STATUSES` in `src/services/apimoService.ts:290` |
| `group` | int | Property group if your APIMO uses groups |

> **Important — status:** The APIMO endpoint accepts **one** `status` per request. The app works around this by firing parallel requests for `[1, 30, 31, 32]` and merging/deduping (`src/services/apimoService.ts:514-568`).

---

## 6. Direct API Examples (no proxy)

Use these if your new project calls APIMO **server-side** (Node, Next.js API route, etc.).

### cURL

```bash
PROVIDER_ID=4567
TOKEN=your-token
AGENCY_ID=25311
AUTH=$(echo -n "$PROVIDER_ID:$TOKEN" | base64)

curl -H "Authorization: Basic $AUTH" \
     -H "Accept: application/json" \
     "https://api.apimo.pro/agencies/$AGENCY_ID/properties?limit=10&status=1"
```

### Node.js (node-fetch / native fetch)

```js
// npm i node-fetch  (Node < 18) or use global fetch on Node 18+
const providerId = process.env.APIMO_PROVIDER_ID;
const token = process.env.APIMO_TOKEN;
const agencyId = process.env.APIMO_AGENCY_ID || '25311';

const auth = Buffer.from(`${providerId}:${token}`).toString('base64');

const params = new URLSearchParams({ limit: '20', status: '1' });
const url = `https://api.apimo.pro/agencies/${agencyId}/properties?${params}`;

const res = await fetch(url, {
  headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
});
if (!res.ok) throw new Error(`APIMO ${res.status}: ${await res.text()}`);
const data = await res.json(); // { properties: [...], total_items, timestamp }
console.log(`Total: ${data.total_items}, got: ${data.properties.length}`);
```

### Browser `fetch` (only via your own proxy — never expose token)

```js
// Your own /api/apimo proxy should inject Authorization server-side
const res = await fetch('/api/apimo/agencies/25311/properties?limit=20&status=1', {
  headers: { 'Accept': 'application/json' }
});
const data = await res.json();
```

---

## 7. Proxy Pattern (recommended — copy from this repo)

### Why a proxy?

* Avoids CORS (`api/apimo.js:1` comment)
* Keeps `APIMO_TOKEN` server-only
* Lets you lock CORS + methods (`api/apimo.js:4`, `api/apimo.js:48`)

### Vercel serverless proxy (`api/apimo.js:30`)

```js
// api/apimo.js — simplified
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const providerId = process.env.APIMO_PROVIDER_ID;
  const token = process.env.APIMO_TOKEN;
  const auth = Buffer.from(`${providerId}:${token}`).toString('base64');

  const path = req.url.replace('/api/apimo', ''); // /agencies/25311/properties?limit=10
  const apiUrl = `https://api.apimo.pro${path}`;

  const r = await fetch(apiUrl, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  const data = await r.json();
  return res.status(200).json(data);
}
```

Full version with CORS allowlist, `OPTIONS` handling, retry (429/5xx), and non-JSON guard is in `api/apimo.js:9`.

### CRA dev proxy (`src/setupProxy.js:54`)

Uses `http-proxy-middleware` to forward `/api/apimo` → `https://api.apimo.pro` with the `Authorization` header. Copy that block verbatim for any CRA/CRACO project.

### Create your own proxy in the new project

1. Create `/api/apimo.js` (Vercel/Next) or an Express middleware.
2. Read `APIMO_PROVIDER_ID` + `APIMO_TOKEN` from env.
3. Add `Authorization: Basic ...` and forward `req.url` query string.
4. In the frontend, set `baseUrl = '/api/apimo'` and call `/agencies/${agencyId}/properties`.

---

## 8. Frontend Service (`src/services/apimoService.ts:476`)

Copy-paste starter for the new project:

```ts
const APIMO_CONFIG = { baseUrl: '/api/apimo', agencyId: '25311' };

export async function getProperties(params?: {
  limit?: number; offset?: number; status?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.append('limit', String(params.limit));
  if (params?.status !== undefined) qs.append('status', String(params.status));

  const url = `${APIMO_CONFIG.baseUrl}/agencies/${APIMO_CONFIG.agencyId}/properties?${qs}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`APIMO ${res.status}`);
  return res.json() as Promise<{ properties: any[]; total_items: number; timestamp: number }>;
}

// Fetch live + sold and dedupe (mirrors src/services/apimoService.ts:514)
export async function getAllProperties() {
  const statuses = [1, 30, 31, 32];
  const results = await Promise.all(statuses.map(s => getProperties({ limit: 100, status: s })));
  const seen = new Set();
  return results.flatMap(r => r.properties).filter(p => {
    if (seen.has(String(p.id))) return false;
    seen.add(String(p.id)); return true;
  });
}
```

Extras the app adds (optional to copy):
* **Cache/memoization** per params+language: `src/services/apimoService.ts:477`
* **Mapping** raw → app `Property` (`mapApimoToProperty`, `src/services/apimoService.ts:342`)
* **i18n** for title/description + `browserTranslationService` for non-fr/en (`src/services/apimoService.ts:572`)
* **Images sorted by rank**, fallback image (`src/services/apimoService.ts:368`)
* **Category → buy/rent/seasonal** (`src/services/apimoService.ts:294`), **type/subtype labels** (`src/services/apimoService.ts:309`)

---

## 9. Response Shape

```json
{
  "total_items": 81,
  "timestamp": 1773236430,
  "properties": [
    {
      "id": 86686477,
      "reference": "86686477",
      "agency": 25311,
      "status": 1,
      "category": 3,
      "subcategory": 0,
      "type": 1,
      "subtype": 5,
      "price": { "value": 1200000, "currency": "MAD", "period": 4 },
      "area": { "value": 120, "total": 200, "unit": 1 },
      "city": { "id": 130863, "name": "Essaouira", "zipcode": "44000" },
      "country": "MA",
      "bedrooms": 3,
      "pictures": [{ "id": 1, "rank": 1, "url": "https://media.apimo.pro/..." }],
      "comments": [{ "language": "fr", "title": "...", "comment": "...", "comment_full": "..." }],
      "user": { "id": 119577, "firstname": "Dimitri", "lastname": "DJEDJE", "email": "..." },
      "created_at": "2025-09-30 17:47:41",
      "updated_at": "2026-06-27 13:52:11"
    }
  ]
}
```

Full TypeScript type: `ApimoProperty` + `ApimoResponse` in `src/services/apimoService.ts:11`.

---

## 10. Pagination & Incremental Sync

```js
// Pagination
await getProperties({ limit: 20, offset: 0 });
await getProperties({ limit: 20, offset: 20 });

// Incremental sync — store last timestamp
const { properties, timestamp } = await getProperties({ timestamp: lastTimestamp });
// timestamp from response = use for next call
```

`sitemap` generation example fetches all at once: `scripts/generate_sitemap.js:30` with `limit=1000`.

---

## 11. Error Handling & Retry

`api/apimo.js:9` retries on `429` and `5xx` with exponential backoff (2 retries, 1s → 2s → 4s). The proxy always returns `200` with `{ properties: [], total_items: 0, error: ... }` on failure (`api/apimo.js:58`, `api/apimo.js:100`) so the frontend never crashes — it just shows empty results. Replicate this if you want the same UX.

---

## 12. Minimal Reuse Checklist for a New Project

- [ ] Add `APIMO_PROVIDER_ID`, `APIMO_TOKEN`, `APIMO_AGENCY_ID` to env (and Vercel dashboard)
- [ ] Create server proxy (`api/apimo.js:30` or `src/setupProxy.js:54` pattern) — keep token server-only
- [ ] Frontend: `fetch('/api/apimo/agencies/${agencyId}/properties?...')` with `Accept: application/json`
- [ ] Handle `status` single-value limitation → parallel fetch `1,30,31,32` if you need sold
- [ ] Map response via `mapApimoToProperty` logic (`src/services/apimoService.ts:342`) or use raw
- [ ] Sort pictures by `rank`, build `location` from `city.name + zipcode`, handle `price.value` + `price.currency`

---

## 13. References

| File | What it shows |
|---|---|
| `api/apimo.js:1` | Production Vercel proxy, CORS, retry, error shape |
| `src/services/apimoService.ts:4` | Client config, types, mapping, fetching + translation |
| `src/setupProxy.js:54` | CRA dev proxy (http-proxy-middleware) |
| `scripts/generate_sitemap.js:29` | Direct server-side fetch (no proxy) for build scripts |
| `.env.example:4` | Required env vars |
| `SECURITY_FIXES.md:11` | Why credentials must be server-only |

External docs: `https://apimo.net/fr/api/webservice/` (referenced in `src/services/apimoService.ts:2`)
