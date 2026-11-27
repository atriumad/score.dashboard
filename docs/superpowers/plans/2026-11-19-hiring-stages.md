# Hiring Stages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four fixed applicant statuses with a six-stage hiring pipeline, with per-stage counts that filter the table.

**Architecture:** A pure module `lib/stages.ts` owns the stage list, labels, legacy translation and counting. Redis keeps the same hash (`job_statuses`); old values are translated on read, never rewritten. `ApplicationFilters` holds the live stage map so counts follow picker changes.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind 4, shadcn/base-ui, Upstash Redis REST, `bun test`.

**Spec:** `docs/superpowers/specs/2026-11-19-score-events-hiring-design.md` (section "1. Hiring: etapas"). This plan covers hiring only; events and WordPress get their own plan.

## Global Constraints

- Stages, in order: `new`, `reviewing`, `interview`, `offer`, `hired`, `rejected`. Labels: New, Reviewing, Interview, Offer, Hired, Rejected.
- Legacy translation on read: `received → new`, `reviewing → reviewing`, `approved → hired`, `rejected → rejected`. No stored value → `new`.
- Redis hash stays `job_statuses`. No migration writes.
- No new dependencies. UI copy in English.
- `AGENTS.md`: read the relevant guide in `node_modules/next/dist/docs/` before touching Next APIs.

## Review Focus

1. Redis holds a value outside the stage list (typo, future value) → applicant shows as New, page does not crash. *(Task 1 test)*
2. Redis unreachable → dashboard still loads, everyone shows as New. *(existing behavior in `app/page.tsx`; keep the try/catch)*
3. Saving a stage fails → picker and the stage count both go back to the previous stage. *(Task 3 manual check)*
4. Stage filter active and the applicant is moved to another stage → row leaves the list, counts stay correct. *(Task 3 manual check)*
5. Statuses stored for entries no longer returned by Gravity Forms → not counted. *(Task 1 test)*

---

### Task 1: Stage model

**Files:**
- Create: `lib/stages.ts`, `lib/stages.test.ts`
- Modify: `tsconfig.json` (add `"**/*.test.ts"` to `exclude` so `next build` skips `bun:test` imports)

**Interfaces — Produces:**
```ts
export const HIRING_STAGES: readonly ["new","reviewing","interview","offer","hired","rejected"]
export type HiringStage = (typeof HIRING_STAGES)[number]
export const HIRING_STAGE_LABELS: Record<HiringStage, string>
export function isHiringStage(value: unknown): value is HiringStage
export function normalizeHiringStage(raw: string | null | undefined): HiringStage
export function countByStage(entryIds: string[], stages: Record<string, HiringStage>): Record<HiringStage, number>
```

- [ ] **Step 1:** Run `bun install`.
- [ ] **Step 2: Write failing tests** in `lib/stages.test.ts`:

```ts
test("legacy values translate", () => {
  expect(normalizeHiringStage("received")).toBe("new")
  expect(normalizeHiringStage("approved")).toBe("hired")
  expect(normalizeHiringStage("reviewing")).toBe("reviewing")
  expect(normalizeHiringStage("rejected")).toBe("rejected")
})
test("current values pass through", () => {
  for (const s of HIRING_STAGES) expect(normalizeHiringStage(s)).toBe(s)
})
test("missing or unknown values become new", () => {
  expect(normalizeHiringStage(null)).toBe("new")
  expect(normalizeHiringStage(undefined)).toBe("new")
  expect(normalizeHiringStage("")).toBe("new")
  expect(normalizeHiringStage("banana")).toBe("new")
})
test("counts only listed entries, unlisted default to new", () => {
  const counts = countByStage(["1", "2", "3"], { "1": "hired", "2": "offer", "99": "hired" })
  expect(counts).toEqual({ new: 1, reviewing: 0, interview: 0, offer: 1, hired: 1, rejected: 0 })
})
test("isHiringStage rejects legacy and non-strings", () => {
  expect(isHiringStage("offer")).toBe(true)
  expect(isHiringStage("approved")).toBe(false)
  expect(isHiringStage(3)).toBe(false)
})
```

- [ ] **Step 3:** Run `bun test lib/stages.test.ts` → FAIL (module not found).
- [ ] **Step 4:** Implement `lib/stages.ts`. No imports from server-only modules (client components import it).
- [ ] **Step 5:** Run `bun test lib/stages.test.ts` → 5 pass.
- [ ] **Step 6:** Commit `feat: add hiring stage model`.

### Task 2: Storage and API speak stages

**Files:**
- Modify: `lib/status.ts`, `app/api/status/route.ts`, `lib/types.ts`
- Delete: `lib/status-utils.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `getStatuses(): Promise<Record<string, HiringStage>>` (values already normalized); `setStatus(entryId: string, stage: HiringStage): Promise<void>` (always `HSET`). `POST /api/status` body `{ entryId: string, status: HiringStage }`; any other `status`, including `null` and legacy values, → 400 `Invalid status`.

- [ ] **Step 1:** `getStatuses` runs every value through `normalizeHiringStage`; `setStatus` drops the `null`/`HDEL` branch; remove `STATUS_VALUES`.
- [ ] **Step 2:** Route validates with `isHiringStage`.
- [ ] **Step 3:** Remove `ApplicationStatus` from `lib/types.ts`; delete `lib/status-utils.ts`.
- [ ] **Step 4:** Commit with Task 3 (tree does not type-check until the UI is updated).

### Task 3: Stage UI

**Files:**
- Create: `components/stage-summary.tsx`
- Rename + modify: `components/status-picker.tsx` → `components/stage-picker.tsx`
- Modify: `components/application-filters.tsx`, `components/application-table.tsx`, `app/page.tsx`, `app/applications/[id]/page.tsx`

**Interfaces:**
```ts
// stage-picker.tsx — keeps its own optimistic state, reverts on failed save
StagePicker({ entryId: string, value: HiringStage, onStageChange?: (stage: HiringStage) => void })
// stage-summary.tsx
StageSummary({ counts: Record<HiringStage, number>, active: HiringStage | null, onSelect: (stage: HiringStage | null) => void })
// application-table.tsx
ApplicationTable({ applications, stages: Record<string, HiringStage>, onStageChange: (entryId: string, stage: HiringStage) => void })
```

- [ ] **Step 1: `StagePicker`.** Six options in pipeline order, no "Reset to default". On failed save: toast, restore previous stage, call `onStageChange(previous)`. Dot colors: new `bg-gold`, reviewing `bg-amber-500`, interview `bg-sky-500`, offer `bg-violet-500`, hired `bg-emerald-500`, rejected `bg-red-500`.
- [ ] **Step 2: `StageSummary`.** One button per stage in pipeline order showing dot, label and count; `aria-pressed` on the active one; clicking the active stage calls `onSelect(null)`. Wraps on narrow screens.
- [ ] **Step 3: `ApplicationFilters`.** Holds `stages` state seeded from the `statuses` prop and `stage` filter state. Counts come from `countByStage` over applications matching search and area (not the stage filter), so the row always shows where the current search sits in the pipeline. Renders `StageSummary` above the search row. Column header "Status" → "Stage".
- [ ] **Step 4: Detail page.** Fetch statuses alongside the entry (failure → `new`) and render `StagePicker` beside the action buttons.
- [ ] **Step 5:** `bun run lint` and `bunx tsc --noEmit` → clean. `bun test` → pass.
- [ ] **Step 6: Manual check** with `bun dev` against real data: legacy statuses land in the translated stage; changing a stage updates counts and survives reload; stage filter + move removes the row; with the network offline the picker and count revert.
- [ ] **Step 7:** Commit `feat: hiring pipeline stages with per-stage counts`.

### Task 4: Ship

- [ ] **Step 1:** `bun run build` → succeeds.
- [ ] **Step 2:** Deploy to Vercel only after Ventura's go-ahead.
