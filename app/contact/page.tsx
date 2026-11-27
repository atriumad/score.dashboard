import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { loadInquiries } from "@/lib/inquiries"
import { ContactList } from "@/components/contact-list"
import { SectionShell } from "@/components/section-shell"

export const dynamic = "force-dynamic"

export default async function ContactPage() {
  if (!(await requireAuth())) {
    redirect("/login")
  }

  const { contact, events, contactError } = await loadInquiries()

  return (
    <SectionShell title="Contact messages" count={contact.length} error={contactError}>
      <ContactList
        messages={contact}
        movedToEvents={events.filter((e) => e.source === "contact").length}
      />
    </SectionShell>
  )
}
