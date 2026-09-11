import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    const action = mode === 'signin' ? signIn(email, password) : signUp(email, password)
    const { error } = await action
    setBusy(false)
    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }
  }

  return (
    <div className="center-screen">
      <div className="brand-mark">🔐</div>
      <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="sub">
        {mode === 'signin'
          ? 'Sign in to access your vault and expenses.'
          : 'This is your account login — you\'ll set a separate master password for your vault next.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="error-text">{error}</p>}
        {info && <p className="sub" style={{ color: 'var(--accent)' }}>{info}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <p className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </p>
    </div>
  )
}
