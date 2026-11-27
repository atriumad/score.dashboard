const SESSION_COOKIE = "job_dashboard_session"
const SESSION_DAYS = 7

export function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("Falta la variable de entorno AUTH_SECRET")
  }
  return secret
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function hmacHex(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  )
  return toHex(sig)
}

async function verify(value: string, signature: string): Promise<boolean> {
  const expected = await hmacHex(value)
  const sigHex = signature
  if (expected.length !== sigHex.length) return false

  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sigHex.charCodeAt(i)
  }
  return diff === 0
}

export async function createToken(): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = `${exp}:${process.env.DASHBOARD_USER ?? "admin"}`
  const signature = await hmacHex(payload)
  return `${payload}.${signature}`
}

export async function tokenIsValid(token: string): Promise<boolean> {
  const dotIndex = token.lastIndexOf(".")
  if (dotIndex === -1) return false

  const payload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)

  if (!(await verify(payload, signature))) return false

  const [expStr] = payload.split(":")
  const exp = Number(expStr)
  if (Number.isNaN(exp) || exp < Date.now()) return false

  return true
}

export { SESSION_COOKIE, SESSION_DAYS }
