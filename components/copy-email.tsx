"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      toast.success("Email copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy email")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="size-3.5" />
      {copied ? "Copied" : "Copy email"}
    </Button>
  )
}