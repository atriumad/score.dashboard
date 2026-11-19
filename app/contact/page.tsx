import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { buildContactMessage } from "@/lib/extract"
import { loadSection } from "@/lib/sections"
import { ContactList } from "@/components/contact-list"
import { SectionShell } from "@/components/section-shell"

export const dynamic = "force-dynamic"

export default async function ContactPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { entries, error } = await loadSection("contact")

  return (
    <SectionShell title="Contact messages" count={entries.length} error={error}>
      <ContactList messages={entries.map(buildContactMessage)} />
    </SectionShell>
  )
}
