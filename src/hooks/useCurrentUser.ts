import { useEffect, useState } from 'react'
import { api } from '../services/api'

export interface CurrentUser {
  id: string | number
  first_name?: string
  last_name?: string
  email?: string
  role?: string
}

let cached: CurrentUser | null | undefined

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(() => cached ?? null)

  useEffect(() => {
    if (cached !== undefined) return
    let cancelled = false
    api
      .get<CurrentUser>('/auth/me')
      .then(u => {
        if (cancelled) return
        cached = u
        setUser(u)
      })
      .catch(() => {
        if (cancelled) return
        cached = null
        setUser(null)
      })
    return () => { cancelled = true }
  }, [])

  return user
}

export const isManagerRole = (role?: string) => role === 'admin' || role === 'gerant'
