import React, { useState } from "react";
import { api } from "../api.js";

export default function DashboardPage({ me, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("co-op horror");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [searchRes, setSearchRes] = useState(null);

  async function sync() {
    setErr("");
    setSyncResult(null);
    setBusy(true);
    try {
      const data = await api.syncSteam();
      setSyncResult(data);
      await onRefresh();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doSearch() {
    setSearchErr("");
    setSearchRes(null);
    setSearchBusy(true);
    try {
      const data = await api.search(q, 10);
      setSearchRes(data);
    } catch (e) {
      setSearchErr(e.message || String(e));
    } finally {
      setSearchBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Dashboard</h2>

      <div className="grid2">
        <div className="panel">
          <h3>User</h3>
          <div className="kv">
            <div className="k">Email</div>
            <div className="v">{me?.user?.email}</div>

            <div className="k">User ID</div>
            <div className="v">{me?.user?.id}</div>
          </div>

          <h3 className="mt16">Search</h3>
          <div className="form">
            <label>
              Query
              <input value={q} onChange={(e) => setQ(e.target.value)} />
            </label>

            <button className="btn" onClick={doSearch} disabled={searchBusy}>
              {searchBusy ? "Searching…" : "Search (TF-IDF + cosine)"}
            </button>

            {searchErr && <div className="error">{searchErr}</div>}

            {searchRes && (
              <div className="results">
                {searchRes.results.map((r) => (
                  <div key={r.appid} className="resultCard">
                    <div className="resultTop">
                      {r.header_image ? (
                        <img className="thumb" src={r.header_image} alt="" />
                      ) : (
                        <div className="thumb placeholder" />
                      )}
                      <div>
                        <div className="title">{r.name}</div>
                        <div className="muted small">
                          score={r.score.toFixed(4)} · appid={r.appid}
                        </div>
                        <div className="muted small">
                          why: {r.why?.map((w) => w.term).join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <h3>Steam</h3>
          <div className="steamRow">
            {me?.steam?.avatar ? (
              <img className="avatar" src={me.steam.avatar} alt="avatar" />
            ) : (
              <div className="avatar placeholder" />
            )}
            <div>
              <div>
                <b>{me?.steam?.persona || "Unknown"}</b>
              </div>
              <div className="muted">{me?.steam?.steamid}</div>
            </div>
          </div>

          <button className="btn" onClick={sync} disabled={busy}>
            {busy ? "Syncing…" : "Sync Library"}
          </button>

          {err && <div className="error mt8">{err}</div>}

          {syncResult && (
            <pre className="pre mt8">{JSON.stringify(syncResult, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
