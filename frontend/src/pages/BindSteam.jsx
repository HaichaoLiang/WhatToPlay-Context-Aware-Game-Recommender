import React, { useState } from "react";
import { api } from "../api/client.js";

export default function BindSteam({ onBound }) {
  const [steamid, setSteamid] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      const data = await api.bindSteam(steamid);
      setOk(`Bound: ${data.steam.persona || data.steam.steamid}`);
      onBound();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="card">
      <h2>Bind SteamID</h2>
      <p className="muted">Enter your numeric SteamID64 (public profile recommended).</p>
      <form onSubmit={submit} className="form">
        <label>SteamID64</label>
        <input value={steamid} onChange={(e) => setSteamid(e.target.value)} placeholder="7656119..." />
        {err ? <div className="err">{err}</div> : null}
        {ok ? <div className="ok">{ok}</div> : null}
        <button className="btn" type="submit">Bind</button>
      </form>
    </div>
  );
}
