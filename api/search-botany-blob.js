const CROP_PREFIX =
  'derived/illustration_similarity/dino1575/20260829T190102Z_dino1575/v1/crops/'
const WEB_DATA_PREFIX =
  'derived/illustration_similarity/dino1575/20260829T190102Z_dino1575/v1/annotation_web_data/'
const SOURCE_IDS = '(bodleian_new|gallica|harvard_yenching|mdz|ndl|pul|rmda|wellcome)'

function isAllowedPath(path) {
  if (path.includes('..') || path.includes('\\')) return false
  if (path.startsWith(CROP_PREFIX) && /\.jpe?g$/i.test(path)) return true
  if (new RegExp(`^illustrations/${SOURCE_IDS}/[^/]+/page_[^/]+\\.(jpe?g|png|webp)$`, 'i').test(path)) return true
  if (
    path.startsWith(`${WEB_DATA_PREFIX}items/`) &&
    /\/rows_\d{6}_\d{6}\.json$/.test(path)
  ) return true
  if (
    path.startsWith(`${WEB_DATA_PREFIX}neighbours/`) &&
    /\/neighbours\/(dinov2|openclip)\/rows_\d{6}_\d{6}\.json$/.test(path)
  ) return true
  return false
}

function requestedRow(request) {
  const value = Array.isArray(request.query.row) ? request.query.row[0] : request.query.row
  if (value == null || value === '') return null
  if (!/^\d+$/.test(String(value))) return Number.NaN
  return Number(value)
}

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
    !isAllowedPath(requestedPath)
  ) {
    return response.status(400).json({ error: 'Invalid archive asset path' })
  }

  const row = requestedRow(request)
  const neighbourRequest = requestedPath.includes(`${WEB_DATA_PREFIX}neighbours/`)
  if (Number.isNaN(row) || (row !== null && !neighbourRequest)) {
    return response.status(400).json({ error: 'Invalid neighbour row' })
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
      return response.status(azureResponse.status).json({ error: 'Archive asset unavailable' })
    }

    response.setHeader('Content-Type', azureResponse.headers.get('content-type') || 'application/octet-stream')
    response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable')
    const etag = azureResponse.headers.get('etag')
    if (etag) response.setHeader('ETag', etag)

    if (request.method === 'HEAD') return response.status(200).end()
    if (row !== null) {
      const records = await azureResponse.json()
      const record = Array.isArray(records)
        ? records.find((candidate) => candidate?.row_index === row)
        : null
      if (!record) return response.status(404).json({ error: 'Neighbour record unavailable' })
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      return response.status(200).json(record)
    }

    const asset = Buffer.from(await azureResponse.arrayBuffer())
    return response.status(200).send(asset)
  } catch (error) {
    console.error('Search Botany proxy error', error)
    return response.status(502).json({ error: 'Could not retrieve illustration' })
  }
}
