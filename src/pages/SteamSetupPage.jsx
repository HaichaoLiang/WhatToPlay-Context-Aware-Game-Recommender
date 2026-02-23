import SteamLinkPanel from '../components/SteamLinkPanel'

function SteamSetupPage({ me, onLogout, ...steamProps }) {
  return (
    <>
      <h1>Connect your Steam account</h1>
      <p className="subtitle">Bind your SteamID64 and sync your library so recommendations are based on what you actually own and play.</p>
      <div className="auth-box">
        <div className="auth-state">
          <p className="auth-title">Signed in as {me?.user?.email}</p>
          <div className="auth-actions">
            <button type="button" className="chip" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>
      <SteamLinkPanel {...steamProps} isAuthed />
    </>
  )
}

export default SteamSetupPage
