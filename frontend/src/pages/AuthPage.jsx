import React, { useState } from "react";
import { api } from "../api.js";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("test@uci.edu");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password);

      if (!data?.access_token) throw new Error("No access_token returned");
      await onAuthSuccess(data.access_token);
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <p className="muted">
        Use your email + password. Token will be stored in localStorage.
      </p>

      <form onSubmit={submit} className="form">
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@uci.edu"
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=">= 8 chars"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {err && <div className="error">{err}</div>}

        <button className="btn" disabled={busy}>
          {busy ? "Working…" : mode === "login" ? "Login" : "Create account"}
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          disabled={busy}
        >
          Switch to {mode === "login" ? "Register" : "Login"}
        </button>
      </form>
    </div>
  );
}
