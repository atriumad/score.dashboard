"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { ApplicationStatus } from "@/lib/types"
import { cn } from "cn"

const LABELS: Record<ApplicationStatus, string> = {
  received: "Received",
  new: "New",
  rejected: "Rejected",
  reviewing: "In review",
  approved: "Approved",
}

const DOT_CLASSES: Record<ApplicationStatus, string> = {
  received: "bg-sky-400",
  new: "bg-gold",
  rejected: "bg-red-500",
  reviewing: "bg-amber-500",
  approved: "bg-emerald-500",
}

const TEXT_CLASSES: Record<ApplicationStatus, string> = {
  received: "text-sky-600",
  new: "text-yellow-700",
  rejected: "text-red-600",
  reviewing: "text-amber-600",
  approved: "text-emerald-600",
}

const ORDER: ApplicationStatus[] = [
  "received",
  "reviewing",
  "approved",
  "rejected",
]

export function StatusPicker({
  entryId,
  value,
  defaultStatus,
  onStatusChange,
}: {
  entryId: string
  value: ApplicationStatus | null
  defaultStatus: "received" | "new"
  onStatusChange?: (status: ApplicationStatus | null) => void
}) {
  const [status, setStatus] = useState<ApplicationStatus>(
    value ?? defaultStatus
  )
  const [saving, setSaving] = useState(false)

  async function handleChange(next: string | null) {
    const nextStatus = (
      next === "" || next === null ? null : next
    ) as ApplicationStatus | null
    setStatus(nextStatus ?? defaultStatus)
    onStatusChange?.(nextStatus)
    setSaving(true)
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, status: nextStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? "Could not update status")
        setStatus(value ?? defaultStatus)
        onStatusChange?.(value)
      }
    } catch {
      toast.error("Connection error")
      setStatus(value ?? defaultStatus)
      onStatusChange?.(value)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger
        disabled={saving}
        className={cn(
          "h-7 w-full min-w-28 gap-1.5 rounded-md border border-border bg-background px-2 text-xs"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            DOT_CLASSES[status]
          )}
        />
        <span className={cn("truncate font-medium", TEXT_CLASSES[status])}>
          {LABELS[status]}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Reset to default</SelectItem>
        {ORDER.map((value) => (
          <SelectItem key={value} value={value}>
            {LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}