import { formatMoney } from '../lib/categories'
import { getLoanType } from '../lib/loanTypes'
import Sheet from './Sheet'

export default function LoanDetailSheet({ loan, payments, onClose, onAddPayment, onEdit, onDelete }) {
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(0, Number(loan.original_amount) - paid)
  const pct = Math.min(100, (paid / Number(loan.original_amount)) * 100)
  const type = getLoanType(loan.lender_type)
  const isPaidOff = remaining <= 0

  return (
    <Sheet onClose={onClose}>
      <h2>{loan.lender_name}</h2>
      <p className="sub" style={{ marginBottom: 16 }}>{type.label}{loan.due_date && ` · due ${new Date(loan.due_date).toLocaleDateString()}`}</p>

      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span className="sub" style={{ margin: 0 }}>{formatMoney(paid)} paid</span>
          <span className="sub" style={{ margin: 0 }}>{formatMoney(loan.original_amount)} total</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: isPaidOff ? 'var(--accent)' : type.color }} />
        </div>
        <p style={{ marginTop: 10, marginBottom: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>
          {isPaidOff ? '✓ Paid off' : `${formatMoney(remaining)} remaining`}
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
              <span className="row-value">{formatMoney(p.amount)}</span>
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
