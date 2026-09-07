import { useState } from 'react'
import Sheet from './Sheet'
import { VAULT_ICONS } from '../lib/vaultIcons'

const COLOR_OPTIONS = ['#3FA796', '#E8735C', '#E8A65C', '#5C9DE8', '#B05CE8', '#E85C9D']

export default function CategorySheet({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || COLOR_OPTIONS[0])
  const [icon, setIcon] = useState(initial?.icon && VAULT_ICONS.some((i) => i.key === initial.icon) ? initial.icon : VAULT_ICONS[0].key)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, icon })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{initial ? 'Edit category' : 'New category'}</h2>
      <p className="sub" style={{ marginBottom: 18 }}>{initial ? 'Update the name, icon, or color.' : 'e.g. Google, Banking, Work — group your saved logins however makes sense to you.'}</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Google" />
        </div>
        <div className="field">
          <label>Icon</label>
          <div className="icon-grid">
            {VAULT_ICONS.map(({ key, Icon, label }) => (
              <button
                type="button"
                key={key}
                className={`icon-chip ${icon === key ? 'active' : ''}`}
                onClick={() => setIcon(key)}
                title={label}
              >
                <Icon size={19} />
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
        <button className="btn btn-primary" type="submit">{initial ? 'Save changes' : 'Create category'}</button>
      </form>
    </Sheet>
  )
}
