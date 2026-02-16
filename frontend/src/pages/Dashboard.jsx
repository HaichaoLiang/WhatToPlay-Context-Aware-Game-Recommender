import React, { useEffect, useState } from "react";
import { api, clearToken } from "../api/client.js";

export default function Dashboard({ onLogout }) {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.me();
        setMe(data);
      } catch (ex) {
        setErr(ex.message);
      }
    })();
  }, []);

  return (
    <div className="card">
      <h2>WhatToPlay</h2>
      {err ? <div className="err">{err}</div> : null}
      {me ? (
        <>
          <div className="row">
            <div><b>User:</b> {me.user.email}</div>
          </div>
          <div className="row">
            <div><b>Steam:</b> {me.steam ? `${me.steam.persona || ""} (${me.steam.steamid})` : "Not bound"}</div>
          </div>
          <button
            className="btn secondary"
            onClick={() => {
              clearToken();
              onLogout();
            }}
          >
            Logout
          </button>
          <p className="muted">
            Next: we will add Steam sync, inverted index, TF-IDF+cos search, and context-aware recommendations here.
          </p>
        </>
      ) : (
        <div className="muted">Loading…</div>
      )}
    </div>
  );
}
