"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { formatBucket, type Bucket, type Grain } from "@/lib/range"
import { cn } from "cn"

// Categorical series colors, in fixed order (validated: CVD and normal-vision
// separation pass on the light surface). Two sit below 3:1 contrast, so every
// chart shows its numbers in the legend and offers a table view.
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"] as const

export interface Series {
  key: string
  label: string
  color: string
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

function niceMax(n: number): number {
  if (n <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(n))
  // Steps that halve to whole numbers, so the middle gridline reads cleanly.
  for (const m of [1, 2, 3, 4, 5, 6, 8, 10]) {
    if (m * pow >= n) return m * pow
  }
  return 10 * pow
}

/** Stacked bars over time, one stack per bucket, with hover details and a table view. */
export function TimeBars({
  series,
  buckets,
  grain,
  height = 200,
}: {
  series: Series[]
  buckets: Bucket[]
  grain: Grain
  height?: number
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [hover, setHover] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const totals = buckets.map((b) => series.reduce((s, x) => s + (b.counts[x.key] ?? 0), 0))
  const max = niceMax(Math.max(0, ...totals))
  const seriesTotals = series.map((s) => buckets.reduce((sum, b) => sum + (b.counts[s.key] ?? 0), 0))

  const left = 32
  const bottom = 22
  // room for the top tick's label
  const pad = 8
  const plotW = Math.max(0, width - left)
  const plotH = height - bottom
  const slot = buckets.length ? plotW / buckets.length : 0
  const barW = Math.max(2, Math.min(28, slot * 0.7))
  const y = (v: number) => plotH - (v / max) * (plotH - pad)
  const ticks = Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max]
  // Label every nth bucket so the axis never crowds.
  const every = Math.max(1, Math.ceil(buckets.length / Math.max(1, Math.floor(plotW / 64))))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {series.length > 1 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
            {series.map((s, i) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">{seriesTotals[i]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                {series.map((s) => (
                  <th key={s.key} className="px-3 py-2 text-right font-medium">{s.label}</th>
                ))}
                {series.length > 1 && <th className="px-3 py-2 text-right font-medium">Total</th>}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={b.start.getTime()} className="border-t">
                  <td className="px-3 py-1.5">{formatBucket(b.start, grain)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">{b.counts[s.key] ?? 0}</td>
                  ))}
                  {series.length > 1 && <td className="px-3 py-1.5 text-right tabular-nums">{totals[i]}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" style={{ height }}>
          {width > 0 && (
            <svg width={width} height={height} role="img" aria-label={`${series.map((s) => s.label).join(", ")} over time`} className="block">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={left} x2={width} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-border" strokeWidth={1} />
                  <text x={left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                    {Math.round(t)}
                  </text>
                </g>
              ))}
              {buckets.map((b, i) => {
                const cx = left + slot * i + slot / 2
                const x = cx - barW / 2
                let acc = 0
                const top = y(totals[i])
                const clip = `${uid}bar${i}`
                return (
                  <g key={b.start.getTime()} opacity={hover === null || hover === i ? 1 : 0.45}>
                    <clipPath id={clip}>
                      {/* rounded at the data end only; the baseline end stays square */}
                      <rect x={x} y={top} width={barW} height={plotH - top + 4} rx={Math.min(4, barW / 2)} />
                    </clipPath>
                    <g clipPath={`url(#${clip})`}>
                      {series.map((s) => {
                        const v = b.counts[s.key] ?? 0
                        if (!v) return null
                        const y1 = y(acc + v)
                        const y0 = y(acc)
                        acc += v
                        return (
                          <rect
                            key={s.key}
                            x={x}
                            y={y1}
                            width={barW}
                            height={Math.max(0, y0 - y1)}
                            fill={s.color}
                            stroke="var(--card)"
                            strokeWidth={series.length > 1 ? 1 : 0}
                          />
                        )
                      })}
                    </g>
                    {i % every === 0 && (
                      <text x={cx} y={height - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                        {formatBucket(b.start, grain).replace("Week of ", "")}
                      </text>
                    )}
                    {/* hit target wider and taller than the bar */}
                    <rect
                      x={left + slot * i}
                      y={0}
                      width={slot}
                      height={plotH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    />
                  </g>
                )
              })}
            </svg>
          )}
          {hover !== null && buckets[hover] && (
            <div
              className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
              style={{
                left: Math.min(Math.max(0, left + slot * hover + slot / 2 - 72), Math.max(0, width - 160)),
              }}
            >
              <p className="mb-1 font-medium">{formatBucket(buckets[hover].start, grain)}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span aria-hidden className="size-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="tabular-nums">{buckets[hover].counts[s.key] ?? 0}</span>
                </p>
              ))}
              {series.length > 1 && (
                <p className="mt-1 flex justify-between border-t pt-1 font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{totals[hover]}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Ranked categories as horizontal bars with count and share. */
export function BarList({
  items,
  total,
  empty = "Nothing in this range.",
  limit = 8,
}: {
  items: { label: string; value: number; href?: string }[]
  total?: number
  empty?: string
  limit?: number
}) {
  const shown = [...items].sort((a, b) => b.value - a.value).slice(0, limit)
  const max = Math.max(1, ...shown.map((i) => i.value))
  const sum = total ?? items.reduce((s, i) => s + i.value, 0)
  if (shown.length === 0 || sum === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ul className="space-y-2.5">
      {shown.map((item) => {
        const pct = sum ? Math.round((item.value / sum) * 100) : 0
        const row = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 tabular-nums">
                {item.value}
                <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full"
                style={{ width: `${(item.value / max) * 100}%`, background: SERIES_COLORS[0] }}
              />
            </div>
          </>
        )
        return (
          <li key={item.label} title={`${item.label}: ${item.value} (${pct}%)`}>
            {item.href ? (
              <Link href={item.href} className="block rounded-md hover:bg-muted/50">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
