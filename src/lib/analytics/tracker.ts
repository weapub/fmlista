import { ANALYTICS_EVENTS, AnalyticsBaseEventProps, AnalyticsEventName } from '@/lib/analytics/events'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }
}

const SESSION_STORAGE_KEY = 'analytics_session_id'

const createSessionId = () => `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server'
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing
  const next = createSessionId()
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next)
  return next
}

const getDefaultProps = (): AnalyticsBaseEventProps => {
  if (typeof window === 'undefined') return {}
  return {
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
    referrer: document.referrer || undefined,
    session_id: getSessionId(),
  }
}

export const trackEvent = (eventName: AnalyticsEventName | string, props: AnalyticsBaseEventProps = {}) => {
  const payload = {
    event: eventName,
    ...getDefaultProps(),
    ...props,
    timestamp: new Date().toISOString(),
  }

  if (typeof window === 'undefined') return

  if (window.gtag) {
    window.gtag('event', eventName, payload)
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload)
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', payload)
  }
}

export const trackPageView = (props: AnalyticsBaseEventProps = {}) => {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, props)
}
