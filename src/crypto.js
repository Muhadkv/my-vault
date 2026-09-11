// All encryption/decryption happens in the browser. The server (Supabase)
// only ever stores ciphertext + salt + iv. Your master password never leaves
// this device, and is never sent to Supabase or stored anywhere.

const PBKDF2_ITERATIONS = 250000

function toBase64(bytes) {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function fromBase64(str) {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(masterPassword, saltBytes) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypts a JS object. Returns a single string safe to store in a DB column.
export async function encryptData(masterPassword, dataObj) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(masterPassword, salt)
  const enc = new TextEncoder()
  const plaintext = enc.encode(JSON.stringify(dataObj))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  return JSON.stringify({
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  })
}

// Decrypts a string produced by encryptData. Throws if the master password is wrong.
export async function decryptData(masterPassword, payloadStr) {
  const payload = JSON.parse(payloadStr)
  const salt = fromBase64(payload.salt)
  const iv = fromBase64(payload.iv)
  const data = fromBase64(payload.data)
  const key = await deriveKey(masterPassword, salt)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return JSON.parse(new TextDecoder().decode(plaintext))
}

// Used at vault setup time: stores a verifier so we can check "is this the
// right master password?" without ever storing the password itself.
export async function makeVerifier(masterPassword) {
  return encryptData(masterPassword, { check: 'vault-ok' })
}

export async function checkVerifier(masterPassword, verifierStr) {
  try {
    const result = await decryptData(masterPassword, verifierStr)
    return result?.check === 'vault-ok'
  } catch {
    return false
  }
}

// Simple strength estimate (0-4) for the password generator / strength meter.
export function estimateStrength(password) {
  if (!password) return 0
  let score = 0
  const sets = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]
  const variety = sets.filter((r) => r.test(password)).length
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (variety >= 3) score++
  if (password.length >= 16 && variety === 4) score++
  return Math.min(score, 4)
}

export function generatePassword({ length = 16, upper = true, lower = true, numbers = true, symbols = true } = {}) {
  const sets = []
  if (upper) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ')
  if (lower) sets.push('abcdefghijkmnpqrstuvwxyz')
  if (numbers) sets.push('23456789')
  if (symbols) sets.push('!@#$%^&*()-_=+[]{}')
  if (sets.length === 0) sets.push('abcdefghijkmnpqrstuvwxyz')

  const all = sets.join('')
  const randomValues = crypto.getRandomValues(new Uint32Array(length))
  let result = ''
  for (let i = 0; i < length; i++) {
    result += all[randomValues[i] % all.length]
  }
  return result
}
