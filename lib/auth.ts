import { cookies } from "next/headers"
import { cache } from "react"
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createToken,
  tokenIsValid,
} from "./session-sign"

export async function createSession(): Promise<void> {
  const token = await createToken()
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return false
  return tokenIsValid(token)
}

export async function login(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUser = process.env.DASHBOARD_USER ?? "admin"
  const expectedPass = process.env.DASHBOARD_PASSWORD

  if (!expectedPass) {
    throw new Error("Falta la variable de entorno DASHBOARD_PASSWORD")
  }

  if (username !== expectedUser) return false

  const a = new TextEncoder().encode(password)
  const b = new TextEncoder().encode(expectedPass)
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

export const requireAuth = cache(async () => {
  const authed = await isAuthenticated()
  return authed
})

export { SESSION_COOKIE }
