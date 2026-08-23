import { getAuthToken } from '../utils/auth'
import { API_BASE } from '../utils/config'

const BASE = API_BASE

export async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const token = getAuthToken()
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }

  const res = await fetch(`${BASE}/properties/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Upload failed')
  }

  const data = await res.json()
  return data.files.map((f: any) => f.url)
}

// Upload a file overwriting an existing previously-uploaded file (same URL, no duplicate on disk).
// Falls back to the server's response URL if the backend couldn't replace in place.
export async function uploadFileReplacing(file: File, replaceUrl: string): Promise<string> {
  const token = getAuthToken()
  const formData = new FormData()
  formData.append('files', file)
  formData.append('replaceUrl', replaceUrl)

  const res = await fetch(`${BASE}/properties/upload-replace`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Upload failed')
  }

  const data = await res.json()
  return data.files[0].url
}
