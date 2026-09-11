import { useState } from 'react'
import { useVault } from '../context/VaultContext'
import { estimateStrength } from '../lib/crypto'

export default function Unlock() {
  const { hasVault, hasBiometric, createVault, unlock, unlockBiometric } = useVault()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSetup = hasVault === false
  const strength = estimateStrength(password)
  const strengthLabels = ['Very weak', 'Weak', 'Okay', 'Strong', 'Very strong']

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSetup) {
        if (password.length < 8) throw new Error('Use at least 8 characters for your master password.')
        if (password !== confirm) throw new Error("Passwords don't match.")
        await createVault(password)
      } else {
        const ok = await unlock(password)
        if (!ok) throw new Error('Incorrect master password.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleBiometric() {
    setError('')
    setBusy(true)
    try {
      await unlockBiometric()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (hasVault === null) {
    return <div className="center-screen"><p className="sub">Loading…</p></div>
  }

  return (
    <div className="center-screen">
      <div className="brand-mark">{isSetup ? '🛡️' : '🔒'}</div>
      <h1>{isSetup ? 'Set your master password' : 'Enter your master password'}</h1>
      <p className="sub">
        {isSetup
          ? "This encrypts everything in your vault. It's never sent anywhere or stored — if you forget it, your data can't be recovered, so save it somewhere safe."
          : 'Your vault is locked. Unlock it to view your passwords and expenses.'}
      </p>

      {!isSetup && hasBiometric && (
        <button className="btn btn-ghost" type="button" onClick={handleBiometric} disabled={busy} style={{ marginBottom: 18 }}>
          👆 Unlock with fingerprint / Face ID
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Master password</label>
          <input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
          {isSetup && password.length > 0 && (
            <>
              <div className="strength-bar">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={i <= strength - 1 ? `filled-${strength}` : ''} />
                ))}
              </div>
              <p className="sub" style={{ marginBottom: 0, marginTop: 6, fontSize: 12 }}>{strengthLabels[strength]}</p>
            </>
          )}
        </div>
        {isSetup && (
          <div className="field">
            <label>Confirm master password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••••••" />
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isSetup ? 'Create vault' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
