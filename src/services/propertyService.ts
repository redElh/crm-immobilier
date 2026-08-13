import { api } from './api'

export async function generateReference(propertyType: string): Promise<string> {
  const data = await api.get<{ reference: string }>('/properties/reference', { propertyType })
  return data.reference
}

export async function fetchProperties(params?: Record<string, string>) {
  return api.get<any[]>('/properties', params)
}

export async function fetchPropertyById(id: string) {
  return api.get<any>(`/properties/${id}`)
}

export async function addProperty(data: Record<string, unknown>) {
  return api.post<any>('/properties', data)
}

export async function updateProperty(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/properties/${id}`, { ...data, reference: undefined })
}

export async function updatePropertyCompletion(id: string, data: { completion: number; completionTabs: Record<string, boolean> }) {
  return api.patch<any>(`/properties/${id}/completion`, data)
}

export async function updatePropertyDocuments(id: string, fileTree: any[]) {
  return api.patch<any>(`/properties/${id}/documents`, { fileTree })
}

export async function duplicateProperty(id: string) {
  return api.post<any>(`/properties/${id}/duplicate`)
}

export async function reassignProperty(id: string, agentId: string, note?: string) {
  return api.post<any>(`/properties/${id}/reassign`, { agentId, note })
}

export async function deleteProperty(id: string) {
  return api.del<any>(`/properties/${id}`)
}

export async function fetchTimeline(propertyId: string) {
  return api.get<any[]>(`/properties/${propertyId}/timeline`)
}

export async function addTimelineEvent(propertyId: string, data: Record<string, unknown>) {
  return api.post<any>(`/properties/${propertyId}/timeline`, data)
}

export async function updateTimelineEvent(propertyId: string, eventId: string, data: Record<string, unknown>) {
  return api.put<any>(`/properties/${propertyId}/timeline/${eventId}`, data)
}

export async function deleteTimelineEvent(propertyId: string, eventId: string) {
  return api.del<any>(`/properties/${propertyId}/timeline/${eventId}`)
}

export async function fetchPropertyMatching(propertyId: string) {
  return api.get<any[]>(`/properties/${propertyId}/matching`)
}

export async function proposePropertyToClient(propertyId: string, data: { clientId: string; email: string; subject: string; message: string; score: number; details?: Record<string, number> }) {
  return api.post<{ success: boolean; message: string }>(`/properties/${propertyId}/propose`, data)
}

export async function proposePropertyToOwner(propertyId: string, data: { clientId: string; email: string; subject: string; message: string; score: number; details?: Record<string, number>; buyerName?: string }) {
  return api.post<{ success: boolean; message: string }>(`/properties/${propertyId}/propose`, data)
}

export async function refusePropertyMatch(propertyId: string, clientId: string) {
  return api.post<{ success: boolean }>(`/properties/${propertyId}/refuse`, { clientId })
}

export async function unrefusePropertyMatch(propertyId: string, clientId: string) {
  return api.del<{ success: boolean }>(`/properties/${propertyId}/refuse/${clientId}`)
}
