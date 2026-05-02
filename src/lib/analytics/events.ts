export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export interface AnalyticsBaseEventProps {
  page_path?: string
  page_title?: string
  referrer?: string
  session_id?: string
  user_id?: string
  [key: string]: string | number | boolean | null | undefined
}
