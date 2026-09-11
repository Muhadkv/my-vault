// Uses WebAuthn's PRF extension: your device's fingerprint/Face ID sensor
// authenticates locally and produces a secret that never leaves the device.
// That secret encrypts/decrypts a local copy of your master password, stored
// only in this browser's localStorage — never sent to Supabase.
//
// Browser support for the PRF extension varies (good on Android Chrome and
// Windows Hello, inconsistent on iOS Safari). If it's unsupported, the
// functions below throw a clear error and the app falls back to the master
// password field.

function randomBytes(len) {
  return crypto.getRandomValues(new Uint8Array(len))
}

function toB64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function fromB64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

async function deriveKeyFromPRF(prfBytes) {
  return crypto.subtle.importKey('raw', prfBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export function isWebAuthnAvailable() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

// Sets up a platform authenticator (fingerprint / Face ID / Windows Hello)
// and uses it to wrap the master password. Returns a JSON-safe object to
// store locally.
export async function registerBiometric(userEmail, masterPassword) {
  if (!isWebAuthnAvailable()) {
    throw new Error("This browser doesn't support fingerprint/Face ID unlock.")
  }

  const challenge = randomBytes(32)
  const userId = randomBytes(16)
  const salt = randomBytes(32)

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Vault' },
      user: { id: userId, name: userEmail, displayName: userEmail },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      extensions: { prf: { eval: { first: salt } } },
    },
  })

  if (!cred) throw new Error('Fingerprint setup was cancelled.')

  let prfBytes = cred.getClientExtensionResults()?.prf?.results?.first

  // Some platforms only return the PRF value on a follow-up get(), not create().
  if (!prfBytes) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ id: cred.rawId, type: 'public-key' }],
        userVerification: 'required',
        extensions: { prf: { eval: { first: salt } } },
      },
    })
    prfBytes = assertion?.getClientExtensionResults()?.prf?.results?.first
  }

  if (!prfBytes) {
    throw new Error("Your device doesn't support the fingerprint unlock feature (no PRF support).")
  }

  const key = await deriveKeyFromPRF(prfBytes)
  const iv = randomBytes(12)
  const enc = new TextEncoder().encode(masterPassword)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc)

  return {
    credentialId: toB64(cred.rawId),
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(ciphertext),
  }
}

// Prompts the fingerprint/Face ID sensor and returns the decrypted master password.
export async function unlockWithBiometric(stored) {
  if (!isWebAuthnAvailable()) {
    throw new Error("This browser doesn't support fingerprint/Face ID unlock.")
  }

  const credentialId = fromB64(stored.credentialId)
  const salt = fromB64(stored.salt)

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: salt } } },
    },
  })

  const prfBytes = assertion?.getClientExtensionResults()?.prf?.results?.first
  if (!prfBytes) throw new Error('Fingerprint unlock failed on this device.')

  const key = await deriveKeyFromPRF(prfBytes)
  const iv = fromB64(stored.iv)
  const data = fromB64(stored.data)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plaintext)
}
