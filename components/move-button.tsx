"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Route } from "@/lib/classify"

/** Moves a contact form message to Events, or back to Contact. */
export function MoveButton({
  entryId,
  to,
  afterMove,
}: {
  entryId: string
  to: Route
  // Where to go after moving (a detail page whose list changed); else reload.
  afterMove?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function move() {
    setBusy(true)
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, route: to }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "Could not move it")
        return
      }
      toast.success(to === "events" ? "Moved to Events" : "Moved to Contact")
      if (afterMove) router.push(afterMove)
      router.refresh()
    } catch {
      toast.error("Connection error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={move} disabled={busy}>
      <ArrowRightLeft className="size-3.5" />
      {to === "events" ? "Move to Events" : "Move to Contact"}
    </Button>
  )
}
