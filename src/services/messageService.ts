import { api } from './api'
import { getAuthToken } from '../utils/auth'
import type {
  Conversation, Message, MessageParticipant, MessageReaction, MessageReactionPreview, MessagingSettings,
} from '../types/messages'

export interface CurrentUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  position?: string
  profile_image?: string
}

export function currentUserToParticipant(u: CurrentUser): MessageParticipant {
  return {
    id: String(u.id),
    name: `${u.first_name} ${u.last_name}`.trim() || 'Utilisateur',
    type: u.role === 'admin' || u.role === 'gerant' ? 'admin' : 'agent',
    email: u.email,
    role: u.position || (u.role === 'admin' || u.role === 'gerant' ? 'Administrateur' : 'Agent'),
    presence: 'online',
    picture: u.profile_image || undefined,
  }
}

export const uploadProfileImage = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  const token = getAuthToken()
  return fetch('http://localhost:5000/api/admin/profile/upload-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors du téléchargement' }))
      throw new Error(err.error || 'Erreur lors du téléchargement')
    }
    return res.json() as Promise<{ profile_image: string }>
  })
}

export const fetchCurrentUser = () => api.get<CurrentUser>('/auth/me')

export const fetchConversations = () => api.get<Conversation[]>('/messages/conversations')
export const fetchConversation = (id: string) => api.get<Conversation>(`/messages/conversations/${id}`)
export const fetchMessages = (id: string) => api.get<Message[]>(`/messages/conversations/${id}/messages`)

export const createConversation = (body: {
  participantIds: number[]
  name?: string
  firstMessage?: string
}) => api.post<Conversation>('/messages/conversations', body as unknown as Record<string, unknown>)

export const sendMessage = (
  id: string,
  body: {
    body?: string
    kind?: string
    duration?: string
    attachmentName?: string
    attachmentSize?: string
    attachmentUrl?: string
    audioUrl?: string
  }
) =>
  api.post<Message>(
    `/messages/conversations/${id}/messages`,
    body as unknown as Record<string, unknown>
  )

export const uploadVoice = (blob: Blob) => {
  const formData = new FormData()
  formData.append('audio', blob, 'voice.webm')
  const token = getAuthToken()
  return fetch('http://localhost:5000/api/messages/voice/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors du téléchargement' }))
      throw new Error(err.error || 'Erreur lors du téléchargement')
    }
    return res.json() as Promise<{ url: string; size: string }>
  })
}

export interface AttachmentUploadResult {
  url: string
  name: string
  size: string
}

export const uploadAttachment = (file: File) => {
  const formData = new FormData()
  formData.append('file', file, file.name)
  const token = getAuthToken()
  return fetch('http://localhost:5000/api/messages/attachments/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur lors du téléchargement' }))
      throw new Error(err.error || 'Erreur lors du téléchargement')
    }
    return res.json() as Promise<AttachmentUploadResult>
  })
}

export const markConversationRead = (id: string) =>
  api.patch<{ ok: boolean }>(`/messages/conversations/${id}/read`, {})

export interface ReactionToggleResult {
  reactions: MessageReaction[]
  preview: string
  previewReaction: MessageReactionPreview | null
  lastActivityAt: string
}

export const toggleReaction = (conversationId: string, messageId: string, emoji: string) =>
  api.post<ReactionToggleResult>(
    `/messages/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji }
  )

export const deleteConversation = (id: string) =>
  api.del<{ ok: boolean }>(`/messages/conversations/${id}`)

export const clearConversation = (id: string) =>
  api.post<{ ok: boolean; clearedAt: string }>(`/messages/conversations/${id}/clear`, {})

export const deleteMessages = (conversationId: string, messageIds: number[]) =>
  api.post<{ ok: boolean; messageIds: string[] }>(
    `/messages/conversations/${conversationId}/messages/batch-delete`,
    { messageIds }
  )

export const fetchMessageUsers = () => api.get<MessageParticipant[]>('/messages/users')

export const addGroupMembers = (conversationId: string, userIds: number[]) =>
  api.post<{ ok: boolean }>(`/messages/conversations/${conversationId}/members`, { userIds })

export const removeGroupMembers = (conversationId: string, userIds: number[]) =>
  api.post<{ ok: boolean }>(`/messages/conversations/${conversationId}/members/remove`, { userIds })

export const fetchMessagingSettings = () => api.get<MessagingSettings>('/messages/settings')

export const saveMessagingSettings = (settings: MessagingSettings) =>
  api.put<MessagingSettings>('/messages/settings', settings as unknown as Record<string, unknown>)
