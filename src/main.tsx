import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

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

registerServiceWorkerDeferred()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
