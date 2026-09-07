import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import CategorySheet from '../components/CategorySheet'
import PasswordFormSheet from '../components/PasswordFormSheet'
import PasswordDetailSheet from '../components/PasswordDetailSheet'
import Toast from '../components/Toast'
import { VaultIconDisplay } from '../lib/vaultIcons'

export default function Vault() {
  const { user } = useAuth()
  const { encrypt, decrypt } = useVault()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [openCategory, setOpenCategory] = useState(null)
  const [sheet, setSheet] = useState(null) // 'add-menu' | 'add-category' | 'add-password' | 'edit-password'
  const [detailItem, setDetailItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setSheet({ type: 'add-menu' })
      setSearchParams({}, { replace: true })
    }
  }, [])

  async function loadAll() {
    const [{ data: cats }, { data: pwItems }] = await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('password_items').select('*').order('created_at', { ascending: false }),
    ])
    setCategories(cats || [])
    setItems(pwItems || [])
  }

  useEffect(() => { loadAll() }, [])

  async function handleSaveCategory({ name, color, icon }) {
    if (editingCategory) {
      const { error } = await supabase.from('categories').update({ name, color, icon }).eq('id', editingCategory.id)
      if (!error) {
        setSheet(null)
        setEditingCategory(null)
        loadAll()
        setToast('Category updated')
      }
    } else {
      const { error } = await supabase.from('categories').insert({ user_id: user.id, name, color, icon })
      if (!error) {
        setSheet(null)
        loadAll()
        setToast('Category created')
      }
    }
  }

  async function handleSavePassword(form) {
    const encrypted_data = await encrypt({ username: form.username, password: form.password, url: form.url, notes: form.notes })
    if (editingItem) {
      await supabase.from('password_items').update({ title: form.title, category_id: form.categoryId, encrypted_data, updated_at: new Date().toISOString() }).eq('id', editingItem.id)
      setToast('Login updated')
    } else {
      await supabase.from('password_items').insert({ user_id: user.id, title: form.title, category_id: form.categoryId, encrypted_data })
      setToast('Login saved')
    }
    setSheet(null)
    setEditingItem(null)
    setDetailItem(null)
    loadAll()
  }

  async function handleOpenItem(item) {
    const decrypted = await decrypt(item.encrypted_data)
    setDetailItem({ ...item, ...decrypted })
  }

  async function handleDelete(item) {
    await supabase.from('password_items').delete().eq('id', item.id)
    setDetailItem(null)
    setToast('Login deleted')
    loadAll()
  }

  const itemsByCategory = (catId) => items.filter((i) => i.category_id === catId)

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return items
      .filter((i) => i.title.toLowerCase().includes(q))
      .map((i) => ({ ...i, categoryName: categories.find((c) => c.id === i.category_id)?.name || 'Uncategorized' }))
  }, [query, items, categories])

  return (
    <div className="screen">
      <h1 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Vault</h1>
      <p className="sub" style={{ marginBottom: 18 }}>{items.length} saved login{items.length !== 1 ? 's' : ''} across {categories.length} categories</p>

      <div className="field" style={{ marginBottom: 18 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search logins…" />
      </div>

      {searchResults && (
        <>
          {searchResults.length === 0 ? (
            <div className="empty-state">
              <div className="glyph">🔍</div>
              <p>No logins match "{query}".</p>
            </div>
          ) : (
            <div className="group">
              {searchResults.map((item) => (
                <button key={item.id} className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => handleOpenItem(item)}>
                  <div className="row-icon" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>🔑</div>
                  <div className="row-body">
                    <div className="row-title">{item.title}</div>
                    <div className="row-subtitle">{item.categoryName}</div>
                  </div>
                  <span className="row-chevron">›</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!searchResults && (
      <>
      {categories.length === 0 && (
        <div className="empty-state">
          <div className="glyph">🔐</div>
          <p>No categories yet. Add one to start saving logins — try "Google" or "Banking".</p>
        </div>
      )}

      {categories.map((cat) => {
        const catItems = itemsByCategory(cat.id)
        const isOpen = openCategory === cat.id
        return (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div className="group">
              <button className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpenCategory(isOpen ? null : cat.id)}>
                <div className="row-icon" style={{ background: cat.color, color: 'var(--ink)' }}><VaultIconDisplay iconKey={cat.icon} size={18} /></div>
                <div className="row-body">
                  <div className="row-title">{cat.name}</div>
                  <div className="row-subtitle">{catItems.length} login{catItems.length !== 1 ? 's' : ''}</div>
                </div>
                <span
                  className="icon-btn"
                  style={{ padding: 6 }}
                  onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setSheet({ type: 'edit-category' }) }}
                >
                  ✏️
                </span>
                <span className="row-chevron">{isOpen ? '⌃' : '⌄'}</span>
              </button>
            </div>
            <div className={`category-panel ${isOpen ? 'open' : ''}`}>
              <div className="category-panel-inner">
                {catItems.length > 0 && (
                  <div className="group" style={{ marginTop: 8 }}>
                    {catItems.map((item) => (
                      <button key={item.id} className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => handleOpenItem(item)}>
                        <div className="row-icon" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>🔑</div>
                        <div className="row-body">
                          <div className="row-title">{item.title}</div>
                        </div>
                        <span className="row-chevron">›</span>
                      </button>
                    ))}
                  </div>
                )}
                <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { setEditingItem(null); setSheet({ type: 'add-password', categoryId: cat.id }) }}>
                  + Add login to {cat.name}
                </button>
              </div>
            </div>
          </div>
        )
      })}
      </>
      )}

      <button className="fab" onClick={() => setSheet({ type: 'add-menu' })}>+</button>

      {sheet?.type === 'add-menu' && (
        <div className="sheet-overlay" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2>Add to vault</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { setEditingCategory(null); setSheet({ type: 'add-category' }) }}>New category</button>
              <button className="btn btn-ghost" disabled={categories.length === 0} onClick={() => setSheet({ type: 'add-password' })}>
                New login {categories.length === 0 && '(add a category first)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sheet?.type === 'add-category' && (
        <CategorySheet onClose={() => setSheet(null)} onSave={handleSaveCategory} />
      )}

      {sheet?.type === 'edit-category' && (
        <CategorySheet initial={editingCategory} onClose={() => { setSheet(null); setEditingCategory(null) }} onSave={handleSaveCategory} />
      )}

      {sheet?.type === 'add-password' && (
        <PasswordFormSheet
          categories={categories}
          defaultCategoryId={sheet.categoryId}
          onClose={() => setSheet(null)}
          onSave={handleSavePassword}
        />
      )}

      {sheet?.type === 'edit-password' && (
        <PasswordFormSheet
          categories={categories}
          initial={editingItem}
          onClose={() => setSheet(null)}
          onSave={handleSavePassword}
        />
      )}

      {detailItem && (
        <PasswordDetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={() => { setEditingItem({ id: detailItem.id, title: detailItem.title, categoryId: detailItem.category_id, ...detailItem }); setSheet({ type: 'edit-password' }) }}
          onDelete={() => handleDelete(detailItem)}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
