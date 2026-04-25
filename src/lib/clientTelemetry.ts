type ReportPayload = {
  source: string
  message: string
  stack?: string
  metadata?: Record<string, unknown>
}

const LOG_ENDPOINT = '/api/client-log'
const MAX_REPORTS_PER_SESSION = 20
let sentReports = 0

const canReport = () => {
  if (typeof window === 'undefined') return false
  if (sentReports >= MAX_REPORTS_PER_SESSION) return false
  sentReports += 1
  return true
}

export const reportClientError = (payload: ReportPayload) => {
  if (!canReport()) return

  const body = JSON.stringify({
    ...payload,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(LOG_ENDPOINT, blob)
      return
    }
  } catch {
    // Ignore and fallback to fetch
  }

  void fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Avoid console noise for telemetry failures.
  })
}

export const installGlobalErrorReporter = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    const target = event.target as EventTarget | null
    const htmlTarget = target instanceof HTMLElement ? target : null
    const isResourceError = !!htmlTarget

    reportClientError({
      source: isResourceError ? 'window-resource-error' : 'window-error',
      message: event.message || 'Unhandled window error',
      stack: event.error?.stack,
      metadata: isResourceError
        ? {
            tagName: htmlTarget?.tagName,
            src: (htmlTarget as HTMLScriptElement | HTMLImageElement | null)?.src,
          }
        : undefined,
    })
  }, true)

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    reportClientError({
      source: 'unhandled-rejection',
      message: reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection'),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}
