export interface ClientDraft {
  id: string
  clientType: string
  data: Record<string, any>
  completion: number
  createdAt: string
  updatedAt: string
  title?: string
}

const BASE_KEY = 'clientDrafts'

function storageKey(userId: string): string {
  return `${BASE_KEY}_${userId}`
}

function getAll(userId: string): ClientDraft[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveAll(userId: string, drafts: ClientDraft[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(drafts))
}

export function getDrafts(userId: string, type?: string): ClientDraft[] {
  const all = getAll(userId)
  return type ? all.filter(d => d.clientType === type) : all
}

export function getDraft(userId: string, id: string): ClientDraft | undefined {
  return getAll(userId).find(d => d.id === id)
}

export function saveDraft(userId: string, type: string, data: Record<string, any>, completion: number): ClientDraft {
  const all = getAll(userId)
  const existing = all.find(d => d.id === data._draftId)
  const title = data.nom || data.name || data.bienReserve || data.societe || `${data.prenom || ''} ${data.nom || ''}`.trim() || 'Sans titre'
  const now = new Date().toISOString()

  if (existing) {
    existing.data = data
    existing.completion = completion
    existing.updatedAt = now
    existing.title = title
    saveAll(userId, all)
    return existing
  }

  const draft: ClientDraft = {
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    clientType: type,
    data,
    completion,
    createdAt: now,
    updatedAt: now,
    title,
  }
  all.push(draft)
  saveAll(userId, all)
  return draft
}

export function deleteDraft(userId: string, id: string) {
  const all = getAll(userId).filter(d => d.id !== id)
  saveAll(userId, all)
}

export function hasDrafts(userId: string, type?: string): boolean {
  return getDrafts(userId, type).length > 0
}

export function getDraftCount(userId: string, type?: string): number {
  return getDrafts(userId, type).length
}
