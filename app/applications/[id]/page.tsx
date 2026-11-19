import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Download, Mail, MailCheck, Phone } from "lucide-react"
import { requireAuth } from "@/lib/auth"
import { getEntry } from "@/lib/gravity-forms"
import { buildCareerApplication } from "@/lib/extract"
import { getStatuses } from "@/lib/status"
import type { Stage } from "@/lib/stages"
import { formIdFor } from "@/lib/forms"
import { StagePicker } from "@/components/stage-picker"
import type { CareerApplication } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { parseGfDate } from "@/lib/dates"
import { CopyEmailButton } from "@/components/copy-email"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "cn"

export const dynamic = "force-dynamic"

function formatDateTime(iso: string): string {
  const d = parseGfDate(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const authed = await requireAuth()
  if (!authed) {
    redirect("/login")
  }

  const { id } = await params

  let application: CareerApplication
  try {
    const formId = formIdFor("hiring")
    if (!formId) throw new Error("Falta la variable de entorno GF_FORM_ID")
    const entry = await getEntry(id, formId)
    application = buildCareerApplication(entry)
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("404")) {
      notFound()
    }
    redirect("/")
  }

  // Same fallback as the list: if Redis is unreachable the page still loads.
  let stage: Stage = "new"
  try {
    stage = (await getStatuses("hiring"))[id] ?? "new"
  } catch {
    stage = "new"
  }

  const mailto = `mailto:${application.email}?subject=${encodeURIComponent(
    "Your application at Score USA"
  )}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-navy px-4 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-bold tracking-[0.22em] text-white uppercase">
            Score<span className="text-gold">USA</span>
          </span>
          <span className="h-5 w-px shrink-0 bg-white/25" aria-hidden />
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white/85 hover:bg-white/10 hover:text-white"
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {application.name}
            </h1>
            <p className="text-muted-foreground">
              Received&nbsp;
              <time dateTime={application.entry.date_created}>
                {formatDateTime(application.entry.date_created)}
              </time>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="w-36">
              <StagePicker kind="hiring" entryId={id} value={stage} />
            </div>
            {application.cvUrl && (
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "default" })}
              >
                <Download className="size-3.5" />
                View Resume
              </a>
            )}
            <a
              href={mailto}
              className={buttonVariants({ variant: "outline" })}
            >
              <Mail className="size-3.5" />
              Email candidate
            </a>
            {application.email && (
              <CopyEmailButton email={application.email} />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                <a
                  href={mailto}
                  className="break-all text-brand-blue hover:underline"
                >
                  {application.email}
                </a>
              </div>
              {application.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-blue" />
                  <span>{application.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {application.areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Area of Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {application.areas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}