import { useState } from 'react'
import Sheet from './Sheet'
import { formatMoney } from '../lib/categories'

export default function LoanPaymentSheet({ remaining, currency = 'AED', onClose, onSave }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || isNaN(val)) return
    onSave({ amount: val, paidOn: date, note })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>Add payment</h2>
      <p className="sub" style={{ marginBottom: 18 }}>{formatMoney(remaining, currency)} remaining</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Amount paid ({currency})</label>
          <input autoFocus type="number" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Note (optional, encrypted)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. bank transfer, cash" />
        </div>
        <button className="btn btn-primary" type="submit">Save payment</button>
      </form>
    </Sheet>
  )
}
