/**
 * @jest-environment node
 */
import { webcrypto } from 'crypto'
import { Blob as NodeBlob } from 'buffer'

// Polyfill Web APIs missing from the jest env (Node globals otherwise).
const g = globalThis as unknown as Record<string, unknown>
if (!g.crypto) g.crypto = webcrypto
if (!g.Blob) g.Blob = NodeBlob
if (!g.btoa) g.btoa = (s: string) => Buffer.from(s, 'binary').toString('base64')
if (!g.atob) g.atob = (b: string) => Buffer.from(b, 'base64').toString('binary')

import { MemoryKV, SignalStore } from '../store'
import {
  checkContactIdentity,
  ensureIdentity,
  topUpPreKeys,
  trustContactIdentity,
  type FetchedBundle,
  type KeyServer,
  type PublishedBundle,
} from '../keys'
import {
  decryptBlob,
  encryptBlob,
  openEnvelope,
  parseSealed,
  sealEnvelope,
} from '../chat'

/** In-memory stand-in for the prekey endpoints (mirrors the SQL semantics). */
function makeRoutedServer() {
  const identities = new Map<string, PublishedBundle>()
  const pools = new Map<string, { keyId: number; publicKey: string }[]>()
  const used = new Map<string, Set<number>>()
  const server: KeyServer = {
    async publishKeys(bundle: PublishedBundle) {
      const uid = (bundle as unknown as { _uid: string })._uid
      const prev = identities.get(uid)
      identities.set(uid, bundle)
      // Mirror the server: a new identity purges pooled prekeys of the dead device.
      if (!prev || prev.identityKey !== bundle.identityKey) {
        pools.set(uid, [])
        used.set(uid, new Set<number>())
      }
      const pool = pools.get(uid) ?? []
      const seen = used.get(uid) ?? new Set<number>()
      used.set(uid, seen)
      for (const pk of bundle.preKeys) {
        if (!pool.some(p => p.keyId === pk.keyId)) pool.push({ keyId: pk.keyId, publicKey: pk.publicKey })
      }
      pools.set(uid, pool)
    },
    async fetchBundle(userId: string): Promise<FetchedBundle | null> {
      const id = identities.get(userId)
      if (!id) return null
      const pool = pools.get(userId) ?? []
      const seen = used.get(userId) ?? new Set<number>()
      const next = pool.find(p => !seen.has(p.keyId))
      if (next) seen.add(next.keyId)
      return {
        userId,
        identityKey: id.identityKey,
        registrationId: id.registrationId,
        signedPreKey: id.signedPreKey,
        preKey: next ? { keyId: next.keyId, publicKey: next.publicKey } : null,
      }
    },
    async countPreKeys() {
      return 99
    },
    async fetchIdentity(userId: string) {
      const id = identities.get(userId)
      return id ? { userId, identityKey: id.identityKey } : null
    },
  }
  const forUser = (uid: string): KeyServer => ({
    publishKeys: (b: PublishedBundle) => server.publishKeys({ ...b, _uid: uid } as PublishedBundle),
    fetchBundle: (u: string) => server.fetchBundle(u),
    countPreKeys: () => server.countPreKeys(),
    fetchIdentity: (u: string) => server.fetchIdentity(u),
  })
  return { server, forUser }
}

function userCtx(uid: string, routed: ReturnType<typeof makeRoutedServer>) {
  const store = new SignalStore(new MemoryKV())
  const server = routed.forUser(uid)
  return { uid, store, server }
}

test('full handshake: invite (type 3) then reply (type 1)', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  const bob = userCtx('2', routed)

  await ensureIdentity(alice.store, '1', alice.server)
  await ensureIdentity(bob.store, '2', bob.server)

  const bobBundle = await routed.server.fetchBundle('2')
  expect(bobBundle).not.toBeNull()

  const sealed = await sealEnvelope({
    store: alice.store,
    myId: '1',
    recipients: [{ userId: '2', bundle: bobBundle }],
    payload: { text: 'Bonjour Bob 🔒' },
  })
  expect(sealed.missingIds).toEqual([])
  expect(Object.keys(sealed.envelope.parts)).toEqual(['2'])
  expect(sealed.envelope.parts['2'].t).toBe(3)

  const opened = await openEnvelope({
    store: bob.store,
    myId: '2',
    senderId: '1',
    envelope: sealed.envelope,
  })
  expect(opened.payload.text).toBe('Bonjour Bob 🔒')
  expect(opened.consumedPreKey).toBe(true)

  // Bob replies on the now-open session (type 1 both ways from here).
  const aliceBundle = await routed.server.fetchBundle('1')
  const reply = await sealEnvelope({
    store: bob.store,
    myId: '2',
    recipients: [{ userId: '1', bundle: aliceBundle }],
    payload: { text: 'Salut Alice !' },
  })
  expect(reply.envelope.parts['1'].t).toBe(1)
  const openedReply = await openEnvelope({
    store: alice.store,
    myId: '1',
    senderId: '2',
    envelope: reply.envelope,
  })
  expect(openedReply.payload.text).toBe('Salut Alice !')

  // Second message same session stays type 1.
  const again = await sealEnvelope({
    store: alice.store,
    myId: '1',
    recipients: [{ userId: '2', bundle: await routed.server.fetchBundle('2') }],
    payload: { text: 'Deuxième message' },
  })
  expect(again.envelope.parts['2'].t).toBe(1)
  const openedAgain = await openEnvelope({
    store: bob.store,
    myId: '2',
    senderId: '1',
    envelope: again.envelope,
  })
  expect(openedAgain.payload.text).toBe('Deuxième message')
}, 60000)

test('group fan-out: one envelope, a part per member', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  const bob = userCtx('2', routed)
  const carol = userCtx('3', routed)
  await ensureIdentity(alice.store, '1', alice.server)
  await ensureIdentity(bob.store, '2', bob.server)
  await ensureIdentity(carol.store, '3', carol.server)

  const sealed = await sealEnvelope({
    store: alice.store,
    myId: '1',
    recipients: [
      { userId: '2', bundle: await routed.server.fetchBundle('2') },
      { userId: '3', bundle: await routed.server.fetchBundle('3') },
    ],
    payload: { text: 'Bonjour le groupe' },
  })
  expect(sealed.missingIds).toEqual([])
  expect(Object.keys(sealed.envelope.parts).sort()).toEqual(['2', '3'])

  // Parts are pairwise: Bob cannot open Carol's part and vice versa.
  const bobOpened = await openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: sealed.envelope })
  expect(bobOpened.payload.text).toBe('Bonjour le groupe')
  const carolOpened = await openEnvelope({ store: carol.store, myId: '3', senderId: '1', envelope: sealed.envelope })
  expect(carolOpened.payload.text).toBe('Bonjour le groupe')
  await expect(
    openEnvelope({ store: bob.store, myId: '3', senderId: '1', envelope: sealed.envelope })
  ).rejects.toMatchObject({ code: 'decrypt-failed' })
}, 60000)

test('missing bundle lands in missingIds (opportunistic fallback signal)', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  await ensureIdentity(alice.store, '1', alice.server)
  const sealed = await sealEnvelope({
    store: alice.store,
    myId: '1',
    recipients: [
      { userId: '9', bundle: await routed.server.fetchBundle('9') },
    ],
    payload: { text: 'hello?' },
  })
  expect(sealed.missingIds).toEqual(['9'])
  expect(sealed.sealedIds).toEqual([])
})

test('AES-GCM attachment blob round-trips', async () => {
  const original = new TextEncoder().encode('fake-pdf-bytes-0123456789'.repeat(100))
  const blob = new Blob([original], { type: 'application/pdf' })
  const enc = await encryptBlob(blob)
  expect(enc.bytes.byteLength).toBeGreaterThan(original.byteLength)
  const pt = await decryptBlob(enc.bytes, enc.keyB64, enc.ivB64)
  expect(new Uint8Array(pt)).toEqual(original)
})

test('TOFU trust: unknown trusted, changed rejected', async () => {
  const store = new SignalStore(new MemoryKV())
  const { Direction } = await import('@privacyresearch/libsignal-protocol-typescript')
  const { KeyHelper } = await import('@privacyresearch/libsignal-protocol-typescript')
  const kp1 = await KeyHelper.generateIdentityKeyPair()
  const kp2 = await KeyHelper.generateIdentityKeyPair()
  expect(await store.isTrustedIdentity('5', kp1.pubKey, Direction.SENDING)).toBe(true)
  expect(await store.isTrustedIdentity('5', kp1.pubKey, Direction.SENDING)).toBe(true)
  expect(await store.isTrustedIdentity('5', kp2.pubKey, Direction.SENDING)).toBe(false)
})

test('parseSealed accepts envelopes, rejects plaintext', () => {
  expect(parseSealed('Bonjour')).toBeNull()
  expect(parseSealed('{"v":1}')).toBeNull()
  const env = { v: 1, sealed: true, from: '1', parts: { '2': { t: 3, b: 'eA==' } } }
  expect(parseSealed(JSON.stringify(env))).toEqual(env)
})

test('lifecycle: key loss → detect change → trust → sealed chat resumes', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  let bob = userCtx('2', routed)
  await ensureIdentity(alice.store, '1', alice.server)
  await ensureIdentity(bob.store, '2', bob.server)

  // Healthy exchange first.
  const first = await sealEnvelope({
    store: alice.store, myId: '1',
    recipients: [{ userId: '2', bundle: await routed.server.fetchBundle('2') }],
    payload: { text: 'avant' },
  })
  expect(first.missingIds).toEqual([])
  const openedFirst = await openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: first.envelope })
  expect(openedFirst.payload.text).toBe('avant')

  // Bob loses everything (cleared storage / new device) and re-registers.
  bob = userCtx('2', routed)
  await ensureIdentity(bob.store, '2', bob.server)

  // Alice detects the safety-number change without burning a prekey.
  const check = await checkContactIdentity(alice.store, alice.server, '2')
  expect(check.changed).toBe(true)

  // Alice still holds the OLD ratchet session, so her next seal goes out on
  // the stale session — the failure surfaces at receipt, not at send (this
  // is inherent to async messaging: the sender cannot know). Bob's wiped
  // store has no session and cannot open it.
  const stale = await sealEnvelope({
    store: alice.store, myId: '1',
    recipients: [{ userId: '2', bundle: await routed.server.fetchBundle('2') }],
    payload: { text: 'pendant' },
  })
  expect(stale.missingIds).toEqual([])
  await expect(
    openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: stale.envelope })
  ).rejects.toMatchObject({ code: 'decrypt-failed' })

  // Alice verifies out-of-band and trusts → sealed chat resumes.
  expect(await trustContactIdentity(alice.store, alice.server, '2')).toBe(true)
  const healed = await sealEnvelope({
    store: alice.store, myId: '1',
    recipients: [{ userId: '2', bundle: await routed.server.fetchBundle('2') }],
    payload: { text: 'après' },
  })
  expect(healed.missingIds).toEqual([])
  const openedHealed = await openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: healed.envelope })
  expect(openedHealed.payload.text).toBe('après')

  // No change → no warning.
  const recheck = await checkContactIdentity(alice.store, alice.server, '2')
  expect(recheck.changed).toBe(false)
}, 60000)

test('signed-prekey rotation keeps sessions alive and publishes the new SPK', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  const bob = userCtx('2', routed)
  await ensureIdentity(alice.store, '1', alice.server)
  await ensureIdentity(bob.store, '2', bob.server)

  const before = await routed.server.fetchBundle('2')
  const oldSpkId = before!.signedPreKey.keyId

  // Age Bob's SPK past the rotation period, then re-ensure.
  bob.store.rawSet('spk:current', String(oldSpkId))
  bob.store.rawSet(`spk:${oldSpkId}:created`, String(Date.now() - 8 * 24 * 60 * 60 * 1000))
  const res = await ensureIdentity(bob.store, '2', bob.server)
  expect(res.rotated).toBe(true)

  const after = await routed.server.fetchBundle('2')
  expect(after!.signedPreKey.keyId).not.toBe(oldSpkId)

  // Old sessions still decrypt (grace: old SPK privkey retained).
  const sealed = await sealEnvelope({
    store: alice.store, myId: '1',
    recipients: [{ userId: '2', bundle: before }],
    payload: { text: 'via ancien SPK' },
  })
  const opened = await openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: sealed.envelope })
  expect(opened.payload.text).toBe('via ancien SPK')
}, 60000)

test('one-time prekeys refill below threshold, untouched above', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  await ensureIdentity(alice.store, '1', alice.server)

  let publishes = 0
  const lowServer: KeyServer = {
    ...alice.server,
    countPreKeys: async () => 3,
    publishKeys: async (b: PublishedBundle) => { publishes++; return alice.server.publishKeys(b) },
  }
  await topUpPreKeys(alice.store, lowServer)
  expect(publishes).toBe(1)

  publishes = 0
  const healthyServer: KeyServer = { ...alice.server, countPreKeys: async () => 50 }
  await topUpPreKeys(alice.store, healthyServer)
  expect(publishes).toBe(0)
})

test('every message uses fresh ephemeral keys: distinct ciphertexts, all open', async () => {
  const routed = makeRoutedServer()
  const alice = userCtx('1', routed)
  const bob = userCtx('2', routed)
  await ensureIdentity(alice.store, '1', alice.server)
  await ensureIdentity(bob.store, '2', bob.server)

  const bodies = new Set<string>()
  const texts = ['premier', 'deuxième', 'même texte', 'même texte']
  for (const t of texts) {
    const s = await sealEnvelope({
      store: alice.store, myId: '1',
      recipients: [{ userId: '2', bundle: await routed.server.fetchBundle('2') }],
      payload: { text: t },
    })
    expect(s.missingIds).toEqual([])
    // Fresh message keys every time — even identical plaintexts differ.
    expect(bodies.has(s.envelope.parts['2'].b)).toBe(false)
    bodies.add(s.envelope.parts['2'].b)
    const opened = await openEnvelope({ store: bob.store, myId: '2', senderId: '1', envelope: s.envelope })
    expect(opened.payload.text).toBe(t)
  }
  expect(bodies.size).toBe(texts.length)
}, 60000)
