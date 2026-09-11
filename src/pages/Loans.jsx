import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import { formatMoney } from '../lib/categories'
import { getLoanType, dueDateStatus } from '../lib/loanTypes'
import LoanFormSheet from '../components/LoanFormSheet'
import LoanPaymentSheet from '../components/LoanPaymentSheet'
import LoanDetailSheet from '../components/LoanDetailSheet'
import LoanChart from '../components/LoanChart'
import Toast from '../components/Toast'

const SORT_OPTIONS = [
  { key: 'dueDate', label: 'Due date (soonest first)' },
  { key: 'amountDesc', label: 'Amount: high to low' },
  { key: 'amountAsc', label: 'Amount: low to high' },
  { key: 'nameAsc', label: 'Name (A–Z)' },
  { key: 'recent', label: 'Recently added' },
]

function sortLoans(list, sortBy) {
  const arr = [...list]
  switch (sortBy) {
    case 'amountDesc':
      return arr.sort((a, b) => Number(b.original_amount) - Number(a.original_amount))
    case 'amountAsc':
      return arr.sort((a, b) => Number(a.original_amount) - Number(b.original_amount))
    case 'nameAsc':
      return arr.sort((a, b) => a.lender_name.localeCompare(b.lender_name))
    case 'recent':
      return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'dueDate':
    default:
      return arr.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
  }
}

export default function Loans() {
  const { user } = useAuth()
  const { encrypt, decrypt } = useVault()
  const [loans, setLoans] = useState([])
  const [payments, setPayments] = useState([])
  const [sheet, setSheet] = useState(null) // 'add-loan' | 'edit-loan' | 'add-payment'
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [toast, setToast] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'paid'
  const [sortBy, setSortBy] = useState('dueDate')

  async function loadAll() {
    const [{ data: loanRows }, { data: paymentRows }] = await Promise.all([
      supabase.from('loans').select('*').order('created_at', { ascending: false }),
      supabase.from('loan_payments').select('*').order('paid_on', { ascending: false }),
    ])
    setLoans(loanRows || [])
    setPayments(paymentRows || [])
  }

  useEffect(() => { loadAll() }, [])

  function paymentsFor(loanId) {
    return payments.filter((p) => p.loan_id === loanId)
  }

  function remainingFor(loan) {
    const paid = paymentsFor(loan.id).reduce((sum, p) => sum + Number(p.amount), 0)
    return Math.max(0, Number(loan.original_amount) - paid)
  }

  function paidFor(loan) {
    return paymentsFor(loan.id).reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const totalBorrowed = useMemo(() => loans.reduce((sum, l) => sum + Number(l.original_amount), 0), [loans])
  const totalRemaining = useMemo(() => loans.reduce((sum, l) => sum + remainingFor(l), 0), [loans, payments])

  const { activeLoans, paidLoans } = useMemo(() => {
    const q = query.trim().toLowerCase()
    let filtered = loans.filter((l) => l.lender_name.toLowerCase().includes(q))
    const active = filtered.filter((l) => remainingFor(l) > 0)
    const paidOff = filtered.filter((l) => remainingFor(l) <= 0)
    return { activeLoans: sortLoans(active, sortBy), paidLoans: sortLoans(paidOff, sortBy) }
  }, [loans, payments, query, sortBy])

  const chartData = useMemo(
    () => activeLoans.map((l) => ({ name: l.lender_name, paid: paidFor(l), remaining: remainingFor(l) })),
    [activeLoans, payments]
  )

  async function handleSaveLoan(form) {
    const encrypted_notes = form.notes ? await encrypt({ notes: form.notes }) : null
    if (sheet?.editing) {
      await supabase.from('loans').update({
        lender_name: form.lenderName,
        lender_type: form.lenderType,
        borrowed_on: form.borrowedOn,
        due_date: form.dueDate,
        encrypted_notes,
      }).eq('id', sheet.editing.id)
      setToast('Loan updated')
    } else {
      await supabase.from('loans').insert({
        user_id: user.id,
        lender_name: form.lenderName,
        lender_type: form.lenderType,
        original_amount: form.amount,
        borrowed_on: form.borrowedOn,
        due_date: form.dueDate,
        encrypted_notes,
      })
      setToast('Loan added')
    }
    setSheet(null)
    setSelectedLoan(null)
    loadAll()
  }

  async function handleSavePayment(form) {
    const encrypted_note = form.note ? await encrypt({ note: form.note }) : null
    await supabase.from('loan_payments').insert({
      loan_id: selectedLoan.id,
      user_id: user.id,
      amount: form.amount,
      paid_on: form.paidOn,
      encrypted_note,
    })
    setToast('Payment logged')
    setSheet(null)
    await loadAll()
    setSelectedLoan((prev) => (prev ? { ...prev } : null))
  }

  async function handleOpenLoan(loan) {
    const notes = loan.encrypted_notes ? (await decrypt(loan.encrypted_notes)).notes : ''
    setSelectedLoan({ ...loan, notes })
  }

  async function handleDeleteLoan() {
    await supabase.from('loans').delete().eq('id', selectedLoan.id)
    setSelectedLoan(null)
    setToast('Loan deleted')
    loadAll()
  }

  function decryptedPaymentsFor(loanId) {
    return Promise.all(
      paymentsFor(loanId).map(async (p) => ({
        ...p,
        note: p.encrypted_note ? (await decrypt(p.encrypted_note)).note : '',
      }))
    )
  }

  const [detailPayments, setDetailPayments] = useState([])
  useEffect(() => {
    if (selectedLoan) {
      decryptedPaymentsFor(selectedLoan.id).then(setDetailPayments)
    } else {
      setDetailPayments([])
    }
  }, [selectedLoan, payments])

  function renderLoanRow(loan) {
    const type = getLoanType(loan.lender_type)
    const paid = paidFor(loan)
    const remaining = remainingFor(loan)
    const pct = Math.min(100, (paid / Number(loan.original_amount)) * 100)
    const due = remaining > 0 ? dueDateStatus(loan.due_date) : null
    return (
      <button key={loan.id} className="row loan-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => handleOpenLoan(loan)}>
        <div className="row-icon" style={{ background: type.color, color: 'var(--ink)' }}><type.Icon size={17} /></div>
        <div className="row-body" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="row-title">{loan.lender_name}</div>
            <span className="row-value" style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--accent)' }}>
              {remaining > 0 ? formatMoney(remaining) : '✓ Paid'}
            </span>
          </div>
          <div className="row-subtitle" style={{ marginTop: 2 }}>
            {formatMoney(paid)} of {formatMoney(loan.original_amount)} paid
            {due && (
              <span style={{ color: due.isOverdue ? 'var(--danger)' : due.isSoon ? '#E8A65C' : 'var(--text-muted)' }}> · {due.label}</span>
            )}
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: remaining > 0 ? type.color : 'var(--accent)' }} />
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="screen">
      <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Loans</h1>
      <p className="sub" style={{ marginBottom: 18 }}>Money you've borrowed and owe back</p>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Total borrowed</div>
          <div className="value">{formatMoney(totalBorrowed)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Still owed</div>
          <div className="value" style={{ color: totalRemaining > 0 ? 'var(--danger)' : 'var(--accent)' }}>{formatMoney(totalRemaining)}</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <>
          <div className="group-title">Overview</div>
          <LoanChart data={chartData} />
        </>
      )}

      <div className="field" style={{ marginTop: 8, marginBottom: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by lender…" />
      </div>

      <div className="chip-row" style={{ marginBottom: 12 }}>
        {['all', 'active', 'paid'].map((f) => (
          <button key={f} className={`chip ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Paid off'}
          </button>
        ))}
      </div>

      <div className="field" style={{ marginBottom: 18 }}>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {loans.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🤝</div>
          <p>No loans tracked yet. Add one when you borrow from a person, Tabby, Botim, or a bank.</p>
        </div>
      )}

      {loans.length > 0 && activeLoans.length === 0 && paidLoans.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🔍</div>
          <p>No loans match your search.</p>
        </div>
      )}

      {statusFilter !== 'paid' && activeLoans.length > 0 && (
        <>
          <div className="group-title">Active</div>
          <div className="group">{activeLoans.map(renderLoanRow)}</div>
        </>
      )}

      {statusFilter !== 'active' && paidLoans.length > 0 && (
        <>
          <div className="group-title">Paid off</div>
          <div className="group">{paidLoans.map(renderLoanRow)}</div>
        </>
      )}

      <button className="fab" onClick={() => setSheet({ type: 'add-loan' })}>+</button>

      {(sheet?.type === 'add-loan' || sheet?.type === 'edit-loan') && (
        <LoanFormSheet
          initial={sheet.editing}
          onClose={() => setSheet(null)}
          onSave={handleSaveLoan}
        />
      )}

      {sheet?.type === 'add-payment' && selectedLoan && (
        <LoanPaymentSheet
          remaining={remainingFor(selectedLoan)}
          onClose={() => setSheet(null)}
          onSave={handleSavePayment}
        />
      )}

      {selectedLoan && !sheet && (
        <LoanDetailSheet
          loan={selectedLoan}
          payments={detailPayments}
          onClose={() => setSelectedLoan(null)}
          onAddPayment={() => setSheet({ type: 'add-payment' })}
          onEdit={() => setSheet({ type: 'edit-loan', editing: selectedLoan })}
          onDelete={handleDeleteLoan}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
