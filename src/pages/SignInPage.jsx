import AccountAuthPanel from '../components/AccountAuthPanel'

function SignInPage({ onBackToIntro, ...props }) {
  return (
    <>
      <h1>Sign in to GameFlow</h1>
      <p className="subtitle">Create an account or log in first. After that, connect Steam to unlock personal library recommendations.</p>
      {onBackToIntro && (
        <div className="auth-actions">
          <button type="button" className="chip" onClick={onBackToIntro}>
            Back to Intro
          </button>
        </div>
      )}
      <AccountAuthPanel {...props} />
    </>
  )
}

export default SignInPage
