import { getEntries } from "@/lib/gravity-forms"
import { requireAuth } from "@/lib/auth"
import { buildCareerApplication } from "@/lib/extract"
import { getStatuses } from "@/lib/status"
import type { CareerApplication } from "@/lib/types"
import type { Stage } from "@/lib/stages"
import { formIdFor } from "@/lib/forms"
import { ApplicationFilters } from "@/components/application-filters"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function HiringPage() {
  const authed = await requireAuth()
  if (!authed) {
    redirect("/login")
  }

  let error: string | null = null
  let applications: CareerApplication[] = []
  let statuses: Record<string, Stage> = {}

  try {
    const formId = formIdFor("hiring")
    if (!formId) throw new Error("Falta la variable de entorno GF_FORM_ID")
    const entries = await getEntries(formId)
    applications = entries.map(buildCareerApplication)
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load applications"
  }

  try {
    statuses = await getStatuses("hiring")
  } catch {
    statuses = {}
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Hiring
              </h1>
              <p className="text-sm text-muted-foreground">
                {applications.length} total
              </p>
            </div>
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
