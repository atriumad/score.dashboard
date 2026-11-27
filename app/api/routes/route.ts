import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { isRoute } from "@/lib/classify"
import { setRoute } from "@/lib/status"

// Moves one contact form message to Events or back to Contact.
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { entryId?: unknown; route?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (typeof body.entryId !== "string" || !/^\d+$/.test(body.entryId)) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 })
  }
  if (!isRoute(body.route)) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 })
  }

  try {
    await setRoute(body.entryId, body.route)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KV error" },
      { status: 500 }
    )
  }
}
