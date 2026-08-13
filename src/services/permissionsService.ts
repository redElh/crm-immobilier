import { api } from './api'

export type PermissionChoice = 'défaut' | 'oui' | 'non'

export interface UserPermissions {
  [key: string]: PermissionChoice
}

export interface EffectivePermissions {
  [key: string]: boolean
}

export async function getUserDroits(userId: string | number): Promise<UserPermissions> {
  const data = await api.get<{ permissions: UserPermissions }>(`/admin/users/${userId}/droits`)
  return data.permissions || {}
}

export async function saveUserDroits(userId: string | number, permissions: UserPermissions, reset = false): Promise<UserPermissions> {
  const data = await api.put<{ permissions: UserPermissions }>(
    `/admin/users/${userId}/droits`,
    reset ? { permissions: {}, reset: true } : { permissions }
  )
  return data.permissions || {}
}

export async function getMyEffectivePermissions(): Promise<EffectivePermissions> {
  const data = await api.get<{ permissions: EffectivePermissions }>('/auth/me/droits')
  return data.permissions || {}
}
