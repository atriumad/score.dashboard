import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { buildSubscriber } from "@/lib/extract"
import { loadSection } from "@/lib/sections"
import { NewsletterList } from "@/components/newsletter-list"
import { SectionShell } from "@/components/section-shell"

export const dynamic = "force-dynamic"

export default async function NewsletterPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { entries, error } = await loadSection("newsletter")

  return (
    <SectionShell title="Newsletter subscribers" count={entries.length} error={error}>
      <NewsletterList subscribers={entries.map(buildSubscriber)} />
    </SectionShell>
  )
}
