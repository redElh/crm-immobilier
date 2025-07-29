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
};