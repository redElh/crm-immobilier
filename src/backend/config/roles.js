export const ADMIN_PANEL_ROLES = ['admin', 'gerant'];

export const USER_ROLES = ['admin', 'gerant', 'agent'];

export function isAdminPanelRole(role) {
  return ADMIN_PANEL_ROLES.includes(role);
}

export function isValidUserRole(role) {
  return USER_ROLES.includes(role);
}

export function getLoginLink(role) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  return isAdminPanelRole(role)
    ? `${frontendUrl}/auth/admin/login`
    : `${frontendUrl}/auth/login`;
}

export function getResetLink(role, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  return isAdminPanelRole(role)
    ? `${frontendUrl}/auth/admin/reset-password?token=${token}`
    : `${frontendUrl}/auth/reset-password?token=${token}`;
}
