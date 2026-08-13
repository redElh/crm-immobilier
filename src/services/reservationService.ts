import { api } from './api'

export async function fetchReservations(params?: Record<string, string>) {
  return api.get<any[]>('/reservations', params)
}

export async function fetchReservationById(id: string) {
  return api.get<any>(`/reservations/${id}`)
}

export async function createReservation(data: Record<string, unknown>) {
  return api.post<any>('/reservations', data)
}

export async function updateReservation(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/reservations/${id}`, data)
}

export async function deleteReservation(id: string) {
  return api.del<any>(`/reservations/${id}`)
}
