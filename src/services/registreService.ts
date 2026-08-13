import { api } from './api'

export async function fetchRegistre(params?: Record<string, string>) {
  return api.get<any[]>('/registre', params)
}

export async function fetchRegistreById(id: string) {
  return api.get<any>(`/registre/${id}`)
}

export async function createRegistreEntry(data: Record<string, unknown>) {
  return api.post<any>('/registre', data)
}

export async function updateRegistreEntry(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/registre/${id}`, data)
}

export async function deleteRegistreEntry(id: string) {
  return api.del<any>(`/registre/${id}`)
}

export async function fetchRegistreStats() {
  return api.get<any>('/registre/stats')
}
