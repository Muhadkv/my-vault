import { formatMoney } from '../lib/categories'
import { getLoanType, dueDateStatus } from '../lib/loanTypes'
import Sheet from './Sheet'

export default function LoanDetailSheet({ loan, payments, onClose, onAddPayment, onEdit, onDelete }) {
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(0, Number(loan.original_amount) - paid)
  const pct = Math.min(100, (paid / Number(loan.original_amount)) * 100)
  const type = getLoanType(loan.lender_type)
  const currency = loan.currency || 'AED'
  const isPaidOff = remaining <= 0
  const due = !isPaidOff ? dueDateStatus(loan.due_date) : null

  return (
    <Sheet onClose={onClose}>
      <h2>{loan.lender_name}</h2>
      <p className="sub" style={{ marginBottom: 4 }}>{type.label}</p>
      {(loan.borrowed_on || loan.due_date) && (
        <p className="sub" style={{ marginBottom: 16, fontSize: 13 }}>
          {loan.borrowed_on && `Borrowed ${new Date(loan.borrowed_on).toLocaleDateString()}`}
          {loan.borrowed_on && loan.due_date && ' · '}
          {loan.due_date && `Due ${new Date(loan.due_date).toLocaleDateString()}`}
        </p>
      )}

      {due && (
        <div className="field">
          <div
            className="reveal-field"
            style={{ justifyContent: 'center', borderColor: due.isOverdue ? 'var(--danger)' : due.isSoon ? '#E8A65C' : 'var(--border)' }}
          >
            <span style={{ color: due.isOverdue ? 'var(--danger)' : due.isSoon ? '#E8A65C' : 'var(--text)', fontWeight: 600 }}>
              {due.isOverdue ? '⚠️ ' : '📅 '}{due.label}
            </span>
          </div>
        </div>
      )}

      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span className="sub" style={{ margin: 0 }}>{formatMoney(paid, currency)} paid</span>
          <span className="sub" style={{ margin: 0 }}>{formatMoney(loan.original_amount, currency)} total</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: isPaidOff ? 'var(--accent)' : type.color }} />
        </div>
        <p style={{ marginTop: 10, marginBottom: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
          {isPaidOff ? '✓ Paid off' : `${formatMoney(remaining, currency)} remaining`}
        </p>
      </div>

      {loan.notes && (
        <div className="field">
          <label>Notes</label>
          <div className="reveal-field"><span className="value" style={{ whiteSpace: 'pre-wrap' }}>{loan.notes}</span></div>
        </div>
      )}

      {!isPaidOff && (
        <button className="btn btn-primary" onClick={onAddPayment} style={{ marginBottom: 16 }}>+ Add payment</button>
      )}

      <div className="group-title">Payment history</div>
      {payments.length === 0 ? (
        <p className="sub">No payments logged yet.</p>
      ) : (
        <div className="group" style={{ marginBottom: 16 }}>
          {payments.map((p) => (
            <div key={p.id} className="row">
              <div className="row-body">
                <div className="row-title">{p.note || 'Payment'}</div>
                <div className="row-subtitle">{new Date(p.paid_on).toLocaleDateString()}</div>
              </div>
              <span className="row-value">{formatMoney(p.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger" onClick={onDelete}>Delete loan</button>
      </div>
    </Sheet>
  )
}
