"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header({ title }: { title?: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-navy px-4 text-white sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-sm font-bold tracking-[0.22em] text-white uppercase">
          Score<span className="text-gold">USA</span>
        </span>
        {title && (
          <>
            <span className="h-5 w-px shrink-0 bg-white/25" aria-hidden />
            <span className="truncate text-sm font-medium tracking-[0.18em] text-white/90 uppercase">
              {title}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
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
      
    </header>
  )
}
