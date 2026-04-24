import { request, setToken, clearToken } from './api';

export async function login(email, password) {
  // retry=false: login endpoint has no auth header to refresh
  const data = await request('POST', '/api/auth/login/', { email, password }, false);
  setToken(data.access_token);
  return data; // { access_token, user: { id, username, email, role, language } }
}

export async function logout() {
  try {
    await request('POST', '/api/auth/logout/');
  } finally {
    clearToken();
  }
}

// Called on app mount to restore session from httpOnly refresh cookie
export async function tryRefresh() {
  try {
    const res = await fetch('http://localhost:8000/api/auth/token/refresh/', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}
