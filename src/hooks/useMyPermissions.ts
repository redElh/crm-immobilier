import { useEffect, useState } from 'react'
import { getMyEffectivePermissions } from '../services/permissionsService'

export interface MyPermissions {
  [key: string]: boolean
}

export function useMyPermissions(): MyPermissions | null {
  const [permissions, setPermissions] = useState<MyPermissions | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyEffectivePermissions()
      .then((perms) => { if (!cancelled) setPermissions(perms) })
      .catch(() => { if (!cancelled) setPermissions({}) })
    return () => { cancelled = true }
  }, [])

  return permissions
}

// Convenience: treat missing permissions (still loading) as allowed so the UI
// does not flash hidden until the permissions arrive.
export function permissionAllowed(perms: MyPermissions | null, key: string): boolean {
  return perms == null || perms[key] !== false
}
