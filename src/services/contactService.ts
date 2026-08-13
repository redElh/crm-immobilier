import { api } from './api';
import type { Contact } from '../types/contact';

export async function fetchContacts(params?: Record<string, string>): Promise<Contact[]> {
  return api.get<Contact[]>('/contacts', params);
}

export async function fetchContactById(id: string): Promise<Contact> {
  return api.get<Contact>(`/contacts/${id}`);
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  return api.post<Contact>('/contacts', data as Record<string, unknown>);
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  return api.put<Contact>(`/contacts/${id}`, data as Record<string, unknown>);
}

export async function deleteContact(id: string): Promise<void> {
  return api.del<void>(`/contacts/${id}`);
}

export async function duplicateContact(id: string): Promise<Contact> {
  return api.post<Contact>(`/contacts/${id}/duplicate`);
}
