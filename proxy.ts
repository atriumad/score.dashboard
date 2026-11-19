import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, tokenIsValid } from "@/lib/session-sign"

const PROTECTED_PREFIXES = ["/api/applications"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/applications")

  if (!needsAuth) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const valid = token ? await tokenIsValid(token) : false

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/applications/:path*",
    "/api/applications/:path*",
  ],
}
