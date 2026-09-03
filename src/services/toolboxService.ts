import { api } from './api'

export interface ApimoVacanceProperty {
  id: number | string
  reference?: string
  category: number
  status: number
  type: number
  subtype: number
  price?: { value?: number; currency?: string }
  city?: { name?: string; zipcode?: string }
  area?: { value?: number; unit?: number }
  bedrooms?: number
  pictures?: { url?: string; rank?: number }[]
  comments?: { language?: string; title?: string; comment?: string }[]
  user?: { firstname?: string; lastname?: string }
  created_at?: string
  updated_at?: string
  [k: string]: any
}

export async function getVacancesProperties(params?: { limit?: number; offset?: number; status?: number }) {
  const qs: Record<string, string> = {}
  if (params?.limit) qs.limit = String(params.limit)
  if (params?.offset) qs.offset = String(params.offset)
  if (params?.status !== undefined) qs.status = String(params.status)
  return api.get<{ properties: ApimoVacanceProperty[]; total_items: number; timestamp?: number }>('/toolbox/vacances/properties', qs)
}

export async function getVacancesReservations(apimoPropertyId: string | number) {
  return api.get<{ propertyId: string; dates: { id?: number; date: string; note?: string }[] | string[] }>(`/toolbox/vacances/${apimoPropertyId}/reservations`)
}

export async function putVacancesReservations(apimoPropertyId: string | number, dates: string[]) {
  return api.put<{ propertyId: string; dates: string[] }>(`/toolbox/vacances/${apimoPropertyId}/reservations`, { dates })
}

export async function toggleVacancesDate(apimoPropertyId: string | number, date: string) {
  return api.post<{ date: string; reserved: boolean }>(`/toolbox/vacances/${apimoPropertyId}/toggle`, { date })
}
