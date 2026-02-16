const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("wtp_token");
}

export function setToken(token) {
  localStorage.setItem("wtp_token", token);
}

export function clearToken() {
  localStorage.removeItem("wtp_token");
}

async function request(path, { method = "GET", body = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Missing token. Please login.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  health: () => request("/api/health"),

  register: (email, password) =>
    request("/api/auth/register", { method: "POST", body: { email, password } }),

  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),

  me: () => request("/api/auth/me", { auth: true }),

  bindSteam: (steamid) =>
    request("/api/account/bind_steam", {
      method: "POST",
      auth: true,
      body: { steamid },
    }),

  syncSteam: () =>
    request("/api/steam/sync", {
      method: "POST",
      auth: true,
    }),

  // search (TF-IDF + cosine)
  search: (query, topk = 10) =>
    request("/api/search", {
      method: "POST",
      auth: true,
      body: { query, topk },
    }),
};
