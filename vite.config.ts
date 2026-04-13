import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
// import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('@supabase/supabase-js')) return 'vendor-supabase'
            if (id.includes('react-router-dom')) return 'vendor-router'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            return 'vendor'
          }
        }
      }
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'fm-lista-logo.svg'],
      manifest: {
        name: 'FM Lista - Radios de Formosa',
        short_name: 'FM Lista',
        description: 'Todas las radios de Formosa en un solo lugar',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        id: '/',
        icons: [
          {
            src: 'fm-lista-logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'FM Lista Desktop'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'FM Lista Mobile'
          }
        ]
      },
      workbox: {
        // Allow precaching larger bundles (vendor chunk can exceed 2 MiB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache Supabase Storage Images (logos, covers)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    /*
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    */
    tsconfigPaths(),
    {
      name: 'api-nowplaying',
      configureServer(server) {
        server.middlewares.use('/api/nowplaying', async (req, res, next) => {
          try {
            const urlObj = new URL(req.url || '', `http://${req.headers.host}`)
            const stream = urlObj.searchParams.get('stream')
            
            if (!stream) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing stream' }))
              return
            }

            const u = new URL(stream)
            const origin = `${u.protocol}//${u.host}`
            // Clean trailing ; and / for metadata lookup to build clean paths
            const mount = u.pathname.replace(/;$/, '').replace(/\/$/, '')
            
            const candidates = [
              `${origin}${mount}/status-json.xsl`,
              `${origin}/status-json.xsl`,
              `${origin}${mount}/currentsong`,
              `${origin}/currentsong`,
              `${origin}/status.xsl`,
              ...(mount ? [`${origin}${mount}/status.xsl`] : [])
            ]
            
            if (process.env.NODE_ENV === 'development') {
              process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
            }

            // Realizar peticiones concurrentes para reducir latencia
            const results = await Promise.allSettled(candidates.map(async (url) => {
              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 2500)
                
                const r = await fetch(url, { signal: controller.signal })
                clearTimeout(timeoutId)
                
                if (!r.ok) return null
                
                const contentType = r.headers.get('content-type') || ''
                if (contentType.includes('audio/') || contentType.includes('video/') || contentType.includes('application/ogg')) {
                  return null
                }
                
                const text = await r.text()
                let extractedTitle = ''
                
                if (url.endsWith('status-json.xsl')) {
                  try {
                    const json = JSON.parse(text)
                    const src = json.icestats?.source
                    if (Array.isArray(src)) {
                      const match = src.find((s: any) => s.listenurl?.includes(mount) || s.server_name)
                      extractedTitle = match?.title || match?.server_name || ''
                    } else if (src) {
                      extractedTitle = src.title || src.server_name || ''
                    }
                  } catch {}
                } else if (url.includes('currentsong')) {
                  extractedTitle = text.trim()
                } else if (url.endsWith('status.xsl')) {
                  const m = text.match(/Current Song:\s*<[^>]*>([^<]+)<\/[^>]*>/i) || text.match(/Stream Title:\s*([^\n<]+)/i)
                  extractedTitle = (m && m[1]?.trim()) || ''
                }
                
                return extractedTitle
              } catch {
                return null
              }
            }))

            const title = results
              .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
              .map(r => r.value)[0] || ''
            
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ title }))
          } catch (e) {
            console.error(e)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to resolve now playing' }))
          }
        })
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://fmlista.vercel.app',
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.url?.startsWith('/api/nowplaying')) {
            return req.url
          }
        }
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
