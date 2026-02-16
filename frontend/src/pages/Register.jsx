import React, { useState } from "react";
import { api, setToken } from "../api/client.js";

export default function Register({ onDone }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api.register(email, pw);
      setToken(data.access_token);
      onDone();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Create account</h2>
      <form onSubmit={submit} className="form">
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label>Password (>= 8 chars)</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err ? <div className="err">{err}</div> : null}
        <button className="btn" type="submit">Register</button>
      </form>
    </div>
  );
}
