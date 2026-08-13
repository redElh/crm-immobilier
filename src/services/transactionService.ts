import { api } from './api'

export async function fetchTransactions(params?: Record<string, string>) {
  return api.get<any[]>('/transactions', params)
}

export async function fetchTransactionById(id: string) {
  return api.get<any>(`/transactions/${id}`)
}

export async function createTransaction(data: Record<string, unknown>) {
  return api.post<any>('/transactions', data)
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/transactions/${id}`, data)
}

export async function deleteTransaction(id: string) {
  return api.del<any>(`/transactions/${id}`)
}

export async function signTransaction(id: string) {
  return api.post<any>(`/transactions/${id}/sign`)
}

export async function resiliateTransaction(id: string) {
  return api.post<any>(`/transactions/${id}/resiliate`)
}

export async function expireTransaction(id: string) {
  return api.post<any>(`/transactions/${id}/expire`)
}
