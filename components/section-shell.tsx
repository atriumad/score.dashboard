import { Header } from "@/components/header"

export function SectionShell({
  title,
  count,
  error,
  children,
}: {
  title: string
  count?: number
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {count !== undefined && (
                <p className="text-sm text-muted-foreground">{count} total</p>
              )}
            </div>
            {children}
          </div>
        )}
      </main>
    </div>
  )
}
