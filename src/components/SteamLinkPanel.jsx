function SteamLinkPanel({
  isAuthed,
  steamBound,
  steamIdInput,
  setSteamIdInput,
  steamBusy,
  steamMessage,
  onBindSteam,
  onSyncSteam,
  me,
}) {
  if (!isAuthed) return null

  return (
    <div className="auth-box">
      <div className="auth-state">
        <p className="auth-title">Steam Integration</p>

        <div className="steam-bind-row">
          <input
            type="text"
            placeholder={steamBound ? 'Enter new SteamID64' : 'Enter SteamID64'}
            value={steamIdInput}
            onChange={(e) => setSteamIdInput(e.target.value)}
          />
          <button type="button" className="chip" onClick={onBindSteam} disabled={steamBusy}>
            {steamBusy ? 'Binding...' : steamBound ? 'Change Linked Steam' : 'Bind Steam'}
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
            Find it here
          </a>
        </p>

        {steamBound && (
          <div className="steam-actions">
            <p>Steam linked: {me.steam.persona || me.steam.steamid}</p>
            <button type="button" className="chip" onClick={onSyncSteam} disabled={steamBusy}>
              {steamBusy ? 'Syncing...' : 'Sync Steam Library'}
            </button>
          </div>
        )}

        {steamMessage && <p className="auth-note">{steamMessage}</p>}
      </div>
    </div>
  )
}

export default SteamLinkPanel
