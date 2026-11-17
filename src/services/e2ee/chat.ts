import {
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from '@privacyresearch/libsignal-protocol-typescript'
import { abToB64, abToUtf8, b64ToAb, b64ToBinStr, binStrToB64, utf8ToAb } from './base64'
import { DEVICE_ID, bundleToDevice, type FetchedBundle } from './keys'
import type { SignalStore } from './store'

/** Message kind used for sealed payloads (DB column + MessageKind). */
export const SEALED_KIND = 'sealed'

/** One recipient's ciphertext inside a sealed envelope. */
export interface SealPart {
  /** 3 = PreKeyWhisperMessage (first contact), 1 = WhisperMessage (session). */
  t: number
  /** base64(binary ciphertext) */
  b: string
}

/** Stored in `messages.body` for sealed messages. Server sees only this. */
export interface SealedEnvelope {
  v: 1
  sealed: true
  from: string
  parts: Record<string, SealPart>
}

/** Decrypted inner content — the only thing the UI renders. */
export interface SealedMediaMeta {
  /** base64 AES-GCM-256 content key */
  key: string
  /** base64 12-byte IV */
  iv: string
  name: string
  size: number
  mime: string
}

export interface InnerPayload {
  text: string
  media?: SealedMediaMeta
}

export type OpenErrorCode = 'not-for-me' | 'bad-envelope' | 'decrypt-failed' | 'identity-changed'

export class SealError extends Error {
  code: OpenErrorCode
  constructor(code: OpenErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

function addrOf(userId: string | number): SignalProtocolAddress {
  return new SignalProtocolAddress(String(userId), DEVICE_ID)
}

/** Detect a sealed envelope without throwing (cheap pre-checks first). */
export function parseSealed(body: unknown): SealedEnvelope | null {
  if (typeof body !== 'string' || body.length < 16 || body[0] !== '{' || body.length > 400000) return null
  try {
    const o = JSON.parse(body)
    if (o && o.sealed === true && o.v === 1 && o.from != null && o.parts && typeof o.parts === 'object') {
      return o as SealedEnvelope
    }
    return null
  } catch {
    return null
  }
}

export interface RecipientHandle {
  userId: string
  bundle: FetchedBundle | null
}

export interface SealResult {
  envelope: SealedEnvelope
  sealedIds: string[]
  missingIds: string[]
}

/**
 * Pairwise-encrypt `payload` for every recipient with a published bundle
 * (WhatsApp-equivalent confidentiality for 1:1 and groups without sender
 * keys). Recipients without bundles land in `missingIds` so the caller can
 * fall back to plaintext (opportunistic mode) or abort (strict mode).
 */
export async function sealEnvelope(args: {
  store: SignalStore
  myId: string
  recipients: RecipientHandle[]
  payload: InnerPayload
}): Promise<SealResult> {
  const { store, myId, recipients, payload } = args
  const raw = utf8ToAb(JSON.stringify(payload))
  const parts: Record<string, SealPart> = {}
  const sealedIds: string[] = []
  const missingIds: string[] = []

  for (const r of recipients) {
    if (!r.bundle) {
      missingIds.push(r.userId)
      continue
    }
    try {
      const addr = addrOf(r.userId)
      const cipher = new SessionCipher(store, addr)
      if (!(await cipher.hasOpenSession())) {
        await new SessionBuilder(store, addr).processPreKey(bundleToDevice(r.bundle))
      }
      const res = await cipher.encrypt(raw)
      if (!res.body) throw new Error('empty ciphertext')
      parts[String(r.userId)] = { t: res.type, b: binStrToB64(res.body) }
      sealedIds.push(r.userId)
    } catch {
      missingIds.push(r.userId)
    }
  }

  return { envelope: { v: 1, sealed: true, from: String(myId), parts }, sealedIds, missingIds }
}

export interface OpenResult {
  payload: InnerPayload
  /** True when a one-time prekey was consumed — caller should top up. */
  consumedPreKey: boolean
}

/** Decrypt my part of a sealed envelope sent by `senderId`. */
export async function openEnvelope(args: {
  store: SignalStore
  myId: string
  senderId: string
  envelope: SealedEnvelope
}): Promise<OpenResult> {
  const { store, myId, senderId, envelope } = args
  const part = envelope.parts?.[String(myId)]
  if (!part || typeof part.b !== 'string') {
    throw new SealError('not-for-me', 'no ciphertext part for this user')
  }
  const cipher = new SessionCipher(store, addrOf(senderId))
  const bin = b64ToBinStr(part.b)
  try {
    const pt =
      part.t === 3
        ? await cipher.decryptPreKeyWhisperMessage(bin)
        : await cipher.decryptWhisperMessage(bin)
    const payload = JSON.parse(abToUtf8(pt)) as InnerPayload
    if (typeof payload?.text !== 'string') throw new Error('bad inner payload')
    return { payload, consumedPreKey: part.t === 3 }
  } catch (e) {
    if (e instanceof SealError) throw e
    const msg = e instanceof Error ? e.message : ''
    if (/identity key changed|unknown identity/i.test(msg)) {
      throw new SealError('identity-changed', msg)
    }
    throw new SealError('decrypt-failed', msg)
  }
}

// ---------------------------------------------------------------------------
// Attachments: AES-GCM-256 content key, wrapped inside the sealed envelope.
// The server stores opaque ciphertext bytes and never sees the key.
// ---------------------------------------------------------------------------

function subtle(): SubtleCrypto {
  const c = globalThis.crypto?.subtle
  if (!c) throw new Error('WebCrypto unavailable')
  return c
}

export interface EncryptedBlob {
  bytes: ArrayBuffer
  keyB64: string
  ivB64: string
}

export async function encryptBlob(blob: Blob): Promise<EncryptedBlob> {
  const s = subtle()
  const key = await s.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = new Uint8Array(12)
  globalThis.crypto.getRandomValues(iv)
  const bytes = (await s.encrypt({ name: 'AES-GCM', iv }, key, await blob.arrayBuffer())) as ArrayBuffer
  const raw = await s.exportKey('raw', key)
  const ivCopy = new Uint8Array(12)
  ivCopy.set(iv)
  return { bytes, keyB64: abToB64(raw), ivB64: abToB64(ivCopy.buffer as ArrayBuffer) }
}

export async function decryptBlob(bytes: ArrayBuffer, keyB64: string, ivB64: string): Promise<ArrayBuffer> {
  const s = subtle()
  const key = await s.importKey('raw', b64ToAb(keyB64), { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  return (await s.decrypt({ name: 'AES-GCM', iv: new Uint8Array(b64ToAb(ivB64)) }, key, bytes)) as ArrayBuffer
}

// ---------------------------------------------------------------------------
// Plaintext cache: messages I could read (sent or decrypted) stay readable
// across reloads. Same trust domain as the session store (own device).
// ---------------------------------------------------------------------------

const CACHE_CAP = 500

function cacheKey(userId: string): string {
  return `e2ee:cache:${userId}`
}

function readCacheObj(userId: string): Record<string, InnerPayload> {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId))
    if (!raw) return {}
    const o = JSON.parse(raw)
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

export function readPlainCache(userId: string, messageId: string): InnerPayload | null {
  try {
    return readCacheObj(userId)[messageId] ?? null
  } catch {
    return null
  }
}

export function writePlainCache(userId: string, messageId: string, payload: InnerPayload): void {
  try {
    const o = readCacheObj(userId)
    o[messageId] = payload
    const ids = Object.keys(o)
    if (ids.length > CACHE_CAP) {
      for (const id of ids.slice(0, ids.length - CACHE_CAP)) delete o[id]
    }
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(o))
  } catch {
    // private mode / quota: in-memory readability for this tab is enough
  }
}
