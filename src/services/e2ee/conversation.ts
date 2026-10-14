import type { Conversation, Message, MessageKind, MessageParticipant } from '../../types/messages'
import { getAuthToken } from '../../utils/auth'
import {
  openEnvelope,
  parseSealed,
  readPlainCache,
  sealEnvelope,
  writePlainCache,
  type InnerPayload,
  type RecipientHandle,
  type SealedMediaMeta,
} from './chat'
import { topUpPreKeys, checkContactIdentity, trustContactIdentity } from './keys'
import { ensureE2EEIdentity, keyServer, storeFor } from './session'
import { encryptBlob } from './chat'

export { ensureE2EEIdentity, keyServer, storeFor, checkContactIdentity, trustContactIdentity }
export type { IdentityCheck } from './keys'

export const SEALED_PREVIEW = '🔒 Message chiffré'

/** Local user id from the JWT (sync; avoids an extra /auth/me round-trip). */
export function myIdFromToken(): string | null {
  try {
    const token = getAuthToken()
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload?.id != null ? String(payload.id) : null
  } catch {
    return null
  }
}

/** Real (human) recipients — drops the synthetic `group` pseudo-participant. */
export function realRecipients(participants: MessageParticipant[]): MessageParticipant[] {
  return (participants || []).filter(p => p && p.type !== 'group' && p.id != null && String(p.id) !== '')
}

async function fetchBundles(
  myId: string,
  participants: MessageParticipant[]
): Promise<{ handles: RecipientHandle[]; allSealed: boolean }> {
  const others = realRecipients(participants).filter(p => String(p.id) !== String(myId))
  if (others.length === 0) return { handles: [], allSealed: false }
  const handles = await Promise.all(
    others.map(async p => {
      try {
        const bundle = await keyServer.fetchBundle(String(p.id))
        return { userId: String(p.id), bundle }
      } catch {
        return { userId: String(p.id), bundle: null }
      }
    })
  )
  return { handles, allSealed: handles.every(h => h.bundle) && handles.length > 0 }
}

export interface SealAttempt {
  sealed: boolean
  kind: 'text' | 'sealed'
  body: string
  payload?: InnerPayload
}

/**
 * Opportunistic seal: returns a sealed envelope when EVERY recipient has
 * published keys, otherwise falls back to plaintext (caller sends as-is).
 */
export async function sealForConversation(args: {
  myId: string
  participants: MessageParticipant[]
  text: string
  media?: SealedMediaMeta
}): Promise<SealAttempt> {
  const { myId, participants, text, media } = args
  try {
    await ensureE2EEIdentity(myId)
    const { handles, allSealed } = await fetchBundles(myId, participants)
    if (!allSealed) return { sealed: false, kind: 'text', body: text }
    const payload: InnerPayload = media ? { text, media } : { text }
    const { envelope, missingIds } = await sealEnvelope({
      store: storeFor(myId),
      myId,
      recipients: handles,
      payload,
    })
    if (missingIds.length > 0) return { sealed: false, kind: 'text', body: text }
    return { sealed: true, kind: 'sealed', body: JSON.stringify(envelope), payload }
  } catch {
    return { sealed: false, kind: 'text', body: text }
  }
}

export interface PreparedMedia {
  sealed: boolean
  url: string
  size: string
  name: string
  meta?: SealedMediaMeta
}

/**
 * Upload a file for a conversation: encrypted bytes when every recipient is
 * sealable, otherwise hands back `{ sealed: false }` so the caller uploads
 * the original itself (single upload per path). The content key travels
 * inside the sealed envelope — the server only ever stores opaque bytes.
 */
export async function prepareSealedMedia(args: {
  myId: string
  participants: MessageParticipant[]
  file: File | Blob
  filename: string
  mime: string
  upload: (blob: Blob) => Promise<{ url: string; size: string }>
}): Promise<PreparedMedia> {
  const { myId, participants, file, filename, mime, upload } = args
  try {
    await ensureE2EEIdentity(myId)
    const { allSealed } = await fetchBundles(myId, participants)
    if (!allSealed) return { sealed: false, url: '', size: '', name: filename }
    const enc = await encryptBlob(file)
    const ct = new File([enc.bytes], filename, { type: 'application/octet-stream' })
    const up = await upload(ct)
    return {
      sealed: true,
      url: up.url,
      size: formatBytes(file.size),
      name: filename,
      meta: { key: enc.keyB64, iv: enc.ivB64, name: filename, size: file.size, mime },
    }
  } catch {
    return { sealed: false, url: '', size: '', name: filename }
  }
}

export function mimeToKind(mime: string): MessageKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'file'
}

/** Inner (plaintext) kind of a normalized sealed message for rendering. */
export function innerKindOf(message: Message): MessageKind {
  const media = message.sealedMedia
  if (media) return mimeToKind(media.mime)
  return 'text'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/**
 * Decrypt a sealed message into its plaintext form (mutates a copy).
 * Plaintext messages pass through untouched. Failures yield a locked
 * placeholder (`sealedOk: false`) — never throws.
 */
export async function normalizeMessage(myId: string, message: Message): Promise<Message> {
  if (!message || message.kind !== 'sealed') return message
  const out: Message = { ...message, isSealed: true, sealedOk: false, sealedMedia: null }

  const apply = (payload: InnerPayload): Message => {
    out.body = payload.text
    out.sealedOk = true
    out.sealedMedia = payload.media ?? null
    if (payload.media) {
      const m = payload.media
      const url = message.attachmentUrl && message.attachmentUrl !== '#' ? message.attachmentUrl : '#'
      const mk = mimeToKind(m.mime)
      out.attachments = [
        {
          id: `sealed-${message.id}`,
          name: m.name,
          size: formatBytes(m.size),
          url,
          kind: mk === 'image' ? 'image' : mk === 'video' ? 'video' : mk === 'audio' ? 'audio' : 'document',
        },
      ]
      if (mk === 'audio') out.audioUrl = url
    }
    return out
  }

  try {
    const cached = readPlainCache(myId, message.id)
    if (cached) return apply(cached)
    const envelope = parseSealed(message.body)
    if (!envelope) return out
    if (String(envelope.from) === String(myId)) return out // own message, cache missed
    await ensureE2EEIdentity(myId)
    const { payload, consumedPreKey } = await openEnvelope({
      store: storeFor(myId),
      myId,
      senderId: envelope.from,
      envelope,
    })
    writePlainCache(myId, message.id, payload)
    if (consumedPreKey) {
      topUpPreKeys(storeFor(myId), keyServer).catch(() => {})
    }
    return apply(payload)
  } catch {
    return out
  }
}

/** Sequential (ratchet-safe) normalization of a message list. */
export async function normalizeMessages(myId: string, messages: Message[]): Promise<Message[]> {
  const out: Message[] = []
  for (const m of messages || []) {
    out.push(await normalizeMessage(myId, m))
  }
  return out
}

/** Sidebar / realtime preview: never leak sealed plaintext. */
export function previewFor(message: Message): string {
  return previewTextFor(message)
}

/**
 * List/realtime preview for a (possibly normalized) message. Decrypted
 * content displays normally — encryption stays invisible. Only genuinely
 * undecryptable rows fall back to a neutral placeholder.
 */
export function previewTextFor(message: Message): string {
  if (!message) return ''
  if (message.kind === 'sealed' && !message.sealedOk) return 'Message illisible'
  if (message.kind === 'audio') return 'Message vocal'
  if (message.attachments && message.attachments.length > 0) return message.attachments[0].name
  return message.body || 'Nouveau message'
}

/**
 * Synchronous re-application of cached plaintext (no crypto, no network).
 * Used when server-fresh envelopes replace already-decrypted messages
 * (polling, refetch): readable content must survive, not flip to locked.
 */
export function applyCached(myId: string, message: Message): Message {
  if (!message || message.kind !== 'sealed' || message.sealedOk) return message
  let cached: InnerPayload | null = null
  try {
    cached = readPlainCache(myId, message.id)
  } catch {
    return message
  }
  if (!cached || typeof cached.text !== 'string') return message
  const out: Message = { ...message, isSealed: true, sealedOk: true, sealedMedia: cached.media ?? null }
  out.body = cached.text
  if (cached.media) {
    const m = cached.media
    const url = message.attachmentUrl && message.attachmentUrl !== '#' ? message.attachmentUrl : '#'
    const mk = mimeToKind(m.mime)
    out.attachments = [
      {
        id: `sealed-${message.id}`,
        name: m.name,
        size: formatBytes(m.size),
        url,
        kind: mk === 'image' ? 'image' : mk === 'video' ? 'video' : mk === 'audio' ? 'audio' : 'document',
      },
    ]
    if (mk === 'audio') out.audioUrl = url
  }
  return out
}

/** Re-apply cached plaintext across a conversation + refresh its preview. */
export function withDecryptedPreview(c: Conversation, myId: string): Conversation {
  let changed = false
  const messages = (c.messages || []).map(m => {
    const n = applyCached(myId, m)
    if (n !== m) changed = true
    return n
  })
  const last = [...messages].reverse().find(m => !m.deleted)
  let preview = c.preview
  // Sealed previews always reflect decrypt state — readable content shows
  // normally, undecryptable rows stay neutral. No lock text in the UI.
  if (last && last.kind === 'sealed' && !c.previewReaction) {
    const next = last.sealedOk ? previewTextFor(last) : 'Message illisible'
    if (next !== preview) {
      preview = next
      changed = true
    }
  }
  if (!changed) return c
  return { ...c, messages, preview }
}

/** Remember an own sent sealed message so it stays readable after reload. */
export function cacheOwnSealed(myId: string, messageId: string, payload: InnerPayload): void {
  writePlainCache(myId, messageId, payload)
}
