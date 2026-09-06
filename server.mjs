import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import searchBotanyBlob from './api/search-botany-blob.js'

const app = express()
const port = Number(process.env.PORT) || 10000
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')

app.disable('x-powered-by')

app.get('/healthz', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.all('/api/search-botany-blob', (request, response, next) => {
  Promise.resolve(searchBotanyBlob(request, response)).catch(next)
})

app.use(
  express.static(distDir, {
    fallthrough: true,
    maxAge: '1h',
    setHeaders(response, filePath) {
      if (filePath.endsWith('index.html')) {
        response.setHeader('Cache-Control', 'no-cache')
      } else if (filePath.startsWith(path.join(distDir, 'assets'))) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  }),
)

// React Router owns non-file routes. Existing files are served by express.static above.
app.use((request, response, next) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next()
  response.setHeader('Cache-Control', 'no-cache')
  return response.sendFile(path.join(distDir, 'index.html'))
})

app.use((error, _request, response, _next) => {
  console.error('Unhandled server error', error)
  if (response.headersSent) return
  response.status(500).json({ error: 'Internal server error' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`HistVision listening on port ${port}`)
})
