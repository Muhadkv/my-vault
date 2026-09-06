import { useState } from 'react'
import Sheet from './Sheet'

const COLOR_OPTIONS = ['#3FA796', '#E8735C', '#E8A65C', '#5C9DE8', '#B05CE8', '#E85C9D']
const ICON_OPTIONS = ['📁', '🔑', '💼', '🏦', '📧', '🎮', '🛒', '📱', '🏠', '✈️']

export default function CategorySheet({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [icon, setIcon] = useState(ICON_OPTIONS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, icon })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>New category</h2>
      <p className="sub" style={{ marginBottom: 18 }}>e.g. Google, Banking, Work — group your saved logins however makes sense to you.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Google" />
        </div>
        <div className="field">
          <label>Icon</label>
          <div className="chip-row">
            {ICON_OPTIONS.map((opt) => (
              <button type="button" key={opt} className={`chip ${icon === opt ? 'active' : ''}`} onClick={() => setIcon(opt)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Color</label>
          <div className="chip-row">
            {COLOR_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setColor(opt)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: opt,
                  border: color === opt ? '3px solid var(--text)' : '3px solid transparent',
                }}
              />
            ))}
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Create category</button>
      </form>
    </Sheet>
  )
}
