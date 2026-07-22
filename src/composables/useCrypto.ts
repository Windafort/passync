const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 16
const IV_LENGTH = 12

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes)
  const chunk = 0x8000
  const parts: string[] = []
  for (let i = 0; i < arr.length; i += chunk) {
    parts.push(String.fromCharCode(...arr.subarray(i, i + chunk)))
  }
  return btoa(parts.join(''))
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  usage: KeyUsage
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  )
}

export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt, 'encrypt')
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, SALT_LENGTH)
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)
  return bytesToBase64(combined)
}

export async function decrypt(encoded: string, passphrase: string): Promise<string | null> {
  try {
    const combined = base64ToBytes(encoded)
    if (combined.length < SALT_LENGTH + IV_LENGTH + 1) return null
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)
    const key = await deriveKey(passphrase, salt, 'decrypt')
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}
