const ALLOWED_PREFIX =
  'derived/illustration_similarity/dino1575/20260829T190102Z_dino1575/v1/crops/'

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const requestedPath = Array.isArray(request.query.path)
    ? request.query.path[0]
    : request.query.path

  if (
    typeof requestedPath !== 'string' ||
    !requestedPath.startsWith(ALLOWED_PREFIX) ||
    requestedPath.includes('..') ||
    !requestedPath.toLowerCase().endsWith('.jpg')
  ) {
    return response.status(400).json({ error: 'Invalid illustration path' })
  }

  const containerUrl = process.env.SEARCH_BOTANY_CONTAINER_URL?.replace(/\/$/, '')
  const sasToken = process.env.SEARCH_BOTANY_SAS_TOKEN?.replace(/^\?/, '')
  if (!containerUrl || !sasToken) {
    return response.status(503).json({ error: 'Search Botany storage is not configured' })
  }

  const encodedPath = requestedPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  const azureUrl = `${containerUrl}/${encodedPath}?${sasToken}`

  try {
    const azureResponse = await fetch(azureUrl, { method: request.method })
    if (!azureResponse.ok) {
      return response.status(azureResponse.status).json({ error: 'Illustration unavailable' })
    }

    response.setHeader('Content-Type', azureResponse.headers.get('content-type') || 'image/jpeg')
    response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable')
    const etag = azureResponse.headers.get('etag')
    if (etag) response.setHeader('ETag', etag)

    if (request.method === 'HEAD') return response.status(200).end()
    const image = Buffer.from(await azureResponse.arrayBuffer())
    return response.status(200).send(image)
  } catch (error) {
    console.error('Search Botany proxy error', error)
    return response.status(502).json({ error: 'Could not retrieve illustration' })
  }
}
