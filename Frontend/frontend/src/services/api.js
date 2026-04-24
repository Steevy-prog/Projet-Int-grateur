const BASE_URL = 'http://localhost:8000';

let _accessToken = null;
let _refreshPromise = null;

export const setToken   = (t) => { _accessToken = t; };
export const getToken   = ()  => _accessToken;
export const clearToken = ()  => { _accessToken = null; };

async function _doRefresh() {
  const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Session expired');
  const data = await res.json();
  setToken(data.access_token);
  return data.access_token;
}

function _refreshOnce() {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

export async function request(method, path, body = null, retry = true) {
  const headers = {};
  if (body !== null) headers['Content-Type'] = 'application/json';
  if (_accessToken)  headers['Authorization'] = `Bearer ${_accessToken}`;

  const opts = { method, headers, credentials: 'include' };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  if (res.status === 401 && retry) {
    try {
      await _refreshOnce();
      return request(method, path, body, false);
    } catch {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
  }

  if (!res.ok) {
    let detail = `Erreur HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || Object.values(err).flat().join(' ') || detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const get   = (path)       => request('GET',   path);
export const post  = (path, body) => request('POST',  path, body);
export const patch = (path, body) => request('PATCH', path, body);
