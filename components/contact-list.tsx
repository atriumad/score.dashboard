"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PAGE, ShowMore } from "@/components/show-more"
import { formatReceived } from "@/lib/format"
import type { ContactMessage } from "@/lib/types"

export function ContactList({ messages }: { messages: ContactMessage[] }) {
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    )
  }, [messages, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
          placeholder="Search by name, email or message…"
          aria-label="Search messages"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {messages.length === 0
            ? "No contact messages yet."
            : "No messages match this search."}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {filtered.slice(0, limit).map((m) => (
            <li key={m.entry.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-medium">{m.name || "—"}</span>
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="text-sm break-all text-brand-blue hover:underline"
                    >
                      {m.email}
                    </a>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {m.phone}
                    </a>
                  )}
                  {m.optIn && <Badge variant="secondary">Opted in to news</Badge>}
                </div>
                <time
                  dateTime={m.entry.date_created}
                  className="text-xs text-muted-foreground"
                >
                  {formatReceived(m.entry.date_created)}
                </time>
              </div>
              {m.message && (
                <p className="max-w-[75ch] text-sm whitespace-pre-wrap text-foreground/90">
                  {m.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <ShowMore
        shown={Math.min(limit, filtered.length)}
        total={filtered.length}
        onMore={() => setLimit(limit + PAGE)}
      />
    </div>
  )
}
