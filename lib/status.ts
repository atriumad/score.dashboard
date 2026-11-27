import { isRoute, type Route } from "./classify"
import { normalizeStage, type PipelineKind, type Stage } from "./stages"

// One Redis hash per pipeline, keyed by entry id. Event inquiries that came
// through the contact form keep their stage in event_statuses too (entry ids
// are unique across forms).
const STATUS_KEYS: Record<PipelineKind, string> = {
  hiring: "job_statuses",
  events: "event_statuses",
}

// Contact messages someone moved by hand: entry id -> "events" | "contact".
const ROUTES_KEY = "contact_routes"

function redisEndpoint(): { url: string; token: string } {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url) {
    throw new Error("Falta la variable de entorno UPSTASH_REDIS_REST_URL")
  }
  if (!token) {
    throw new Error("Falta la variable de entorno UPSTASH_REDIS_REST_TOKEN")
  }
  return { url, token }
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const { url, token } = redisEndpoint()
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Redis request failed: ${res.status}`)
  }
  const data = (await res.json()) as { result?: unknown; error?: string | null }
  if (data.error) {
    throw new Error(`Redis error: ${data.error}`)
  }
  return data.result
}

// Stored values may predate the stage pipeline; they are translated on read
// and never rewritten, so nothing saved by the old dashboard is lost.
// HGETALL answers as [field, value, ...] or as an object, depending on the server.
async function readHash(key: string): Promise<Record<string, string | null>> {
  const result = await redis(["HGETALL", key])
  const out: Record<string, string | null> = {}
  if (Array.isArray(result)) {
    for (let i = 0; i + 1 < result.length; i += 2) {
      out[String(result[i])] = String(result[i + 1])
    }
  } else if (result && typeof result === "object") {
    for (const [k, v] of Object.entries(result as Record<string, unknown>)) {
      out[k] = typeof v === "string" ? v : null
    }
  }
  return out
}

export async function getStatuses(
  kind: PipelineKind
): Promise<Record<string, Stage>> {
  const raw = await readHash(STATUS_KEYS[kind])
  const out: Record<string, Stage> = {}
  for (const [id, value] of Object.entries(raw)) {
    out[id] = normalizeStage(kind, value)
  }
  return out
}

export async function getRoutes(): Promise<Record<string, Route>> {
  const raw = await readHash(ROUTES_KEY)
  const out: Record<string, Route> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (isRoute(value)) out[id] = value
  }
  return out
}

export async function setRoute(entryId: string, route: Route): Promise<void> {
  await redis(["HSET", ROUTES_KEY, entryId, route])
}

export async function setStatus(
  kind: PipelineKind,
  entryId: string,
  stage: Stage
): Promise<void> {
  await redis(["HSET", STATUS_KEYS[kind], entryId, stage])
}
