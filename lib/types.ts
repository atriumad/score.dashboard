export interface GFEntry {
  id: number
  form_id: number
  date_created: string
  date_updated: string
  is_starred: string
  is_read: string
  ip: string
  source_url: string
  user_agent: string
  status: string
  [fieldId: string]: string | number | null | undefined
}

export interface CareerApplication {
  entry: GFEntry
  name: string
  email: string
  phone: string
  areas: string[]
  cvUrl: string | null
}
