import { normalizeHiringStage, type HiringStage } from "./stages"

const STATUS_KEY = "job_statuses"

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
export async function getStatuses(): Promise<Record<string, HiringStage>> {
  const result = await redis(["HGETALL", STATUS_KEY])
  const out: Record<string, HiringStage> = {}
  if (result == null) {
    return out
  }
  if (Array.isArray(result)) {
    for (let i = 0; i + 1 < result.length; i += 2) {
      out[String(result[i])] = normalizeHiringStage(String(result[i + 1]))
    }
  } else if (typeof result === "object") {
    for (const [k, v] of Object.entries(result as Record<string, unknown>)) {
      out[k] = normalizeHiringStage(typeof v === "string" ? v : null)
    }
  }
  return out
}

export async function setStatus(
  entryId: string,
  stage: HiringStage
): Promise<void> {
  await redis(["HSET", STATUS_KEY, entryId, stage])
}
