import { LocalStorageKV, SignalStore } from './store'
import {
  ensureIdentity,
  type FetchedBundle,
  type KeyServer,
  type PublishedBundle,
} from './keys'
import { countSignalPreKeys, fetchSignalBundle, fetchSignalIdentity, publishSignalKeys } from '../messageService'

const stores = new Map<string, SignalStore>()

/** One Signal store per local user, persisted in that user's localStorage namespace. */
export function storeFor(userId: string): SignalStore {
  let s = stores.get(userId)
  if (!s) {
    s = new SignalStore(new LocalStorageKV(`e2ee:${userId}:`))
    stores.set(userId, s)
  }
  return s
}

export const keyServer: KeyServer = {
  publishKeys: (b: PublishedBundle) => publishSignalKeys(b).then(() => undefined),
  fetchBundle: async (uid: string): Promise<FetchedBundle | null> => {
    const dto = await fetchSignalBundle(uid)
    if (!dto) return null
    return {
      userId: dto.userId,
      identityKey: dto.identityKey,
      registrationId: dto.registrationId,
      signedPreKey: dto.signedPreKey,
      preKey: dto.preKey,
    }
  },
  countPreKeys: () => countSignalPreKeys(),
  fetchIdentity: (uid: string) => fetchSignalIdentity(uid),
}

let bootstrappedFor: string | null = null
let bootstrapPromise: Promise<void> | null = null

/**
 * Generate (if needed) + publish this browser's identity, top up one-time
 * prekeys. Safe to call on every mount — publish only happens on rotation.
 * Failures never throw: encryption simply stays unavailable (plaintext mode).
 */
export function ensureE2EEIdentity(userId: string): Promise<void> {
  if (bootstrappedFor === userId && bootstrapPromise) return bootstrapPromise
  bootstrappedFor = userId
  bootstrapPromise = (async () => {
    try {
      await ensureIdentity(storeFor(userId), userId, keyServer)
    } catch {
      // offline / server without key tables: stay in plaintext mode
    }
  })()
  return bootstrapPromise
}
