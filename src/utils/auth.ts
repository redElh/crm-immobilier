// src/utils/auth.ts
export const setAuthToken = (token: string, remember: boolean = false) => {
  if (remember) {
    localStorage.setItem('agentToken', token);
  } else {
    sessionStorage.setItem('agentToken', token);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken');
};

export const clearAuthToken = () => {
  localStorage.removeItem('agentToken');
  sessionStorage.removeItem('agentToken');
  localStorage.removeItem('sessionId');
  sessionStorage.removeItem('sessionId');
};

export const setSessionId = (sessionId: number, remember: boolean = false) => {
  if (remember) localStorage.setItem('sessionId', String(sessionId));
  else sessionStorage.setItem('sessionId', String(sessionId));
};

export const getSessionId = (): number | null => {
  const val = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
  return val ? Number(val) : null;
};