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
