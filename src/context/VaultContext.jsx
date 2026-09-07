import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { encryptData, decryptData, makeVerifier, checkVerifier } from '../lib/crypto'
import { registerBiometric, unlockWithBiometric } from '../lib/webauthn'
import { useAuth } from './AuthContext'

const VaultContext = createContext(null)
const AUTO_LOCK_MS = 5 * 60 * 1000 // 5 minutes of inactivity
const biometricKey = (userId) => `vault_biometric_${userId}`

export function VaultProvider({ children }) {
  const { user } = useAuth()
  const [masterPassword, setMasterPassword] = useState(null) // held only in memory
  const [hasVault, setHasVault] = useState(null) // null = unknown, true/false once checked
  const [hasBiometric, setHasBiometric] = useState(false)
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
      setHasBiometric(false)
      return
    }
    supabase
      .from('vault_meta')
      .select('verifier')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setHasVault(!!data))
    setHasBiometric(!!localStorage.getItem(biometricKey(user.id)))
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

  // Sets up fingerprint/Face ID unlock. Requires the vault to already be unlocked.
  async function enableBiometric() {
    if (!masterPassword) throw new Error('Unlock your vault with your master password first.')
    const stored = await registerBiometric(user.email, masterPassword)
    localStorage.setItem(biometricKey(user.id), JSON.stringify(stored))
    setHasBiometric(true)
  }

  function disableBiometric() {
    localStorage.removeItem(biometricKey(user.id))
    setHasBiometric(false)
  }

  // Prompts the fingerprint/Face ID sensor, retrieves the master password
  // locally, then verifies + unlocks exactly like typing it in.
  async function unlockBiometric() {
    const raw = localStorage.getItem(biometricKey(user.id))
    if (!raw) throw new Error('Fingerprint unlock is not set up on this device.')
    const stored = JSON.parse(raw)
    const password = await unlockWithBiometric(stored)
    const ok = await unlock(password)
    if (!ok) throw new Error('Saved fingerprint credential no longer matches your vault.')
    return true
  }

  return (
    <VaultContext.Provider
      value={{
        isUnlocked: !!masterPassword,
        hasVault,
        hasBiometric,
        createVault,
        unlock,
        lock,
        encrypt,
        decrypt,
        enableBiometric,
        disableBiometric,
        unlockBiometric,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export const useVault = () => useContext(VaultContext)
