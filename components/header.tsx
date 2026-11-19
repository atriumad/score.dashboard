"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SECTIONS } from "@/lib/forms"
import { cn } from "cn"

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/applications")
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-navy text-white">
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
        {SECTIONS.map((section) => {
          const active = isActive(pathname, section.href)
          return (
            <Link
              key={section.key}
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-gold text-white"
                  : "border-transparent text-white/65 hover:text-white"
              )}
            >
              {section.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
