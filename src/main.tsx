import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const registerServiceWorkerDeferred = () => {
  if (typeof window === 'undefined') return

  const runRegistration = async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({ immediate: true })
    } catch (error) {
      console.error('SW registration failed:', error)
    }
  }

  const schedule = () => {
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

  if (document.readyState === 'complete') {
    schedule()
  } else {
    window.addEventListener('load', schedule, { once: true })
  }
}

registerServiceWorkerDeferred()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
