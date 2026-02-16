import React, { useState } from "react";
import { api } from "../api.js";

export default function BindSteamPage({ onBound }) {
  const [steamid, setSteamid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");
    setBusy(true);
    try {
      const data = await api.bindSteam(steamid.trim());
      setOkMsg(
        `Bound! persona=${data?.steam?.persona || "unknown"} steamid=${
          data?.steam?.steamid
        }`
      );
      await onBound();
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Bind Steam</h2>
      <p className="muted">
        Enter your <b>SteamID64</b> (starts with 7656119…). If your profile is
        private, Steam may return empty results later.
      </p>

      <form onSubmit={submit} className="form">
        <label>
          SteamID64
          <input
            value={steamid}
            onChange={(e) => setSteamid(e.target.value)}
            placeholder="7656119xxxxxxxxxx"
          />
        </label>

        {err && <div className="error">{err}</div>}
        {okMsg && <div className="success">{okMsg}</div>}

        <button className="btn" disabled={busy}>
          {busy ? "Binding…" : "Bind SteamID"}
        </button>
      </form>
    </div>
  );
}
