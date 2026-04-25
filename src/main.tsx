import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { optimizeSupabaseImageUrl } from './lib/imageOptimization'

const CACHE_BUST_SIGNAL_KEY = 'cache_bust_token'
const CACHE_BUST_SEEN_KEY = 'app_cache_bust_seen'
const CACHE_BUST_RELOAD_GUARD_KEY = 'app_cache_bust_reloaded'
const CHUNK_RECOVERY_KEY = 'app_chunk_recovery_attempted'

const isIOSBrowser = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/i.test(ua)
}

const recoverFromChunkLoadFailure = () => {
  if (typeof window === 'undefined') return
  try {
    const alreadyTried = window.sessionStorage.getItem(CHUNK_RECOVERY_KEY)
    if (alreadyTried) return
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
    window.location.reload()
  } catch {
    window.location.reload()
  }
}

const installRuntimeRecoveryHandlers = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    recoverFromChunkLoadFailure()
  })

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLScriptElement | null
    if (target?.tagName === 'SCRIPT') {
      recoverFromChunkLoadFailure()
    }
  }, true)

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason ?? '')
    if (
      reason.includes('ChunkLoadError') ||
      reason.includes('Loading chunk') ||
      reason.includes('Failed to fetch dynamically imported module')
    ) {
      recoverFromChunkLoadFailure()
    }
  })
}

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

  if (isIOSBrowser()) return

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

const cleanupIOSServiceWorkers = async () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  if (!isIOSBrowser() || !('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  } catch (error) {
    console.error('Failed cleaning iOS service workers:', error)
  }
}

preloadHeroImageFromCache()
installRuntimeRecoveryHandlers()
void cleanupIOSServiceWorkers()
void applyCacheBustSignal()
registerServiceWorkerDeferred()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
