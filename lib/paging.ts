export interface Page<T> {
  total_count?: number
  entries: T[]
}

/**
 * Reads a paged listing to the end. The first page says how many entries
 * exist; the remaining pages are fetched in parallel and kept in page order.
 * `maxPages` bounds the work if the total is unexpectedly large.
 */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  pageSize: number,
  maxPages = 25
): Promise<T[]> {
  const first = await fetchPage(1)
  const firstEntries = Array.isArray(first.entries) ? first.entries : []
  const total = Number(first.total_count) || firstEntries.length
  const pages = Math.min(Math.ceil(total / pageSize), maxPages)
  if (pages <= 1) return firstEntries

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2))
  )
  return firstEntries.concat(
    ...rest.map((p) => (Array.isArray(p.entries) ? p.entries : []))
  )
}
