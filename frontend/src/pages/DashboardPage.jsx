import React, { useMemo, useState } from "react";
import { api } from "../api.js";

export default function DashboardPage({ me, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [err, setErr] = useState("");

  // State to track if the background indexing process is likely still running
  const [isIndexing, setIsIndexing] = useState(false);

  const [timeAvailable, setTimeAvailable] = useState(45);
  const [energy, setEnergy] = useState("low");
  const [platform, setPlatform] = useState("windows");
  const [socialMode, setSocialMode] = useState("any");

  const [recoBusy, setRecoBusy] = useState(false);
  const [recoErr, setRecoErr] = useState("");
  const [recoRes, setRecoRes] = useState(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const contextPayload = useMemo(
    () => ({
      time_available_min: Number(timeAvailable),
      energy_level: energy,
      platform,
      social_mode: socialMode,
      prefer_installed: true,
      shuffle_seed: shuffleSeed,
    }),
    [timeAvailable, energy, platform, socialMode, shuffleSeed]
  );

  /**
   * Syncs Steam library and triggers the background indexing notice.
   */
  async function sync() {
    setErr("");
    setSyncResult(null);
    setBusy(true);
    try {
      const data = await api.syncSteam();
      setSyncResult(data);
      // Since the backend now handles metadata/indexing in a background thread,
      // we show a notice to the user that new games might take a moment to appear.
      setIsIndexing(true);
      await onRefresh();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runRecommendation() {
    setRecoErr("");
    setRecoRes(null);
    setRecoBusy(true);
    try {
      const data = await api.recommend(contextPayload);
      setRecoRes(data);
    } catch (e) {
      setRecoErr(e.message || String(e));
    } finally {
      setRecoBusy(false);
    }
  }

  async function sendFeedback(item, action) {
    try {
      await api.sendFeedback(item.appid, action, item.genres, contextPayload);
    } catch (_) {
      // ignore feedback errors in MVP UI
    }
  }

  async function shuffleRecommendation() {
    setShuffleSeed((v) => v + 1);
    setTimeout(runRecommendation, 0);
  }

  return (
    <div className="card">
      <h2>Dashboard</h2>

      <div className="grid2">
        <div className="panel">
          <h3>Context Check-in</h3>
          <div className="form">
            <label>
              Time Available: <b>{timeAvailable} min</b>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
              />
            </label>

            <label>
              Energy Level
              <select value={energy} onChange={(e) => setEnergy(e.target.value)}>
                <option value="low">Low energy (relax)</option>
                <option value="high">High energy (focus)</option>
              </select>
            </label>

            <label>
              Device Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="windows">Windows</option>
                <option value="mac">Mac</option>
                <option value="linux">Linux</option>
              </select>
            </label>

            <label>
              Social Intent
              <select
                value={socialMode}
                onChange={(e) => setSocialMode(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="solo">Solo</option>
                <option value="social">Play with friends</option>
              </select>
            </label>

            {/* Notice Banner: Displayed after a sync to explain background processing */}
            {isIndexing && (
              <div style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '0.85rem',
                border: '1px solid #ffeeba',
                lineHeight: '1.4'
              }}>
                <button
                  onClick={() => setIsIndexing(false)}
                  style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', marginTop: '-4px' }}
                >
                  &times;
                </button>
                <strong>System Notice:</strong><br/>
                Background metadata sync and TF-IDF indexing are currently in progress.
                It takes about 1.5s per game to process. If your newest games don't show up yet,
                please wait 2-3 minutes and try again.
              </div>
            )}

            <button className="btn fullWidth" onClick={runRecommendation} disabled={recoBusy}>
              {recoBusy ? "Ranking…" : "Generate Recommendation"}
            </button>

            {recoErr && <div className="error">{recoErr}</div>}
          </div>

          {recoRes?.top_pick && (
            <div className="resultCard mt8">
              <h4>Top Pick</h4>
              <div className="resultTop">
                {recoRes.top_pick.header_image ? (
                  <img className="thumb" src={recoRes.top_pick.header_image} alt="" />
                ) : (
                  <div className="thumb placeholder" />
                )}
                <div>
                  <div className="title">{recoRes.top_pick.name}</div>
                  <div className="muted small">score={recoRes.top_pick.score}</div>
                  <div className="whyBox">
                    Why This? {recoRes.top_pick.why?.join(" · ") || "Matches your current context"}
                  </div>
                    <div className="actionsRow">
                    <button className="btn" onClick={() => sendFeedback(recoRes.top_pick, "accept")}>Accept</button>
                    <button className="btn btn-ghost" onClick={() => sendFeedback(recoRes.top_pick, "reject")}>Reject</button>
                    <button className="btn btn-ghost" onClick={shuffleRecommendation}>Shuffle</button>
                  </div>
                </div>
              </div>
                </div>
              )}

              {/* Display a "No Results" notice if recommendation returns empty */}
              {recoRes && !recoRes.top_pick && !recoBusy && (
                <div className="resultCard mt8 muted" style={{ textAlign: 'center', padding: '20px' }}>
                   No matches found for this context.<br/>
                   Try adjusting your filters or wait for indexing to finish.
                </div>
              )}

              {!!recoRes?.alternatives?.length && (
                <div className="results mt8">
                    <h4>Alternatives</h4>
                    {recoRes.alternatives.map((r) => (
                        <div key={r.appid} className="resultCard">
                            <div className="resultTop">
                                {r.header_image ? (
                                    <img className="thumb" src={r.header_image} alt="" />
                                ) : (
                                    <div className="thumb placeholder" />
                                )}
                                <div>
                                    <div className="title">{r.name}</div>
                                    <div className="muted small">{r.why?.join(" · ")}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}
        </div>

        <div className="panel">
          <h3>Steam Library</h3>
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
            {syncResult && <pre className="pre mt8">{JSON.stringify(syncResult, null, 2)}</pre>}
        </div>
      </div>
    </div>
  );
}