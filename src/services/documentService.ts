import { api } from './api'
import type { GlobalDocumentEntry } from '../types/document'

export async function fetchDocuments(agentId?: string): Promise<GlobalDocumentEntry[]> {
  const params: Record<string, string> = {}
  if (agentId) params.agent_id = agentId
  return api.get<GlobalDocumentEntry[]>('/documents', Object.keys(params).length ? params : undefined)
}

export async function deleteDocument(docId: string): Promise<void> {
  await api.del(`/documents/${docId}`)
}

export async function sendDocumentEmail(payload: {
  to: string
  subject: string
  message: string
  senderName: string
  documents: { id: string; name: string; size?: string; url?: string }[]
}): Promise<void> {
  await api.post('/documents/send-email', payload as unknown as Record<string, unknown>)
}
