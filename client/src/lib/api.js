const BASE = import.meta.env.VITE_API_URL || '';
const KEY = 'ts_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

/** fetch wrapper: JSON or FormData body, bearer token, readable errors. */
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401 && token) tokenStore.set(null);
    throw err;
  }
  return data;
}

/** Fetch a private file (admin) as an object URL so it can be shown in an <img> or opened. */
export async function fetchFileUrl(path) {
  const res = await fetch(`${BASE}/api${path}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) throw new Error('Could not load file.');
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), type: blob.type };
}

export const fileUrl = (p) => (p ? `${BASE}${p}` : '');

export const qs = (obj) => {
  const s = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== '' && v != null)).toString();
  return s ? `?${s}` : '';
};
