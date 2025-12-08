import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

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
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
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
            const mount = u.pathname
            const candidates = [
              `${origin}/status-json.xsl`,
              `${origin}/status.xsl`,
              `${origin}${mount}/currentsong`,
              `${origin}/currentsong`,
            ]
            
            let title = ''
            for (const url of candidates) {
              try {
                const r = await fetch(url)
                if (!r.ok) continue
                const text = await r.text()
                
                if (url.endsWith('status-json.xsl')) {
                  try {
                    const json = JSON.parse(text)
                    const src = json.icestats?.source
                    if (Array.isArray(src)) {
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
              } catch {}
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
      // Keep proxy for other potential API routes, but nowplaying is handled locally
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
