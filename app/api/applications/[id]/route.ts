import { NextRequest, NextResponse } from "next/server"
import { getEntry } from "@/lib/gravity-forms"
import { requireAuth } from "@/lib/auth"
import { buildCareerApplication, collectFields } from "@/lib/extract"
import { formIdFor } from "@/lib/forms"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await requireAuth()
  if (!authed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  try {
    const formId = formIdFor("hiring")
    if (!formId) throw new Error("Falta la variable de entorno GF_FORM_ID")
    const entry = await getEntry(id, formId)
    const application = buildCareerApplication(entry)
    const fields = collectFields(entry)

    return NextResponse.json({ application, fields })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener la aplicación"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
