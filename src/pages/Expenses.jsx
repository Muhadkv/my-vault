import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import { iconFor, formatMoney } from '../lib/categories'
import ExpenseFormSheet from '../components/ExpenseFormSheet'
import ExpenseChart from '../components/ExpenseChart'
import Toast from '../components/Toast'

export default function Expenses() {
  const { user } = useAuth()
  const { encrypt } = useVault()
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  async function loadAll() {
    const [{ data: exp }, { data: bud }] = await Promise.all([
      supabase.from('expenses').select('*').order('spent_on', { ascending: false }),
      supabase.from('budgets').select('*'),
    ])
    setExpenses(exp || [])
    setBudgets(bud || [])
  }

  useEffect(() => { loadAll() }, [])

  const now = new Date()
  const thisMonthExpenses = useMemo(
    () => expenses.filter((e) => {
      const d = new Date(e.spent_on)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }),
    [expenses]
  )

  const monthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const byCategory = useMemo(() => {
    const map = {}
    thisMonthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount) })
    return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  }, [thisMonthExpenses])

  async function handleSaveExpense(form) {
    const encrypted_note = form.note ? await encrypt({ note: form.note }) : null
    await supabase.from('expenses').insert({
      user_id: user.id,
      category: form.category,
      amount: form.amount,
      spent_on: form.spentOn,
      encrypted_note,
      is_recurring: form.isRecurring,
      recurring_interval: form.isRecurring ? form.interval : null,
    })
    setShowForm(false)
    setToast('Expense added')
    loadAll()
  }

  function budgetFor(category) {
    return budgets.find((b) => b.category === category)
  }

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter((e) => e.category.toLowerCase().includes(q) || String(e.amount).includes(q))
  }, [query, expenses])

  return (
    <div className="screen">
      <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Expenses</h1>
      <p className="sub" style={{ marginBottom: 12 }}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">This month</div>
          <div className="value">{formatMoney(monthTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Transactions</div>
          <div className="value">{thisMonthExpenses.length}</div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <>
          <ExpenseChart data={byCategory} />
          <div className="group" style={{ marginTop: 4 }}>
            {byCategory.map((c) => {
              const bud = budgetFor(c.category)
              const overBudget = bud && c.total > bud.monthly_limit
              const nearBudget = bud && !overBudget && c.total > bud.monthly_limit * 0.8
              return (
                <div key={c.category} className="row">
                  <div className="row-icon" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>{iconFor(c.category)}</div>
                  <div className="row-body">
                    <div className="row-title">{c.category}</div>
                    {bud && (
                      <div className="row-subtitle" style={{ color: overBudget ? 'var(--danger)' : nearBudget ? '#E8A65C' : 'var(--text-muted)' }}>
                        {overBudget ? 'Over budget · ' : nearBudget ? 'Near limit · ' : ''}budget {formatMoney(bud.monthly_limit)}
                      </div>
                    )}
                  </div>
                  <span className="row-value expense">{formatMoney(c.total)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="group-title">Recent</div>
      <div className="field" style={{ marginBottom: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by category or amount…" />
      </div>
      {expenses.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">💳</div>
          <p>No expenses logged yet. Tap + to add your first one.</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">🔍</div>
          <p>No expenses match "{query}".</p>
        </div>
      ) : (
        <div className="group">
          {filteredExpenses.slice(0, 30).map((e) => (
            <div key={e.id} className="row">
              <div className="row-icon" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>{iconFor(e.category)}</div>
              <div className="row-body">
                <div className="row-title">{e.category}{e.is_recurring ? ' · recurring' : ''}</div>
                <div className="row-subtitle">{new Date(e.spent_on).toLocaleDateString()}</div>
              </div>
              <span className="row-value expense">-{formatMoney(e.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowForm(true)}>+</button>
      {showForm && <ExpenseFormSheet onClose={() => setShowForm(false)} onSave={handleSaveExpense} />}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
