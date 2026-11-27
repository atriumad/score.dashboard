"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import {
  RANGE_KEYS,
  RANGE_LABELS,
  parseRange,
  rangeBounds,
  type Bounds,
  type RangeKey,
} from "@/lib/range"
import { cn } from "cn"

/** The range chosen in the URL (?range=30d), shared by every page. */
export function useRange(): { key: RangeKey; bounds: Bounds } {
  const params = useSearchParams()
  const key = parseRange(params.get("range"))
  // Recomputed per range change only, so "now" stays stable while filtering.
  const bounds = useMemo(() => rangeBounds(key), [key])
  return { key, bounds }
}

/** Sets one search param, keeping the others, without scrolling. */
export function useSetParam() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  return (name: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value === null) next.delete(name)
    else next.set(name, value)
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
}

export function RangePicker({ className }: { className?: string }) {
  const { key } = useRange()
  const setParam = useSetParam()
  return (
    <Segmented
      label="Date range"
      className={className}
      value={key}
      options={RANGE_KEYS.map((k) => ({ value: k, label: RANGE_LABELS[k] }))}
      onChange={(v) => setParam("range", v)}
    />
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-lg border bg-card p-0.5 text-xs",
        className
      )}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Which view a section shows (?view=board), defaulting to the first option. */
export function useView<T extends string>(options: readonly T[]): [T, (v: T) => void] {
  const params = useSearchParams()
  const setParam = useSetParam()
  const raw = params.get("view")
  const view = (options as readonly string[]).includes(raw ?? "") ? (raw as T) : options[0]
  return [view, (v: T) => setParam("view", v === options[0] ? null : v)]
}
