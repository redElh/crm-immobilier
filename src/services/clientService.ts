import { api } from './api'

export async function fetchClients(params?: Record<string, string>) {
  return api.get<any[]>('/clients', params)
}

export async function fetchClientById(id: string) {
  return api.get<any>(`/clients/${id}`)
}

export async function createClient(data: Record<string, unknown>) {
  return api.post<any>('/clients', data)
}

export async function updateClient(id: string, data: Record<string, unknown>) {
  return api.put<any>(`/clients/${id}`, data)
}

export async function deleteClient(id: string) {
  return api.del<any>(`/clients/${id}`)
}

export async function fetchClientsByContactId(contactId: string) {
  return api.get<any[]>(`/clients/by-contact/${contactId}`)
}

export async function duplicateClient(id: string) {
  return api.post<any>(`/clients/${id}/duplicate`)
}
export async function fetchClientCroisements(clientId: string) {
  return api.get<any[]>(`/clients/${clientId}/croisements`)
}

export async function proposeProperty(clientId: string, data: { propertyId: string; email: string; subject: string; message: string; score: number; details?: Record<string, number> }) {
  return api.post<{ success: boolean; message: string }>(`/clients/${clientId}/propose`, data)
}

export async function sendFinancement(clientId: string, data: { email: string; subject: string; message: string }) {
  return api.post<{ success: boolean; message: string }>(`/clients/${clientId}/send-financement`, data)
}

export interface ClientActivity {
  id: number;
  client_id: number;
  type: string;
  direction: string;
  subject: string;
  description: string;
  activity_date: string;
  has_reminder: boolean;
  reminder_date: string | null;
  is_important: boolean;
  author_id: number | null;
  author_name: string;
  author_role: string;
  alarm_sent: boolean;
  reminder_sent: boolean;
  status: string;
  cancellation_notified: boolean;
  visit_property_id: number | null;
  visit_buyer_id: number | null;
  visit_seller_id: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchClientActivities(clientId: string, params?: Record<string, string>) {
  return api.get<{ activities: ClientActivity[]; total: number; page: number; limit: number; typeCounts: Record<string, number> }>(`/clients/${clientId}/activities`, params)
}

export async function createClientActivity(clientId: string, data: Partial<ClientActivity>) {
  return api.post<ClientActivity>(`/clients/${clientId}/activities`, data)
}

export async function updateClientActivity(clientId: string, activityId: number, data: Partial<ClientActivity>) {
  return api.put<ClientActivity>(`/clients/${clientId}/activities/${activityId}`, data)
}

export async function deleteClientActivity(clientId: string, activityId: number) {
  return api.del<{ success: boolean }>(`/clients/${clientId}/activities/${activityId}`)
}
