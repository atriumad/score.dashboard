"use client"

import { Button } from "@/components/ui/button"

export const PAGE = 50

export function ShowMore({
  shown,
  total,
  onMore,
}: {
  shown: number
  total: number
  onMore: () => void
}) {
  if (total <= shown) return null
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">
        Showing {shown} of {total}
      </p>
      <Button variant="outline" onClick={onMore}>
        Show more
      </Button>
    </div>
  )
}
