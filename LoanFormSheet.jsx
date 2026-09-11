import { useState } from 'react'
import Sheet from './Sheet'
import { LOAN_TYPES } from '../lib/loanTypes'

export default function LoanFormSheet({ initial, onClose, onSave }) {
  const [lenderName, setLenderName] = useState(initial?.lender_name || '')
  const [lenderType, setLenderType] = useState(initial?.lender_type || 'person')
  const [amount, setAmount] = useState(initial?.original_amount ?? '')
  const [borrowedOn, setBorrowedOn] = useState(initial?.borrowed_on || '')
  const [dueDate, setDueDate] = useState(initial?.due_date || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!lenderName.trim() || !amount || isNaN(parseFloat(amount))) return
    onSave({ lenderName: lenderName.trim(), lenderType, amount: parseFloat(amount), borrowedOn: borrowedOn || null, dueDate: dueDate || null, notes })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{initial ? 'Edit loan' : 'New loan'}</h2>
      <p className="sub" style={{ marginBottom: 18 }}>Record money you've borrowed and need to pay back.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Who from</label>
          <input autoFocus value={lenderName} onChange={(e) => setLenderName(e.target.value)} placeholder="e.g. Ahmed, ADCB, Tabby" />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="chip-row">
            {LOAN_TYPES.map(({ key, label, Icon }) => (
              <button
                type="button"
                key={key}
                className={`chip ${lenderType === key ? 'active' : ''}`}
                onClick={() => setLenderType(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Amount borrowed (AED)</label>
          <input type="number" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" disabled={!!initial} />
          {initial && <p className="sub" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>The original amount can't be changed once payments exist — log a payment instead to reduce the balance.</p>}
        </div>
        <div className="field">
          <label>Date borrowed (optional)</label>
          <input type="date" value={borrowedOn} onChange={(e) => setBorrowedOn(e.target.value)} />
        </div>
        <div className="field">
          <label>Due date (optional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes (optional, encrypted)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" />
        </div>
        <button className="btn btn-primary" type="submit">{initial ? 'Save changes' : 'Add loan'}</button>
      </form>
    </Sheet>
  )
}
