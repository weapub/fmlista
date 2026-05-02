import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/lib/analytics/tracker'

export const usePageTracking = (pageName: string, extraProps?: Record<string, string | number | boolean>) => {
  const location = useLocation()
  const extraPropsKey = JSON.stringify(extraProps ?? {})

  useEffect(() => {
    trackPageView({
      page_name: pageName,
      page_path: location.pathname + location.search,
      ...extraProps,
    })
  }, [location.pathname, location.search, pageName, extraPropsKey])
}
