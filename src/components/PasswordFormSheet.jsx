import { useState } from 'react'
import Sheet from './Sheet'
import { generatePassword, estimateStrength } from '../lib/crypto'

export default function PasswordFormSheet({ categories, defaultCategoryId, initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId || defaultCategoryId || (categories[0]?.id ?? ''))
  const [username, setUsername] = useState(initial?.username || '')
  const [password, setPassword] = useState(initial?.password || '')
  const [url, setUrl] = useState(initial?.url || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [showPassword, setShowPassword] = useState(false)

  const strength = estimateStrength(password)

  function handleGenerate() {
    setPassword(generatePassword({ length: 16 }))
    setShowPassword(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !password) return
    onSave({ title: title.trim(), categoryId, username, password, url, notes })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{initial ? 'Edit login' : 'New login'}</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div className="field">
          <label>Title</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Google account" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Username or email</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <div className="reveal-field">
            <input
              style={{ background: 'none', border: 'none', padding: 0 }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter or generate"
            />
            <button type="button" className="icon-btn" onClick={() => setShowPassword((s) => !s)}>{showPassword ? '🙈' : '👁️'}</button>
            <button type="button" className="icon-btn" onClick={handleGenerate}>🎲</button>
          </div>
          {password && (
            <div className="strength-bar">
              {[0, 1, 2, 3].map((i) => <span key={i} className={i <= strength - 1 ? `filled-${strength}` : ''} />)}
            </div>
          )}
        </div>
        <div className="field">
          <label>Website (optional)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recovery codes, security questions…" />
        </div>
        <button className="btn btn-primary" type="submit">Save login</button>
      </form>
    </Sheet>
  )
}
