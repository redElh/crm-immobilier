import { useEffect, useState } from 'react'
import type { Message } from '../../../types/messages'
import { decryptBlob } from '../../../services/e2ee/chat'
import { resolveMediaUrl } from '../../../utils/mediaUrl'
import { getAuthToken } from '../../../utils/auth'

const urlCache = new Map<string, string>()

function capCache() {
  if (urlCache.size <= 60) return
  const oldest = urlCache.keys().next().value as string | undefined
  if (oldest) {
    try {
      URL.revokeObjectURL(urlCache.get(oldest)!)
    } catch {
      // ignore
    }
    urlCache.delete(oldest)
  }
}

/**
 * Lazily fetch + AES-GCM-decrypt a sealed attachment's bytes into an object
 * URL (with auth header, like downloadMedia). Returns null while loading or
 * for non-sealed messages. Plaintext messages are NOT handled here.
 */
export function useSealedMediaUrl(message: Message): string | null {
  const sealedActive =
    message.kind === 'sealed' && message.sealedOk === true && !!message.sealedMedia
  const cipherUrl = sealedActive
    ? message.audioUrl || message.attachmentUrl || message.attachments[0]?.url
    : null
  const usable = cipherUrl && cipherUrl !== '#' ? cipherUrl : null

  const [url, setUrl] = useState<string | null>(() => urlCache.get(message.id) ?? null)

  useEffect(() => {
    if (!sealedActive || !usable || !message.sealedMedia) {
      if (!sealedActive) setUrl(null)
      return
    }
    const cached = urlCache.get(message.id)
    if (cached) {
      setUrl(cached)
      return
    }
    let cancelled = false
    setUrl(null)
    ;(async () => {
      try {
        const resolved = resolveMediaUrl(usable)
        if (!resolved) return
        const token = getAuthToken()
        const res = await fetch(resolved, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok || cancelled) return
        const ct = await res.arrayBuffer()
        if (cancelled) return
        const pt = await decryptBlob(ct, message.sealedMedia!.key, message.sealedMedia!.iv)
        if (cancelled) return
        const obj = URL.createObjectURL(new Blob([pt], { type: message.sealedMedia!.mime }))
        urlCache.set(message.id, obj)
        capCache()
        setUrl(obj)
      } catch {
        // keep the generic placeholder; bubble shows the lock footer
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sealedActive, usable, message.id, message.sealedMedia])

  return url
}
