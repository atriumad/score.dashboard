import { getEntries } from "@/lib/gravity-forms"
import { requireAuth } from "@/lib/auth"
import { buildCareerApplication } from "@/lib/extract"
import { getStatuses } from "@/lib/status"
import type { CareerApplication } from "@/lib/types"
import type { HiringStage } from "@/lib/stages"
import { ApplicationFilters } from "@/components/application-filters"
import { StatsCards } from "@/components/stats-cards"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const authed = await requireAuth()
  if (!authed) {
    redirect("/login")
  }

  let error: string | null = null
  let applications: CareerApplication[] = []
  let statuses: Record<string, HiringStage> = {}

  try {
    const entries = await getEntries()
    applications = entries.map(buildCareerApplication)
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load applications"
  }

  try {
    statuses = await getStatuses()
  } catch {
    statuses = {}
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Applications" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Applications dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                {applications.length} total
              </p>
            </div>
            <StatsCards applications={applications} />
            <ApplicationFilters
              applications={applications}
              statuses={statuses}
            />
          </div>
        )}
      </main>
    </div>
  )
}
