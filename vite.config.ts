import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
// import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
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
              `${origin}/status-json.xsl`,
              `${origin}/status.xsl`,
              `${origin}${mount}/currentsong`,
              `${origin}/currentsong`,
              // Add mount specific status if mount exists
              ...(mount ? [`${origin}${mount}/status-json.xsl`, `${origin}${mount}/status.xsl`] : [])
            ]
            
            let title = ''
            // Disable SSL verification for this fetch
            const fetchOptions = {
              agent: undefined, // native fetch doesn't support agent easily without undici, but we can try ignoring errors
              // For Node 18+ native fetch, we can't easily disable SSL verify without global config
            }
            // Hack for dev environment to ignore SSL
            if (process.env.NODE_ENV === 'development') {
              process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
            }

            for (const url of candidates) {
              try {
                // Use a short timeout for the fetch to avoid hanging on streams
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 2000)
                
                const r = await fetch(url, { 
                  ...fetchOptions, 
                  signal: controller.signal 
                })
                clearTimeout(timeoutId)
                
                if (!r.ok) continue
                
                // Check Content-Type to avoid reading audio streams
                const contentType = r.headers.get('content-type') || ''
                if (contentType.includes('audio/') || contentType.includes('video/') || contentType.includes('application/ogg')) {
                  continue
                }
                
                const text = await r.text()
                
                if (url.endsWith('status-json.xsl')) {
                  try {
                    const json = JSON.parse(text)
                    const src = json.icestats?.source
                    if (Array.isArray(src)) {
                      // Try to match by mount point
                      const match = src.find((s: any) => s.listenurl?.includes(mount) || s.server_name)
                      title = match?.title || match?.server_name || ''
                    } else if (src) {
                      title = src.title || src.server_name || ''
                    }
                  } catch {}
                } else if (url.includes('currentsong')) {
                  title = text.trim()
                } else if (url.endsWith('status.xsl')) {
                  const m = text.match(/Current Song:\s*<[^>]*>([^<]+)<\/[^>]*>/i) || text.match(/Stream Title:\s*([^\n<]+)/i)
                  title = (m && m[1]?.trim()) || ''
                }
                if (title) break
              } catch (e) {
                // ignore specific fetch errors
              }
            }
            
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
})
