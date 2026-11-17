/** Binary-safe base64 / UTF-8 helpers for the E2EE layer. */

export function abToB64(ab: ArrayBuffer): string {
  const bytes = new Uint8Array(ab)
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, bytes.length)
    let part = ''
    for (let j = i; j < end; j++) part += String.fromCharCode(bytes[j])
    s += part
  }
  return btoa(s)
}

export function b64ToAb(b64: string): ArrayBuffer {
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** libsignal encrypt() returns a JS binary string — transport it as base64. */
export function binStrToB64(s: string): string {
  return btoa(s)
}

export function b64ToBinStr(b64: string): string {
  return atob(b64)
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function utf8ToAb(s: string): ArrayBuffer {
  const u8 = encoder.encode(s)
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

export function abToUtf8(ab: ArrayBuffer): string {
  return decoder.decode(ab)
}
