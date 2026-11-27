// Which Gravity Forms form feeds each dashboard section.
// Contact and Newsletter default to the ids they have on scoreusa.com.

export type SectionKey = "hiring" | "events" | "contact" | "newsletter"

export const SECTIONS: { key: SectionKey; label: string; href: string }[] = [
  { key: "hiring", label: "Hiring", href: "/" },
  { key: "events", label: "Events", href: "/events" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "newsletter", label: "Newsletter", href: "/newsletter" },
]

export function formIdFor(section: SectionKey): string | null {
  const id = {
    hiring: process.env.GF_FORM_ID,
    events: process.env.GF_EVENTS_FORM_ID,
    contact: process.env.GF_CONTACT_FORM_ID || "2",
    newsletter: process.env.GF_NEWSLETTER_FORM_ID || "1",
  }[section]
  return id && /^\d+$/.test(id.trim()) ? id.trim() : null
}
