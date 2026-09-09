const DEFAULT_PUBLIC_ASSET_BASE =
  'https://phytovision.blob.core.windows.net/histvision-web-assets'

const publicAssetBase = (
  import.meta.env.VITE_SEARCH_BOTANY_PUBLIC_ASSET_BASE || DEFAULT_PUBLIC_ASSET_BASE
).replace(/\/$/, '')

const privateAssetProxy =
  import.meta.env.VITE_SEARCH_BOTANY_IMAGE_PROXY || '/api/search-botany-blob'

function encodeBlobPath(path: string): string {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

/** Public, immutable crop and thumbnail assets. Never includes a SAS token. */
export function publicSearchBotanyAssetUrl(path: string): string {
  return `${publicAssetBase}/${encodeBlobPath(path)}`
}

/** Private source pages and compact archive data served through the API proxy. */
export function privateSearchBotanyAssetUrl(path: string): string {
  return `${privateAssetProxy}?path=${encodeURIComponent(path)}`
}

export function cropPathToThumbnailPath(path: string): string {
  return path
    .replace('/crops/', '/web_thumbnails_512/')
    .replace(/\.jpe?g$/i, '.webp')
}
