import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getStatuses, setStatus } from "@/lib/status"
import { isPipelineKind, isStage } from "@/lib/stages"

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return unauthorized()
  }
  const kind = new URL(req.url).searchParams.get("kind") ?? "hiring"
  if (!isPipelineKind(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }
  try {
    const statuses = await getStatuses(kind)
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

  let body: { entryId?: unknown; status?: unknown; kind?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const entryId = body.entryId
  const status = body.status
  const kind = body.kind ?? "hiring"

  if (!isPipelineKind(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }

  if (typeof entryId !== "string" || /^\d+$/.test(entryId) === false) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 })
  }
  if (!isStage(kind, status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  try {
    await setStatus(kind, entryId, status)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KV error" },
      { status: 500 }
    )
  }
}