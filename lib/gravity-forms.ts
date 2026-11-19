import crypto from "node:crypto"
import type { GFEntry } from "./types"

export interface GFEntryListResponse {
  total_count: number
  entries: GFEntry[]
}

const GF_URL = process.env.GF_API_URL
const GF_KEY = process.env.GF_CONSUMER_KEY
const GF_SECRET = process.env.GF_CONSUMER_SECRET
const GF_FORM_ID = process.env.GF_FORM_ID

// RFC 3986 strict percent-encoding (as required by OAuth 1.0a)
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
}

function oauthAuthHeader(method: string, url: string, query: string): string {
  if (!GF_KEY || !GF_SECRET) {
    throw new Error(
      "Faltan variables de entorno GF_CONSUMER_KEY y GF_CONSUMER_SECRET"
    )
  }

  const oauth: Record<string, string> = {
    oauth_consumer_key: GF_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  }

  // Merge OAuth params with the request query params (already encoded)
  const params: Record<string, string> = {}
  for (const key of Object.keys(oauth)) {
    params[key] = oauth[key]
  }
  query.split("&").filter(Boolean).forEach((pair) => {
    const eq = pair.indexOf("=")
    const k = pair.slice(0, eq)
    const v = pair.slice(eq + 1)
    params[k] = v
  })

  // Keys are already in their wire form (query keys arrive percent-encoded,
  // e.g. "paging%5Bpage_size%5D"); re-percentEncoding them would double-encode
  // and invalidate the signature.
  const paramStr = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&")

  const base = [method.toUpperCase(), percentEncode(url), percentEncode(paramStr)].join("&")
  const signingKey = `${percentEncode(GF_SECRET)}&`
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(base)
    .digest("base64")

  return (
    "OAuth " +
    [
      `oauth_consumer_key="${GF_KEY}"`,
      `oauth_nonce="${oauth.oauth_nonce}"`,
      `oauth_signature="${percentEncode(signature)}"`,
      `oauth_signature_method="HMAC-SHA1"`,
      `oauth_timestamp="${oauth.oauth_timestamp}"`,
      `oauth_version="1.0"`,
    ].join(", ")
  )
}

function getBaseUrl(): string {
  if (!GF_URL) {
    throw new Error("Falta la variable de entorno GF_API_URL")
  }
  return GF_URL.replace(/\/$/, "")
}

async function gfFetch(
  path: string,
  query: string
): Promise<Response> {
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(`${url}?${query}`, {
    headers: {
      Authorization: oauthAuthHeader("GET", url, query),
      Accept: "application/json",
      // Sucuri (Cloudproxy) blocks requests with an empty/unknown User-Agent (403), so send a browser UA
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    next: { revalidate: 30 },
  })
  return res
}

export async function getEntries(): Promise<GFEntry[]> {
  if (!GF_FORM_ID) {
    throw new Error("Falta la variable de entorno GF_FORM_ID")
  }

  // _labels=1 and a large page size to fetch all in one request
  const params = new URLSearchParams()
  params.set("_labels", "1")
  params.set("paging[page_size]", "200")
  // URLSearchParams encodes "[ ]" as %5B %5D which is what OAuth needs
  const query = params.toString()

  const res = await gfFetch(`/forms/${GF_FORM_ID}/entries`, query)
  if (!res.ok) {
    throw new Error(`Gravity Forms API error: ${res.status}`)
  }

  const data = (await res.json()) as GFEntryListResponse
  return Array.isArray(data.entries) ? data.entries : []
}

export async function getEntry(id: string): Promise<GFEntry> {
  // Single-entry route is /entries/{id} (not /forms/{formId}/entries/{id});
  // the latter doesn't exist in this GF REST API version.
  const res = await gfFetch(`/entries/${id}`, "_labels=1")
  if (!res.ok) {
    throw new Error(`Gravity Forms API error: ${res.status}`)
  }
  return res.json() as Promise<GFEntry>
}
