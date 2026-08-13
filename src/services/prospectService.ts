import { api } from './api';
import type { Prospect } from '../types/prospect';

export async function fetchProspects(params?: Record<string, string>): Promise<Prospect[]> {
  return api.get<Prospect[]>('/prospects', params);
}

export async function fetchProspectById(id: string): Promise<Prospect> {
  return api.get<Prospect>(`/prospects/${id}`);
}

export async function fetchQualifiedProspects(): Promise<Prospect[]> {
  return api.get<Prospect[]>('/prospects/qualified');
}

export async function createProspect(data: Partial<Prospect>): Promise<Prospect> {
  return api.post<Prospect>('/prospects', data as Record<string, unknown>);
}

export async function updateProspect(id: string, data: Partial<Prospect>): Promise<Prospect> {
  return api.put<Prospect>(`/prospects/${id}`, data as Record<string, unknown>);
}

export async function updateProspectStatus(
  id: string,
  status: Prospect['status'],
  options?: { reminderDate?: string; reminderNote?: string; qualificationData?: Record<string, unknown>; contactId?: string }
): Promise<Prospect> {
  return api.patch<Prospect>(`/prospects/${id}/status`, {
    status,
    ...options,
  } as Record<string, unknown>);
}

export async function scheduleReminder(
  id: string,
  reminderDate: string,
  reminderNote?: string
): Promise<Prospect> {
  return api.post<Prospect>(`/prospects/${id}/reminder`, {
    reminderDate,
    reminderNote: reminderNote || '',
  } as Record<string, unknown>);
}

export async function updateReminder(
  id: string,
  reminderDate: string,
  reminderNote?: string
): Promise<Prospect> {
  return api.put<Prospect>(`/prospects/${id}/reminder`, {
    reminderDate,
    reminderNote: reminderNote || '',
  } as Record<string, unknown>);
}

export async function cancelReminder(id: string): Promise<Prospect> {
  return api.del<Prospect>(`/prospects/${id}/reminder`);
}

export async function deleteProspect(id: string): Promise<void> {
  return api.del<void>(`/prospects/${id}`);
}

export async function duplicateProspect(id: string): Promise<Prospect> {
  return api.post<Prospect>(`/prospects/${id}/duplicate`);
}
