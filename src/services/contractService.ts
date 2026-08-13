import { api, BASE } from './api'
import { getAuthToken } from '../utils/auth'

export async function fetchContracts(params?: Record<string, string>) {
  return api.get<any[]>('/contracts', params)
}

export async function fetchContractsByClient(clientId: string) {
  return api.get<any[]>(`/contracts/client/${clientId}`)
}

export async function fetchContractById(id: string) {
  return api.get<any>(`/contracts/${id}`)
}

export async function createContract(data: Record<string, unknown>) {
  return api.post<any>('/contracts', data)
}

export async function updateContract(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/contracts/${id}`, data)
}

export async function deleteContract(id: string) {
  return api.del<any>(`/contracts/${id}`)
}

export async function fetchContractStats() {
  return api.get<any>('/contracts/stats')
}

export interface ContractHistoryParams {
  action?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function fetchContractHistory(id: string, params: ContractHistoryParams = {}) {
  const query: Record<string, string> = {}
  if (params.action) query.action = params.action
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  if (params.page) query.page = String(params.page)
  if (params.limit) query.limit = String(params.limit)
  return api.get<any>(`/contracts/${id}/history`, query)
}

export async function uploadContractFiles(id: string, files: File[]) {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  const token = getAuthToken()
  const res = await fetch(`${BASE}/contracts/${id}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function updateContractDocuments(id: string, body: Record<string, unknown>) {
  return api.put<any>(`/contracts/${id}/documents`, body)
}

export async function deleteContractDocument(id: string, docId: string) {
  return api.del<any>(`/contracts/${id}/documents/${docId}`)
}

export async function sendContractToProprietaire(id: string, data: Record<string, unknown>) {
  return api.post<any>(`/contracts/${id}/send-to-proprietaire`, data)
}
