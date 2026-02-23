import RecommendationContextForm from '../components/RecommendationContextForm'

function RecommendationsDashboardPage({
  me,
  onLogout,
  onSyncSteam,
  steamBusy,
  steamMessage,
  librarySyncNotice,
  steamIdInput,
  setSteamIdInput,
  onBindSteam,
  ...contextProps
}) {
  return (
    <>
      <div className="dashboard-toolbar auth-box">
        <div className="auth-state">
          <div className="linked-steam-header">
            <div className="friend-avatar-wrap">
              {me?.steam?.avatar ? (
                <img
                  src={me.steam.avatar}
                  alt={me?.steam?.persona || me?.user?.email || 'User avatar'}
                  className="friend-avatar"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="friend-avatar placeholder-avatar" />
              )}
            </div>
            <p className="auth-title">
              Steam linked: {me?.steam?.persona || me?.steam?.steamid}
            </p>
          </div>
          <div className="steam-bind-row">
            <input
              type="text"
              placeholder="Enter new SteamID64"
              value={steamIdInput}
              onChange={(e) => setSteamIdInput(e.target.value)}
            />
            <button type="button" className="chip" onClick={onBindSteam} disabled={steamBusy}>
              {steamBusy ? 'Updating...' : 'Change Linked Steam'}
            </button>
          </div>
          <p className="auth-note inline-help">
            Need your SteamID64?{' '}
            <a
              className="help-link"
              href="https://flightsimulator.zendesk.com/hc/en-us/articles/360015953320-How-to-find-your-Steam-ID64-before-contacting-support"
              target="_blank"
              rel="noreferrer"
            >
              SteamID64 guidance
            </a>
          </p>
          <div className="auth-actions">
            <button type="button" className="chip" onClick={onSyncSteam} disabled={steamBusy}>
              {steamBusy ? 'Syncing...' : 'Sync Steam Library'}
            </button>
            <button type="button" className="chip" onClick={onLogout}>Logout</button>
          </div>
          {!!steamMessage && <p className="auth-note">{steamMessage}</p>}
          {!!librarySyncNotice && <p className="sync-note">{librarySyncNotice}</p>}
        </div>
      </div>

      <RecommendationContextForm {...contextProps} />
    </>
  )
}

export default RecommendationsDashboardPage
