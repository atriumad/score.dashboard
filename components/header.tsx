"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/applications", label: "Hiring" },
  { href: "/events", label: "Event leads" },
  { href: "/contact", label: "Contact" },
  { href: "/newsletter", label: "Newsletter" },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  // The chosen date range follows you from section to section.
  const range = params.get("range")
  const suffix = range ? `?range=${encodeURIComponent(range)}` : ""

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy text-white">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <span className="shrink-0 text-sm font-bold tracking-[0.22em] text-white uppercase">
          Score<span className="text-gold">USA</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-white/85 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-3.5" />
          Log out
        </Button>
      </div>
      <nav
        aria-label="Sections"
        className="flex gap-1 overflow-x-auto px-2 sm:px-4"
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={`${item.href}${suffix}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-gold text-white"
                  : "border-transparent text-white/65 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
