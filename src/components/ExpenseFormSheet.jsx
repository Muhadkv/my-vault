import { useState } from 'react'
import Sheet from './Sheet'
import { EXPENSE_CATEGORIES, noteLabelFor, CURRENCIES } from '../lib/categories'

export default function ExpenseFormSheet({ onClose, onSave, defaultCurrency = 'AED' }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [interval, setInterval] = useState('monthly')

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) return
    onSave({ category, amount: parseFloat(amount), currency, spentOn: date, note, isRecurring, interval })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>New expense</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div className="field">
          <label>Currency</label>
          <div className="chip-row">
            {CURRENCIES.map((c) => (
              <button type="button" key={c.code} className={`chip ${currency === c.code ? 'active' : ''}`} onClick={() => setCurrency(c.code)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Amount</label>
          <input autoFocus type="number" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>{noteLabelFor(category)} (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={noteLabelFor(category)} />
        </div>
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            Recurring expense
          </label>
        </div>
        {isRecurring && (
          <div className="field">
            <label>Repeats</label>
            <select value={interval} onChange={(e) => setInterval(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
        <button className="btn btn-primary" type="submit">Save expense</button>
      </form>
    </Sheet>
  )
}
