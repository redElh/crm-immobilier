import { getAuthToken } from './auth'

export const BACKEND_ORIGIN = 'http://localhost:5000'

// The backend stores media as relative paths (/uploads/...). When the frontend
// is served from a different origin (e.g. the CRA dev server on :3000) those
// resolve to the wrong host, so we qualify them with the backend origin here.
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('blob:')) return url
  if (url.startsWith('/')) return `${BACKEND_ORIGIN}${url}`
  return url
}

// Fetches the file with the auth token and saves it to disk. Works across
// origins, unlike the <a download> attribute which is same-origin only.
export async function downloadMedia(url: string, filename: string): Promise<void> {
  const resolved = resolveMediaUrl(url)
  if (!resolved) throw new Error('Aucune adresse de téléchargement')
  const token = getAuthToken()
  const res = await fetch(resolved, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Échec du téléchargement')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename || 'piece-jointe'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
