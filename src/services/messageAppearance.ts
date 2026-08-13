import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { fetchMessagingSettings } from './messageService'

export interface MessagingAppearance {
  theme: 'light' | 'dark' | 'system'
  messageSize: 'small' | 'medium' | 'large'
  showEmojis: boolean
  loaded: boolean
}

const DEFAULT_APPEARANCE: MessagingAppearance = {
  theme: 'light',
  messageSize: 'medium',
  showEmojis: true,
  loaded: false,
}

const SIZE_SCALE: Record<string, number> = {
  small: 0.88,
  medium: 1,
  large: 1.12,
}

let cache: MessagingAppearance = DEFAULT_APPEARANCE
let loading = false
const listeners = new Set<() => void>()

function notify() {
  for (const listener of Array.from(listeners)) {
    try {
      listener()
    } catch {
      // ignore listener errors
    }
  }
}

export function getAppearance(): MessagingAppearance {
  return cache
}

export function loadAppearance() {
  if (loading) return
  loading = true
  fetchMessagingSettings()
    .then(settings => {
      cache = {
        theme: settings.theme || 'light',
        messageSize: settings.messageSize || 'medium',
        showEmojis: settings.showEmojis !== false,
        loaded: true,
      }
    })
    .catch(() => {
      cache = { ...cache, loaded: true }
    })
    .finally(() => {
      loading = false
      notify()
    })
}

export function invalidateAppearance() {
  cache = { ...cache, loaded: false }
  notify()
  loadAppearance()
}

export function useMessagingAppearance(): MessagingAppearance {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1)
    listeners.add(listener)
    if (!cache.loaded && !loading) loadAppearance()
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return cache
}

export function appearanceScale(size: string): number {
  return SIZE_SCALE[size] ?? 1
}

/**
 * Zoom style for a messages page. The page root keeps its own `h-full w-full`
 * box (which paints at the container size), and the zoom scales only the
 * content inside, so the page still fills the whole layout like in "Moyen".
 */
export function messageZoomStyle(size: string): CSSProperties | undefined {
  const scale = appearanceScale(size)
  if (scale === 1) return undefined
  return { zoom: scale }
}
