export interface EventData {
  id?: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  url?: string
  category?: string
  organizer?: string
  source?: string
  sourceUrl?: string
  isAllDay?: boolean
}

export type CalendarView = "month" | "week" | "list"

export interface EventFilter {
  category?: string
  search?: string
  startDate?: string
  endDate?: string
  source?: string
}
