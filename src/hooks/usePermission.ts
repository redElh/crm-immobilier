import { useMyPermissions, permissionAllowed } from './useMyPermissions'
import { useCurrentUser, isManagerRole } from './useCurrentUser'

// A permission is granted when the current user is an admin/gérant (never
// restricted) or when their effective permissions allow it.
export function usePermission(key: string): boolean {
  const perms = useMyPermissions()
  const user = useCurrentUser()
  return isManagerRole(user?.role) || permissionAllowed(perms, key)
}

// Some rights mean the OPPOSITE: granting them ("oui") RESTRICTS the agent
// (e.g. Informations privées, Documents privés). Managers are never
// restricted, and while permissions are still loading nothing is restricted.
export function useRestriction(key: string): boolean {
  const perms = useMyPermissions()
  const user = useCurrentUser()
  if (isManagerRole(user?.role)) return false
  return perms != null && perms[key] === true
}
