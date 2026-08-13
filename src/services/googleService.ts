import { api } from './api'

export interface GoogleConnectionStatus {
  connected: boolean
  email?: string
  expiresAt?: string | null
}

export interface GoogleSyncResult {
  connected: boolean
  pushed?: number
  updated?: number
  failed?: number
  pulled?: number
  pullFailed?: number
}

export type GoogleSyncDirection = 'crm-to-google' | 'google-to-crm' | 'both'

export async function getGoogleAuthUrl(returnPath: string): Promise<string> {
  const data = await api.get<{ url: string }>('/google/auth-url', { returnPath })
  return data.url
}

export async function getGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  return api.get<GoogleConnectionStatus>('/google/status')
}

export async function disconnectGoogle(): Promise<void> {
  await api.post('/google/disconnect')
}

export async function syncGoogleCalendar(direction: GoogleSyncDirection = 'both'): Promise<GoogleSyncResult> {
  return api.post<GoogleSyncResult>('/google/sync', { direction })
}
