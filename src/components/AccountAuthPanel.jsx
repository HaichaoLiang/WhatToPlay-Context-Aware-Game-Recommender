function AccountAuthPanel({
  isAuthed,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authBusy,
  authError,
  onSubmit,
  me,
  onLogout,
}) {
  return (
    <div className="auth-box">
      {!isAuthed && (
        <form className="auth-form" onSubmit={onSubmit}>
          <p className="auth-title">Account Login</p>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <div className="auth-actions">
            <button type="submit" className="cta cta-small" disabled={authBusy}>
              {authBusy ? 'Working...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
              disabled={authBusy}
            >
              {authMode === 'login' ? 'Switch to Register' : 'Switch to Login'}
            </button>
          </div>
          {authError && <p className="error-note">{authError}</p>}
        </form>
      )}

      {isAuthed && (
        <div className="auth-state">
          <p className="auth-title">Signed in as {me.user.email}</p>
          <div className="auth-actions">
            <button type="button" className="chip" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountAuthPanel
