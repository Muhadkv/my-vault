import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import { iconFor, formatMoney, CURRENCIES } from '../lib/categories'
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
  const [currency, setCurrency] = useState('AED')
  const [searchParams, setSearchParams] = useSearchParams()

  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

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

  function shiftMonth(delta) {
    let m = selectedMonth + delta
    let y = selectedYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  const monthLabel = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  const currencyExpenses = useMemo(() => expenses.filter((e) => (e.currency || 'AED') === currency), [expenses, currency])
  const currencyBudgets = useMemo(() => budgets.filter((b) => (b.currency || 'AED') === currency), [budgets, currency])

  const yearOptions = useMemo(() => {
    const years = new Set(currencyExpenses.map((e) => new Date(e.spent_on).getFullYear()))
    years.add(today.getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [currencyExpenses])

  const monthExpenses = useMemo(
    () => currencyExpenses.filter((e) => {
      const d = new Date(e.spent_on)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    }),
    [currencyExpenses, selectedMonth, selectedYear]
  )

  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const byCategory = useMemo(() => {
    const map = {}
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount) })
    return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  }, [monthExpenses])

  async function handleSaveExpense(form) {
    const encrypted_note = form.note ? await encrypt({ note: form.note }) : null
    await supabase.from('expenses').insert({
      user_id: user.id,
      category: form.category,
      amount: form.amount,
      currency: form.currency,
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
    return currencyBudgets.find((b) => b.category === category)
  }

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return monthExpenses
    return monthExpenses.filter((e) => e.category.toLowerCase().includes(q) || String(e.amount).includes(q))
  }, [query, monthExpenses])

  return (
    <div className="screen">
      <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Expenses</h1>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {CURRENCIES.map((c) => (
          <button key={c.code} className={`chip ${currency === c.code ? 'active' : ''}`} onClick={() => setCurrency(c.code)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="month-nav">
        <button className="icon-btn" style={{ fontSize: 20 }} onClick={() => shiftMonth(-1)}>‹</button>
        <select
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number)
            setSelectedYear(y)
            setSelectedMonth(m)
          }}
          className="month-select"
        >
          {yearOptions.flatMap((y) =>
            Array.from({ length: 12 }, (_, m) => (
              <option key={`${y}-${m}`} value={`${y}-${m}`}>
                {new Date(y, m).toLocaleString('default', { month: 'long' })} {y}
              </option>
            ))
          )}
        </select>
        <button className="icon-btn" style={{ fontSize: 20 }} onClick={() => shiftMonth(1)}>›</button>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">{monthLabel}</div>
          <div className="value">{formatMoney(monthTotal, currency)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Transactions</div>
          <div className="value">{monthExpenses.length}</div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <>
          <ExpenseChart data={byCategory} currency={currency} />
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
                        {overBudget ? 'Over budget · ' : nearBudget ? 'Near limit · ' : ''}budget {formatMoney(bud.monthly_limit, currency)}
                      </div>
                    )}
                  </div>
                  <span className="row-value expense">{formatMoney(c.total, currency)}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="group-title">{monthLabel}</div>
      <div className="field" style={{ marginBottom: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search by category or amount…" />
      </div>
      {monthExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">💳</div>
          <p>No {currency} expenses logged for {monthLabel}.</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">🔍</div>
          <p>No expenses match "{query}".</p>
        </div>
      ) : (
        <div className="group">
          {filteredExpenses.map((e) => (
            <div key={e.id} className="row">
              <div className="row-icon" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>{iconFor(e.category)}</div>
              <div className="row-body">
                <div className="row-title">{e.category}{e.is_recurring ? ' · recurring' : ''}</div>
                <div className="row-subtitle">{new Date(e.spent_on).toLocaleDateString()}</div>
              </div>
              <span className="row-value expense">-{formatMoney(e.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowForm(true)}>+</button>
      {showForm && <ExpenseFormSheet defaultCurrency={currency} onClose={() => setShowForm(false)} onSave={handleSaveExpense} />}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
