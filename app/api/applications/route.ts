import { NextResponse } from "next/server"
import { getEntries } from "@/lib/gravity-forms"
import { requireAuth } from "@/lib/auth"
import { buildCareerApplication } from "@/lib/extract"
import { formIdFor } from "@/lib/forms"

export async function GET() {
  const authed = await requireAuth()
  if (!authed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formId = formIdFor("hiring")
    if (!formId) throw new Error("Falta la variable de entorno GF_FORM_ID")
    const entries = await getEntries(formId)
    const applications = entries.map(buildCareerApplication)
    return NextResponse.json({ applications })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener aplicaciones"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
