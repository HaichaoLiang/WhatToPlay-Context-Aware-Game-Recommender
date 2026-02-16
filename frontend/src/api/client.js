const API_BASE = "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("wtp_token");
}

export function setToken(token) {
  localStorage.setItem("wtp_token", token);
}

export function clearToken() {
  localStorage.removeItem("wtp_token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error ? `${data.error}` : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  register: (email, password) => request("/api/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),
  bindSteam: (steamid) => request("/api/account/bind_steam", { method: "POST", body: { steamid } })
};
