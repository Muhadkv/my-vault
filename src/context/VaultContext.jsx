import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { encryptData, decryptData, makeVerifier, checkVerifier } from '../lib/crypto'
import { useAuth } from './AuthContext'

const VaultContext = createContext(null)
const AUTO_LOCK_MS = 5 * 60 * 1000 // 5 minutes of inactivity

export function VaultProvider({ children }) {
  const { user } = useAuth()
  const [masterPassword, setMasterPassword] = useState(null) // held only in memory
  const [hasVault, setHasVault] = useState(null) // null = unknown, true/false once checked
  const timerRef = useRef(null)

  const lock = useCallback(() => setMasterPassword(null), [])

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    if (masterPassword) {
      timerRef.current = setTimeout(lock, AUTO_LOCK_MS)
    }
  }, [masterPassword, lock])

  useEffect(() => {
    if (!masterPassword) return
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()
    return () => events.forEach((e) => window.removeEventListener(e, resetTimer))
  }, [masterPassword, resetTimer])

  useEffect(() => {
    if (!user) {
      setHasVault(null)
      return
    }
    supabase
      .from('vault_meta')
      .select('verifier')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setHasVault(!!data))
  }, [user])

  // Called once, the first time a user sets their master password.
  async function createVault(newMasterPassword) {
    const verifier = await makeVerifier(newMasterPassword)
    const { error } = await supabase.from('vault_meta').insert({ user_id: user.id, verifier })
    if (error) throw error
    setHasVault(true)
    setMasterPassword(newMasterPassword)
  }

  // Called every time the app is opened / re-locked.
  async function unlock(candidatePassword) {
    const { data, error } = await supabase
      .from('vault_meta')
      .select('verifier')
      .eq('user_id', user.id)
      .single()
    if (error) throw error
    const ok = await checkVerifier(candidatePassword, data.verifier)
    if (ok) setMasterPassword(candidatePassword)
    return ok
  }

  const encrypt = (obj) => encryptData(masterPassword, obj)
  const decrypt = (str) => decryptData(masterPassword, str)

  return (
    <VaultContext.Provider
      value={{ isUnlocked: !!masterPassword, hasVault, createVault, unlock, lock, encrypt, decrypt }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export const useVault = () => useContext(VaultContext)
