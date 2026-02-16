import React, { useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api.js";
import AuthPage from "./pages/AuthPage.jsx";
import BindSteamPage from "./pages/BindSteamPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function TopBar({ me, onLogout }) {
  return (
    <div className="topbar">
      <div className="brand">WhatToPlay</div>
      <div className="topbar-right">
        {me?.user?.email ? (
          <>
            <span className="muted">{me.user.email}</span>
            <button className="btn btn-ghost" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <span className="muted">Not logged in</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const token = getToken();

  async function refreshMe() {
    if (!getToken()) {
      setMe(null);
      return;
    }
    const data = await api.me();
    setMe(data);
  }

  useEffect(() => {
    (async () => {
      try {
        const h = await api.health();
        setHealth(h);
      } catch (e) {
        setHealth({ ok: false, error: String(e.message || e) });
      }

      try {
        if (token) await refreshMe();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAuthSuccess = async (accessToken) => {
    setToken(accessToken);
    await refreshMe();
  };

  const onLogout = () => {
    clearToken();
    setMe(null);
  };

  const isAuthed = !!getToken();
  const hasSteam = !!me?.steam?.steamid;

  let page = null;
  if (loading) page = <div className="card">Loading…</div>;
  else if (!isAuthed) page = <AuthPage onAuthSuccess={onAuthSuccess} />;
  else if (isAuthed && !hasSteam)
    page = <BindSteamPage onBound={refreshMe} />;
  else page = <DashboardPage me={me} onRefresh={refreshMe} />;

  return (
    <div className="container">
      <TopBar me={me} onLogout={onLogout} />

      <div className="content">
        <div className="status">
          <span className="chip">
            API:{" "}
            {health?.ok ? (
              <b>OK</b>
            ) : (
              <b className="danger">DOWN</b>
            )}
          </span>
          {health?.ok === false && (
            <span className="muted">{health?.error}</span>
          )}
        </div>

        {page}
      </div>
    </div>
  );
}
