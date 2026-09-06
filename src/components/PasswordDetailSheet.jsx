import { useState } from 'react'
import Sheet from './Sheet'

async function checkBreach(password) {
  // k-anonymity model: only the first 5 chars of the SHA-1 hash are sent,
  // so HaveIBeenPwned never sees the actual password.
  const enc = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-1', enc)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  const prefix = hashHex.slice(0, 5)
  const suffix = hashHex.slice(5)

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
  const text = await res.text()
  const match = text.split('\n').find((line) => line.startsWith(suffix))
  return match ? parseInt(match.split(':')[1], 10) : 0
}

export default function PasswordDetailSheet({ item, onClose, onEdit, onDelete }) {
  const [revealed, setRevealed] = useState(false)
  const [toast, setToast] = useState('')
  const [breachCount, setBreachCount] = useState(null)
  const [checking, setChecking] = useState(false)

  function copy(value, label) {
    navigator.clipboard.writeText(value)
    setToast(`${label} copied — clears in 15s`)
    setTimeout(() => {
      navigator.clipboard.readText().then((current) => {
        if (current === value) navigator.clipboard.writeText('')
      }).catch(() => {})
    }, 15000)
    setTimeout(() => setToast(''), 1800)
  }

  async function handleBreachCheck() {
    setChecking(true)
    try {
      const count = await checkBreach(item.password)
      setBreachCount(count)
    } catch {
      setToast('Could not reach breach check service')
      setTimeout(() => setToast(''), 1800)
    } finally {
      setChecking(false)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{item.title}</h2>
      <div className="field" style={{ marginTop: 16 }}>
        <label>Username / email</label>
        <div className="reveal-field">
          <span className="value">{item.username || '—'}</span>
          {item.username && <button className="icon-btn" onClick={() => copy(item.username, 'Username')}>📋</button>}
        </div>
      </div>
      <div className="field">
        <label>Password</label>
        <div className="reveal-field">
          <span className="value">{revealed ? item.password : '••••••••••••'}</span>
          <button className="icon-btn" onClick={() => setRevealed((r) => !r)}>{revealed ? '🙈' : '👁️'}</button>
          <button className="icon-btn" onClick={() => copy(item.password, 'Password')}>📋</button>
        </div>
      </div>
      {item.url && (
        <div className="field">
          <label>Website</label>
          <div className="reveal-field"><span className="value">{item.url}</span></div>
        </div>
      )}
      {item.notes && (
        <div className="field">
          <label>Notes</label>
          <div className="reveal-field"><span className="value" style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</span></div>
        </div>
      )}

      <div className="field">
        {breachCount === null ? (
          <button className="btn btn-ghost" type="button" onClick={handleBreachCheck} disabled={checking}>
            {checking ? 'Checking…' : '🛡️ Check if this password was breached'}
          </button>
        ) : breachCount > 0 ? (
          <p className="error-text" style={{ marginTop: 0 }}>⚠️ Seen in {breachCount.toLocaleString()} known data breaches. Consider changing it.</p>
        ) : (
          <p className="sub" style={{ color: 'var(--accent)', marginBottom: 0 }}>✓ Not found in known breaches.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger" onClick={onDelete}>Delete</button>
      </div>
      {toast && <div className="toast" style={{ position: 'static', marginTop: 14, textAlign: 'center' }}>{toast}</div>}
    </Sheet>
  )
}
