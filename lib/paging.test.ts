import { expect, test } from "bun:test"
import { collectPages } from "./paging"

function source(total: number, pageSize: number) {
  const calls: number[] = []
  const fetchPage = async (page: number) => {
    calls.push(page)
    const start = (page - 1) * pageSize
    const count = Math.max(0, Math.min(pageSize, total - start))
    return {
      total_count: total,
      entries: Array.from({ length: count }, (_, i) => start + i),
    }
  }
  return { calls, fetchPage }
}

test("single page needs one request", async () => {
  const s = source(120, 200)
  expect(await collectPages(s.fetchPage, 200)).toHaveLength(120)
  expect(s.calls).toEqual([1])
})

test("collects every page in order", async () => {
  const s = source(589, 200)
  const all = await collectPages(s.fetchPage, 200)
  expect(all).toHaveLength(589)
  expect(all[0]).toBe(0)
  expect(all[588]).toBe(588)
  expect(s.calls.sort()).toEqual([1, 2, 3])
})

test("empty form returns nothing", async () => {
  const s = source(0, 200)
  expect(await collectPages(s.fetchPage, 200)).toEqual([])
})

test("stops at the page cap", async () => {
  const s = source(10_000, 200)
  const all = await collectPages(s.fetchPage, 200, 5)
  expect(all).toHaveLength(1000)
})

test("missing total_count falls back to the first page", async () => {
  const all = await collectPages(
    async () => ({ entries: [1, 2] }) as { total_count?: number; entries: number[] },
    200
  )
  expect(all).toEqual([1, 2])
})
