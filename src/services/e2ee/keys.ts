import {
  KeyHelper,
  SessionCipher,
  SignalProtocolAddress,
  type KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript'
import { abToB64, b64ToAb } from './base64'
import type { SignalStore } from './store'

/** Single device per user in v1 — every address is `<userId>.1`. */
export const DEVICE_ID = 1

export function addressOf(userId: string | number): string {
  return `${userId}.${DEVICE_ID}`
}

/** What the client publishes to the server (all binary fields base64). */
export interface PublishedPreKey {
  keyId: number
  publicKey: string
}

export interface PublishedBundle {
  identityKey: string
  registrationId: number
  signedPreKey: { keyId: number; publicKey: string; signature: string }
  preKeys: PublishedPreKey[]
}

/** What the server hands out for one user (one one-time prekey, now consumed). */
export interface FetchedBundle {
  userId: string
  identityKey: string
  registrationId: number
  signedPreKey: { keyId: number; publicKey: string; signature: string }
  preKey: { keyId: number; publicKey: string } | null
}

/** Transport between the e2ee module and messageService (keeps this lib API-free). */
export interface KeyServer {
  publishKeys(bundle: PublishedBundle): Promise<void>
  fetchBundle(userId: string): Promise<FetchedBundle | null>
  countPreKeys(): Promise<number>
  /** Identity only — consumes nothing, safe to poll for change detection. */
  fetchIdentity(userId: string): Promise<{ userId: string; identityKey: string } | null>
}

const PREKEY_BATCH = 100
/** Refill one-time prekeys when fewer than this remain on the server. */
export const PREKEY_TOPUP_THRESHOLD = 20
const PREKEY_ID_MAX = 0xffffff

/** Signed-prekey rotation period (weekly, per Signal practice). */
export const SPK_ROTATION_MS = 7 * 24 * 60 * 60 * 1000

function randomKeyId(): number {
  const a = new Uint32Array(1)
  globalThis.crypto.getRandomValues(a)
  return 1 + (a[0] % PREKEY_ID_MAX)
}

/**
 * Ensure this browser owns an identity for `userId`, publish it when new,
 * and keep the server stocked with one-time prekeys.
 *
 * Identity is pinned: if the local store already has an identity AND it
 * matches what we last published, only a top-up happens.
 */
export async function ensureIdentity(
  store: SignalStore,
  userId: string,
  server: KeyServer
): Promise<{ identityB64: string; registrationId: number; rotated: boolean }> {
  let identity = await store.getIdentityKeyPair()
  let registrationId = await store.getLocalRegistrationId()
  let rotated = false

  if (!identity || registrationId == null) {
    identity = (await KeyHelper.generateIdentityKeyPair()) as KeyPairType<ArrayBuffer>
    registrationId = KeyHelper.generateRegistrationId()
    store.rawSet('identity', JSON.stringify({ pub: abToB64(identity.pubKey), priv: abToB64(identity.privKey) }))
    store.rawSet('reg', String(registrationId))
    rotated = true
  }

  const identityB64 = abToB64(identity.pubKey)
  const publishedMarker = store.rawGet('publishedIdentity')

  // Signed prekey: rotated ~monthly. Previous generations stay in the local
  // store (grace period) so in-flight type-3 messages addressed to the old
  // SPK still decrypt; the server only ever serves the current one.
  let spkId = Number(store.rawGet('spk:current') || '1')
  if (!Number.isInteger(spkId) || spkId < 1) spkId = 1
  let signed = await store.loadSignedPreKey(spkId)
  let createdAt = Number(store.rawGet(`spk:${spkId}:created`) || '0')
  if (!signed) {
    // Legacy v1 installs only know id 1 with no timestamp — adopt it and
    // stamp it now instead of forcing an immediate rotation for everyone.
    const legacy = spkId === 1 ? undefined : await store.loadSignedPreKey(1)
    if (legacy) {
      spkId = 1
      signed = legacy
      createdAt = Date.now()
      store.rawSet('spk:1:created', String(createdAt))
      store.rawSet('spk:current', '1')
    } else {
      const spk = await KeyHelper.generateSignedPreKey(identity, spkId)
      signed = spk.keyPair as KeyPairType<ArrayBuffer>
      await store.storeSignedPreKey(spkId, signed)
      store.rawSet(`spk:${spkId}:sig`, abToB64(spk.signature))
      createdAt = Date.now()
      store.rawSet(`spk:${spkId}:created`, String(createdAt))
      store.rawSet('spk:current', String(spkId))
      rotated = true
    }
  } else if (!createdAt) {
    createdAt = Date.now()
    store.rawSet(`spk:${spkId}:created`, String(createdAt))
  }
  if (Date.now() - createdAt >= SPK_ROTATION_MS) {
    const nextId = (spkId % PREKEY_ID_MAX) + 1
    const spk = await KeyHelper.generateSignedPreKey(identity, nextId)
    await store.storeSignedPreKey(nextId, spk.keyPair as KeyPairType<ArrayBuffer>)
    store.rawSet(`spk:${nextId}:sig`, abToB64(spk.signature))
    store.rawSet(`spk:${nextId}:created`, String(Date.now()))
    store.rawSet('spk:current', String(nextId))
    spkId = nextId
    signed = spk.keyPair as KeyPairType<ArrayBuffer>
    rotated = true
  }
  const sigB64 = store.rawGet(`spk:${spkId}:sig`) ?? ''
  const signedPubB64 = abToB64((signed as KeyPairType<ArrayBuffer>).pubKey)
  const spkMarker = `${spkId}:${signedPubB64}`
  const publishedSpk = store.rawGet('publishedSpk')

  if (publishedMarker !== identityB64 || publishedSpk !== spkMarker || !sigB64) {
    // (Re)publish everything: identity + current signed prekey + a fresh batch.
    const batch = await makePreKeyBatch(store, PREKEY_BATCH)
    await server.publishKeys({
      identityKey: identityB64,
      registrationId,
      signedPreKey: { keyId: spkId, publicKey: signedPubB64, signature: sigB64 },
      preKeys: batch,
    })
    store.rawSet('publishedIdentity', identityB64)
    store.rawSet('publishedSpk', spkMarker)
    rotated = true
  } else {
    await topUpPreKeys(store, server)
  }

  return { identityB64, registrationId, rotated }
}

async function makePreKeyBatch(store: SignalStore, n: number): Promise<PublishedPreKey[]> {
  const batch: PublishedPreKey[] = []
  let keyId = randomKeyId()
  let attempts = 0
  while (batch.length < n && attempts < n * 4) {
    attempts += 1
    keyId = (keyId % PREKEY_ID_MAX) + 1
    if (await store.loadPreKey(keyId)) continue
    const pre = await KeyHelper.generatePreKey(keyId)
    await store.storePreKey(keyId, pre.keyPair)
    batch.push({ keyId, publicKey: abToB64(pre.keyPair.pubKey) })
  }
  return batch
}

/** Current signed-prekey id for top-up publishes. */
async function currentSpk(store: SignalStore): Promise<{ id: number; pub: string; sig: string } | null> {
  const id = Number(store.rawGet('spk:current') || '1')
  const kp = await store.loadSignedPreKey(id)
  const sig = store.rawGet(`spk:${id}:sig`)
  if (!kp || !sig) return null
  return { id, pub: abToB64((kp as KeyPairType<ArrayBuffer>).pubKey), sig }
}

/** Keep at least PREKEY_BATCH one-time prekeys on the server. */
export async function topUpPreKeys(store: SignalStore, server: KeyServer): Promise<void> {
  let remaining: number
  try {
    remaining = await server.countPreKeys()
  } catch {
    return
  }
  if (remaining >= PREKEY_TOPUP_THRESHOLD) return
  const batch = await makePreKeyBatch(store, PREKEY_BATCH)
  if (batch.length === 0) return
  const identity = await store.getIdentityKeyPair()
  const registrationId = await store.getLocalRegistrationId()
  if (!identity || registrationId == null) return
  const spk = await currentSpk(store)
  if (!spk) return
  await server.publishKeys({
    identityKey: abToB64(identity.pubKey),
    registrationId,
    signedPreKey: {
      keyId: spk.id,
      publicKey: spk.pub,
      signature: spk.sig,
    },
    preKeys: batch,
  })
  store.rawSet('publishedSpk', `${spk.id}:${spk.pub}`)
}

/** Convert a server bundle (base64) into libsignal ArrayBuffer structs. */
/** Convert a server bundle (base64) into libsignal ArrayBuffer structs. */
export function bundleToDevice(bundle: FetchedBundle): {
  identityKey: ArrayBuffer
  registrationId: number
  signedPreKey: { keyId: number; publicKey: ArrayBuffer; signature: ArrayBuffer }
  preKey?: { keyId: number; publicKey: ArrayBuffer }
} {
  return {
    identityKey: b64ToAb(bundle.identityKey),
    registrationId: bundle.registrationId,
    signedPreKey: {
      keyId: bundle.signedPreKey.keyId,
      publicKey: b64ToAb(bundle.signedPreKey.publicKey),
      signature: b64ToAb(bundle.signedPreKey.signature),
    },
    preKey: bundle.preKey
      ? { keyId: bundle.preKey.keyId, publicKey: b64ToAb(bundle.preKey.publicKey) }
      : undefined,
  }
}

export interface IdentityCheck {
  /** True when the contact published a NEW identity since we pinned one. */
  changed: boolean
  pinnedB64: string | null
  remoteB64: string | null
}

/**
 * Safety-number check: compare a contact's currently published identity
 * against our pinned key. Uses the non-consuming identity endpoint, so it
 * never burns one-time prekeys and is safe to run on every conversation open.
 */
export async function checkContactIdentity(
  store: SignalStore,
  server: KeyServer,
  userId: string
): Promise<IdentityCheck> {
  const pinned = store.rawGet(`idn:${userId}`)
  let remote: string | null = null
  try {
    const id = await server.fetchIdentity(userId)
    remote = id?.identityKey ?? null
  } catch {
    return { changed: false, pinnedB64: pinned, remoteB64: null }
  }
  if (!remote || !pinned) return { changed: false, pinnedB64: pinned, remoteB64: remote }
  return { changed: pinned !== remote, pinnedB64: pinned, remoteB64: remote }
}

/**
 * Recover from a contact's identity rotation (new device / cleared storage):
 * pin their current published key and drop stale sessions so the next send
 * builds a fresh X3DH session. Call only after the user explicitly trusts
 * the new safety number.
 */
export async function trustContactIdentity(
  store: SignalStore,
  server: KeyServer,
  userId: string
): Promise<boolean> {
  let remote: string | null = null
  try {
    const id = await server.fetchIdentity(userId)
    remote = id?.identityKey ?? null
  } catch {
    return false
  }
  if (!remote) return false
  store.rawSet(`idn:${userId}`, remote)
  try {
    const cipher = new SessionCipher(store, new SignalProtocolAddress(String(userId), DEVICE_ID))
    await cipher.deleteAllSessionsForDevice()
  } catch {
    // no sessions to drop — trusting alone is enough
  }
  return true
}
