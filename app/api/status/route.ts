import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getStatuses, setStatus } from "@/lib/status"
import { isHiringStage } from "@/lib/stages"

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return unauthorized()
  }
  try {
    const statuses = await getStatuses()
    return NextResponse.json({ statuses })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KV error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return unauthorized()
  }

  let body: { entryId?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const entryId = body.entryId
  const status = body.status

  if (typeof entryId !== "string" || /^\d+$/.test(entryId) === false) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 })
  }
  if (!isHiringStage(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  try {
    await setStatus(entryId, status)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KV error" },
      { status: 500 }
    )
  }
}