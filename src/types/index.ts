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
  tags?: string
  hearted?: boolean
  archived?: boolean
  archivedAt?: string | null
}

export type CalendarView = "month" | "week" | "list"

export interface EventFilter {
  category?: string
  search?: string
  startDate?: string
  endDate?: string
  source?: string
}

export interface PlatformSettings {
  id: string
  platformName: string
  logoUrl: string | null
  primaryColor: string
  privacyPolicyUrl: string | null
  termsUrl: string | null
  customPrivacyText: string | null
  customTermsText: string | null
}

export const DEFAULT_PLATFORM: PlatformSettings = {
  id: "singleton",
  platformName: "DS EventHub",
  logoUrl: null,
  primaryColor: "indigo",
  privacyPolicyUrl: null,
  termsUrl: null,
  customPrivacyText: null,
  customTermsText: null,
}

export interface NotificationPreference {
  id: string
  channel: "email" | "slack" | "discord" | "webhook"
  target: string
  remindBefore: number
  enabled: boolean
}
