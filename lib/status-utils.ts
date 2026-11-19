import { parseGfDate } from "./dates"

export const NEW_WINDOW_MS = 24 * 60 * 60 * 1000

export type DefaultApplicationStatus = "received" | "new"

export function deriveDefaultStatus(
  dateCreated: string,
  now = new Date()
): DefaultApplicationStatus {
  const age = now.getTime() - parseGfDate(dateCreated).getTime()
  return age <= NEW_WINDOW_MS ? "new" : "received"
}