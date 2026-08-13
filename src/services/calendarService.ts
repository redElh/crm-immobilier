import { api } from './api'
import type { CalendarEvent } from '../types/calendar'

function toApi(event: CalendarEvent) {
  return {
    type: event.type,
    title: event.title,
    start_at: new Date(event.start).toISOString(),
    end_at: new Date(event.end).toISOString(),
    all_day: event.allDay,
    agent_ids: event.agentIds,
    client_name: event.clientName || '',
    client_phone: event.clientPhone || '',
    client_email: event.clientEmail || '',
    property_name: event.propertyName || '',
    property_ref: event.propertyRef || '',
    location: event.location || '',
    description: event.description || '',
    google_sync: event.googleSync || false,
    reminders: event.reminders.map(r => ({ label: r.label })),
    created_by: event.createdBy || '',
  }
}

function fromApi(data: any): CalendarEvent {
  return {
    id: String(data.id),
    type: data.type,
    title: data.title,
    start: new Date(data.start),
    end: new Date(data.end),
    allDay: data.allDay,
    agentIds: data.agentIds || [],
    agentNames: data.agentNames || [],
    agentId: data.agentId ? String(data.agentId) : undefined,
    clientName: data.clientName || undefined,
    clientPhone: data.clientPhone || undefined,
    clientEmail: data.clientEmail || undefined,
    propertyName: data.propertyName || undefined,
    propertyRef: data.propertyRef || undefined,
    location: data.location || undefined,
    description: data.description || undefined,
    googleSync: data.googleSync || false,
    reminders: data.reminders || [],
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    createdBy: data.createdBy || '',
  }
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const data = await api.get<any[]>('/events')
  return (data || []).map(fromApi)
}

export async function createCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const data = await api.post<any>('/events', toApi(event) as Record<string, unknown>)
  return fromApi(data)
}

export async function updateCalendarEvent(id: string, event: CalendarEvent): Promise<CalendarEvent> {
  const data = await api.put<any>(`/events/${id}`, toApi(event) as Record<string, unknown>)
  return fromApi(data)
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await api.del<void>(`/events/${id}`)
}
