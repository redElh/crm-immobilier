import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'crm-scroll-pages-v1'

type ScrollMemory = Record<string, number>

function readMemory(): ScrollMemory {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMemory(memory: ScrollMemory) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {}
}

export function useScrollMemory(ref: RefObject<HTMLElement | null>, ready = true) {
  const location = useLocation()
  const key = `${location.pathname}${location.search}`
  const keyRef = useRef(key)
  keyRef.current = key

  const memory = useRef<ScrollMemory | null>(null)
  if (memory.current === null) memory.current = readMemory()

  const restoring = useRef(false)
  const preparedKey = useRef<string | null>(null)

  useEffect(() => {
    if (!ready) return
    const el = ref.current
    if (!el) return

    let saveTimer: ReturnType<typeof setTimeout> | undefined

    const save = () => {
      if (restoring.current || preparedKey.current !== keyRef.current) return
      memory.current![keyRef.current] = el.scrollTop
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => writeMemory(memory.current!), 120)
    }

    const flush = () => {
      if (preparedKey.current !== keyRef.current || restoring.current) return
      memory.current![keyRef.current] = el.scrollTop
      if (saveTimer) clearTimeout(saveTimer)
      writeMemory(memory.current!)
    }

    el.addEventListener('scroll', save, { passive: true })
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)

    return () => {
      el.removeEventListener('scroll', save)
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
      if (saveTimer) clearTimeout(saveTimer)
      writeMemory(memory.current!)
    }
  }, [ready, ref])

  useLayoutEffect(() => {
    if (!ready) return
    const el = ref.current
    if (!el) return

    const saved = memory.current?.[key]
    const target = typeof saved === 'number' && Number.isFinite(saved) && saved > 0 ? saved : 0
    preparedKey.current = key

    if (target === 0) {
      restoring.current = false
      el.scrollTop = 0
      return
    }

    restoring.current = true
    let cancelled = false
    let attempt = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const previousVisibility = el.style.visibility
    let hidden = false

    const hide = () => {
      if (hidden) return
      hidden = true
      el.style.visibility = 'hidden'
    }

    const show = () => {
      if (!hidden) return
      hidden = false
      el.style.visibility = previousVisibility
    }

    const removeUserListeners = () => {
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchmove', cancel)
      window.removeEventListener('keydown', cancel)
    }

    const stop = () => {
      cancelled = true
      restoring.current = false
      if (timer) clearTimeout(timer)
      show()
      removeUserListeners()
    }

    function cancel() {
      stop()
    }

    const finish = () => {
      restoring.current = false
      if (timer) clearTimeout(timer)
      show()
      removeUserListeners()
    }

    const run = () => {
      if (cancelled) return
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      if (target > maxScroll + 1) hide()
      el.scrollTop = target
      if (Math.abs(el.scrollTop - target) <= 1 || attempt >= 6) {
        finish()
        return
      }
      const delays = [16, 50, 120, 250, 500, 900, 1500]
      timer = setTimeout(run, delays[attempt])
      attempt += 1
    }

    window.addEventListener('wheel', cancel)
    window.addEventListener('touchmove', cancel)
    window.addEventListener('keydown', cancel)

    run()

    return () => {
      cancelled = true
      restoring.current = false
      if (timer) clearTimeout(timer)
      show()
      removeUserListeners()
    }
  }, [key, ready, ref])
}
