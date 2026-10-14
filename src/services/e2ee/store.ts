import type {
  Direction,
  KeyPairType,
  StorageType,
} from '@privacyresearch/libsignal-protocol-typescript'
import { abToB64, b64ToAb } from './base64'

/**
 * Minimal key/value backend so the Signal store works on localStorage
 * in the browser and on a plain Map in tests / non-DOM environments.
 */
export interface KV {
  get(k: string): string | null
  set(k: string, v: string): void
  del(k: string): void
}

export class MemoryKV implements KV {
  private map = new Map<string, string>()
  get(k: string): string | null {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  set(k: string, v: string): void {
    this.map.set(k, v)
  }
  del(k: string): void {
    this.map.delete(k)
  }
}

export class LocalStorageKV implements KV {
  constructor(private prefix: string) {}
  private k(k: string): string {
    return `${this.prefix}${k}`
  }
  get(k: string): string | null {
    try {
      return window.localStorage.getItem(this.k(k))
    } catch {
      return null
    }
  }
  set(k: string, v: string): void {
    try {
      window.localStorage.setItem(this.k(k), v)
    } catch {
      // storage full / private mode: sessions stay in memory for this tab
    }
  }
  del(k: string): void {
    try {
      window.localStorage.removeItem(this.k(k))
    } catch {
      // ignore
    }
  }
}

function encodeKp(kp: KeyPairType<ArrayBuffer>): string {
  return JSON.stringify({ pub: abToB64(kp.pubKey), priv: abToB64(kp.privKey) })
}

function decodeKp(raw: string | null): KeyPairType<ArrayBuffer> | undefined {
  if (!raw) return undefined
  try {
    const o = JSON.parse(raw)
    if (typeof o?.pub !== 'string' || typeof o?.priv !== 'string') return undefined
    return { pubKey: b64ToAb(o.pub), privKey: b64ToAb(o.priv) }
  } catch {
    return undefined
  }
}

/**
 * SignalProtocolStore backed by a KV namespace dedicated to one local user.
 * Trust policy is trust-on-first-use: unknown identities are trusted and
 * pinned; a changed key makes isTrustedIdentity return false so encrypt /
 * decrypt abort with "Identity key changed" instead of silently re-trusting.
 */
export class SignalStore implements StorageType {
  constructor(private kv: KV) {}

  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    return decodeKp(this.kv.get('identity'))
  }

  async getLocalRegistrationId(): Promise<number | undefined> {
    const raw = this.kv.get('reg')
    if (raw == null) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    _direction: Direction
  ): Promise<boolean> {
    const name = identifier.split('.')[0]
    const stored = this.kv.get(`idn:${name}`)
    if (!stored) {
      await this.saveIdentity(identifier, identityKey)
      return true
    }
    return stored === abToB64(identityKey)
  }

  async saveIdentity(encodedAddress: string, publicKey: ArrayBuffer): Promise<boolean> {
    const name = encodedAddress.split('.')[0]
    const cur = abToB64(publicKey)
    const prev = this.kv.get(`idn:${name}`)
    this.kv.set(`idn:${name}`, cur)
    return Boolean(prev && prev !== cur)
  }

  async loadPreKey(keyId: number | string): Promise<KeyPairType | undefined> {
    return decodeKp(this.kv.get(`pre:${keyId}`))
  }

  async storePreKey(keyId: number | string, keyPair: KeyPairType): Promise<void> {
    this.kv.set(`pre:${keyId}`, encodeKp(keyPair as KeyPairType<ArrayBuffer>))
  }

  async removePreKey(keyId: number | string): Promise<void> {
    this.kv.del(`pre:${keyId}`)
  }

  async storeSession(encodedAddress: string, record: string): Promise<void> {
    this.kv.set(`ses:${encodedAddress}`, record)
  }

  async loadSession(encodedAddress: string): Promise<string | undefined> {
    return this.kv.get(`ses:${encodedAddress}`) ?? undefined
  }

  async loadSignedPreKey(keyId: number | string): Promise<KeyPairType | undefined> {
    return decodeKp(this.kv.get(`spk:${keyId}`))
  }

  async storeSignedPreKey(keyId: number | string, keyPair: KeyPairType): Promise<void> {
    this.kv.set(`spk:${keyId}`, encodeKp(keyPair as KeyPairType<ArrayBuffer>))
  }

  async removeSignedPreKey(keyId: number | string): Promise<void> {
    this.kv.del(`spk:${keyId}`)
  }

  /** Namespace helpers for identity bookkeeping kept next to the store. */
  rawGet(k: string): string | null {
    return this.kv.get(k)
  }
  rawSet(k: string, v: string): void {
    this.kv.set(k, v)
  }
}
