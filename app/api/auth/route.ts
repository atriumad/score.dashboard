import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createSession, destroySession, login } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = typeof body.username === "string" ? body.username : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 }
      )
    }

    const ok = await login(username, password)
    if (!ok) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    await createSession()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al iniciar sesión"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
