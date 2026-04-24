import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { optimizeSupabaseImageUrl } from './lib/imageOptimization'

const CACHE_BUST_SIGNAL_KEY = 'cache_bust_token'
const CACHE_BUST_SEEN_KEY = 'app_cache_bust_seen'
const CACHE_BUST_RELOAD_GUARD_KEY = 'app_cache_bust_reloaded'

const preloadHeroImageFromCache = () => {
  if (typeof window === 'undefined') return

  try {
    const heroUrl = window.localStorage.getItem('app_hero_image_url')
    if (!heroUrl) return
    const preloadUrl = optimizeSupabaseImageUrl(heroUrl, { width: 1280, quality: 72 }) || heroUrl

    const existing = document.querySelector(`link[rel="preload"][as="image"][href="${preloadUrl}"]`)
    if (existing) return

    const preload = document.createElement('link')
    preload.rel = 'preload'
    preload.as = 'image'
    preload.href = preloadUrl
    preload.setAttribute('fetchpriority', 'high')
    document.head.appendChild(preload)
  } catch {
    // ignore preload cache errors
  }
}

const applyCacheBustSignal = async () => {
  if (typeof window === 'undefined') return

  try {
    const { fetchAppSettings } = await import('./lib/publicSupabase')
    const settings = await fetchAppSettings([CACHE_BUST_SIGNAL_KEY])
    const incomingToken = settings[CACHE_BUST_SIGNAL_KEY]

    if (!incomingToken) return

    const seenToken = window.localStorage.getItem(CACHE_BUST_SEEN_KEY)
    if (seenToken === incomingToken) return

    const lastReloadedToken = window.sessionStorage.getItem(CACHE_BUST_RELOAD_GUARD_KEY)
    if (lastReloadedToken === incomingToken) {
      window.localStorage.setItem(CACHE_BUST_SEEN_KEY, incomingToken)
      return
    }

    if ('caches' in window) {
      const cacheKeys = await window.caches.keys()
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)))
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    window.localStorage.setItem(CACHE_BUST_SEEN_KEY, incomingToken)
    window.sessionStorage.setItem(CACHE_BUST_RELOAD_GUARD_KEY, incomingToken)
    window.location.reload()
  } catch (error) {
    console.error('Cache bust sync failed:', error)
  }
}

const registerServiceWorkerDeferred = () => {
  if (typeof window === 'undefined') return

  const runRegistration = async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({ immediate: false })
    } catch (error) {
      console.error('SW registration failed:', error)
    }
  }

  let executed = false
  const schedule = () => {
    if (executed) return
    executed = true

    detachInteractionListeners()

    const idle = (globalThis as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    if (idle) {
      idle(() => {
        void runRegistration()
      })
      return
    }

    setTimeout(() => {
      void runRegistration()
    }, 1200)
  }

  const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
  const onFirstInteraction = () => schedule()
  const detachInteractionListeners = () => {
    interactionEvents.forEach((eventName) => {
      window.removeEventListener(eventName, onFirstInteraction)
    })
  }

  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, onFirstInteraction, { once: true, passive: true })
  })

  // Fallback tardío para no afectar el LCP ni la cadena crítica inicial.
  const delayedFallback = () => {
    setTimeout(schedule, 60000)
  }

  if (document.readyState === 'complete') delayedFallback()
  else window.addEventListener('load', delayedFallback, { once: true })
}

preloadHeroImageFromCache()
void applyCacheBustSignal()
registerServiceWorkerDeferred()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
