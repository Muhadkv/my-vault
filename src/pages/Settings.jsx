import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import Sheet from '../components/Sheet'
import Toast from '../components/Toast'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { lock } = useVault()
  const [budgets, setBudgets] = useState([])
  const [expenseCount, setExpenseCount] = useState(0)
  const [passwordCount, setPasswordCount] = useState(0)
  const [showBudgetSheet, setShowBudgetSheet] = useState(false)
  const [mfaFactor, setMfaFactor] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [toast, setToast] = useState('')

  async function loadAll() {
    const [{ data: bud }, { count: expCount }, { count: pwCount }, { data: factors }] = await Promise.all([
      supabase.from('budgets').select('*'),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('password_items').select('*', { count: 'exact', head: true }),
      supabase.auth.mfa.listFactors(),
    ])
    setBudgets(bud || [])
    setExpenseCount(expCount || 0)
    setPasswordCount(pwCount || 0)
    setMfaFactor(factors?.totp?.[0] || null)
  }

  useEffect(() => { loadAll() }, [])

  async function handleSaveBudget(category, monthly_limit) {
    await supabase.from('budgets').upsert({ user_id: user.id, category, monthly_limit }, { onConflict: 'user_id,category' })
    loadAll()
  }

  async function startEnroll() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (!error) {
      setMfaFactor(data)
      setEnrolling(true)
    }
  }

  async function confirmEnroll() {
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaFactor.id })
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactor.id, challengeId: challenge.id, code: totpCode })
    if (!error) {
      setToast('Two-factor authentication enabled')
      setEnrolling(false)
      loadAll()
    } else {
      setToast('Invalid code, try again')
    }
  }

  async function handleExportBackup() {
    const [{ data: cats }, { data: items }, { data: exp }] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('password_items').select('*'),
      supabase.from('expenses').select('*'),
    ])
    const backup = { exportedAt: new Date().toISOString(), categories: cats, password_items: items, expenses: exp }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast('Backup downloaded — password fields stay encrypted in this file')
  }

  async function handleExportCsv() {
    const { data: exp } = await supabase.from('expenses').select('*').order('spent_on')
    const rows = [['Date', 'Category', 'Amount', 'Recurring'], ...(exp || []).map((e) => [e.spent_on, e.category, e.amount, e.is_recurring ? e.recurring_interval : ''])]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen">
      <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Settings</h1>
      <p className="sub" style={{ marginBottom: 18 }}>{user?.email}</p>

      <div className="group-title">Overview</div>
      <div className="group">
        <div className="row"><div className="row-body"><div className="row-title">Saved logins</div></div><span className="row-value">{passwordCount}</span></div>
        <div className="row"><div className="row-body"><div className="row-title">Logged expenses</div></div><span className="row-value">{expenseCount}</span></div>
      </div>

      <div className="group-title">Budgets</div>
      <div className="group">
        {budgets.length === 0 && <div className="row"><div className="row-subtitle">No monthly budgets set yet.</div></div>}
        {budgets.map((b) => (
          <div key={b.id} className="row">
            <div className="row-body"><div className="row-title">{b.category}</div></div>
            <span className="row-value">${b.monthly_limit}/mo</span>
          </div>
        ))}
        <button className="row" style={{ width: '100%', textAlign: 'left', color: 'var(--accent)' }} onClick={() => setShowBudgetSheet(true)}>
          + Set a budget
        </button>
      </div>

      <div className="group-title">Security</div>
      <div className="group">
        <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={lock}>
          <div className="row-body"><div className="row-title">Lock vault now</div></div>
          <span className="row-chevron">🔒</span>
        </button>
        <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={mfaFactor?.status === 'verified' ? undefined : startEnroll}>
          <div className="row-body">
            <div className="row-title">Two-factor authentication</div>
            <div className="row-subtitle">{mfaFactor?.status === 'verified' ? 'Enabled' : 'Adds a code from your authenticator app at sign-in'}</div>
          </div>
          {mfaFactor?.status !== 'verified' && <span className="row-chevron">›</span>}
        </button>
      </div>

      <div className="group-title">Data</div>
      <div className="group">
        <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={handleExportBackup}>
          <div className="row-body"><div className="row-title">Export encrypted backup</div><div className="row-subtitle">Passwords stay encrypted in the file</div></div>
        </button>
        <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={handleExportCsv}>
          <div className="row-body"><div className="row-title">Export expenses as CSV</div></div>
        </button>
      </div>

      <div className="group-title" />
      <div className="group">
        <button className="row" style={{ width: '100%', textAlign: 'left', color: 'var(--danger)' }} onClick={signOut}>
          Sign out
        </button>
      </div>

      {enrolling && mfaFactor && (
        <Sheet onClose={() => setEnrolling(false)}>
          <h2>Scan with your authenticator app</h2>
          <p className="sub">Use Google Authenticator, Authy, or similar.</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <img src={mfaFactor.totp?.qr_code} alt="TOTP QR code" style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }} />
          </div>
          <div className="field">
            <label>Enter the 6-digit code</label>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} inputMode="numeric" placeholder="000000" />
          </div>
          <button className="btn btn-primary" onClick={confirmEnroll}>Confirm</button>
        </Sheet>
      )}

      {showBudgetSheet && (
        <BudgetSheet onClose={() => setShowBudgetSheet(false)} onSave={(cat, limit) => { handleSaveBudget(cat, limit); setShowBudgetSheet(false) }} />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

function BudgetSheet({ onClose, onSave }) {
  const [category, setCategory] = useState('Food')
  const [limit, setLimit] = useState('')
  const CATS = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other']
  return (
    <Sheet onClose={onClose}>
      <h2>Set a budget</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (limit) onSave(category, parseFloat(limit)) }} style={{ marginTop: 14 }}>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Monthly limit</label>
          <input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="500" />
        </div>
        <button className="btn btn-primary" type="submit">Save budget</button>
      </form>
    </Sheet>
  )
}
