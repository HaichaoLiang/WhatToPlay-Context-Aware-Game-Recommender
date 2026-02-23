function IntroPage({ onStartLogin, onStartRegister }) {
  return (
    <div className="intro-page">
      <div className="intro-hero">
        <p className="eyebrow">Welcome to GameFlow Studio</p>
        <h1>Pick the right game for your current mood and time.</h1>
        <p className="subtitle">
          A context-aware game recommender that combines your available time, energy, device, and social context to rank what you should play next.
        </p>

        <div className="intro-actions">
          <button type="button" className="cta cta-small" onClick={onStartLogin}>
            Login
          </button>
          <button type="button" className="chip intro-secondary-btn" onClick={onStartRegister}>
            Create Account
          </button>
          <a className="chip intro-link-btn" href="#intro-features">
            Learn More
          </a>
        </div>
      </div>

      <div id="intro-features" className="intro-grid">
        <article className="intro-card">
          <p className="auth-title">Context Check-In</p>
          <p className="auth-note">Use time, energy, goal, device, and social signals to generate better recommendations than generic top lists.</p>
        </article>
        <article className="intro-card">
          <p className="auth-title">Steam Integration</p>
          <p className="auth-note">Bind Steam, sync your library, and view friends presence to support social-first recommendations.</p>
        </article>
        <article className="intro-card">
          <p className="auth-title">Actionable Results</p>
          <p className="auth-note">Shuffle, accept, reject, and build a Play Next Queue for quick decision-making during real play sessions.</p>
        </article>
      </div>
    </div>
  )
}

export default IntroPage
