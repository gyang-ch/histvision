import { fetchBookCatalogue, type BookRecord } from './books'

export type EmbeddingModel = 'dinov2' | 'openclip'

export interface ArchiveItem {
  row_index: number
  crop_id: string
  source: string
  item_id: string
  crop_blob_name: string
  confidence: number
  confidence_tier: string
  page_number: number | null
  page_filename: string
  source_set: string
}

export interface ArchiveGeometry {
  pageWidth: number
  pageHeight: number
  cropBox: [number, number, number, number]
  detectorBox: [number, number, number, number]
}

export interface ArchiveFacet {
  id: string
  label: string
  count: number
  rows: number[]
}

export interface ArchiveIndex {
  schemaVersion: string
  runId: string
  cropCount: number
  bookCount: number
  rowsPerShard: number
  azureDataPrefix: string
  geometry: { url: string; recordBytes: number; layout: string }
  confidenceHistogram: { edges: number[]; counts: number[] }
  facets: {
    sources: ArchiveFacet[]
    confidenceTiers: ArchiveFacet[]
    sourceSets: ArchiveFacet[]
    centuries: ArchiveFacet[]
    aspects: ArchiveFacet[]
  }
  bookRows: Record<string, number[]>
  displayRows: number[]
  displayOrdering: { method: string; seed: string }
  embeddingMaps: Record<EmbeddingModel, {
    coordinates: { url: string; record_count: number }
    clusters: { url: string; record_count: number; cluster_count: number; counts: Record<string, number> }
  }>
}

export interface NeighbourRecord {
  row_index: number
  crop_id: string
  top_200_indices: number[]
  top_200_scores: number[]
  cross_book_top_50_indices?: number[]
  cross_book_top_50_scores?: number[]
}

const archiveAsset = (file: string) => `${import.meta.env.BASE_URL}data/archive/${file}`
const assetProxy = import.meta.env.VITE_SEARCH_BOTANY_IMAGE_PROXY || '/api/search-botany-blob'

let indexPromise: Promise<ArchiveIndex> | null = null
let geometryPromise: Promise<ArrayBuffer> | null = null
const itemShardCache = new Map<number, Promise<ArchiveItem[]>>()
const neighbourRecordCache = new Map<string, Promise<NeighbourRecord>>()

export function fetchArchiveIndex(): Promise<ArchiveIndex> {
  if (!indexPromise) {
    indexPromise = fetch(archiveAsset('archive-index.json')).then((response) => {
      if (!response.ok) throw new Error(`Could not load archive index (${response.status})`)
      return response.json() as Promise<ArchiveIndex>
    })
  }
  return indexPromise
}

export function searchBotanyAssetUrl(path: string): string {
  return `${assetProxy}?path=${encodeURIComponent(path)}`
}

export function cropImageUrl(item: ArchiveItem): string {
  return searchBotanyAssetUrl(item.crop_blob_name)
}

export function pageImageUrl(item: ArchiveItem): string {
  return searchBotanyAssetUrl(`illustrations/${item.source}/${item.item_id}/${item.page_filename}`)
}

function shardBounds(row: number, total: number, shardSize: number) {
  const first = Math.floor(row / shardSize) * shardSize
  const last = Math.min(first + shardSize - 1, total - 1)
  return { first, last }
}

function shardName(first: number, last: number) {
  return `rows_${String(first).padStart(6, '0')}_${String(last).padStart(6, '0')}.json`
}

async function fetchItemShard(first: number, index: ArchiveIndex): Promise<ArchiveItem[]> {
  let promise = itemShardCache.get(first)
  if (!promise) {
    const { last } = shardBounds(first, index.cropCount, index.rowsPerShard)
    const path = `${index.azureDataPrefix}/items/${shardName(first, last)}`
    promise = fetch(searchBotanyAssetUrl(path)).then((response) => {
      if (!response.ok) throw new Error(`Could not load illustration records (${response.status})`)
      return response.json() as Promise<ArchiveItem[]>
    })
    itemShardCache.set(first, promise)
  }
  return promise
}

export async function fetchArchiveItems(rows: number[], suppliedIndex?: ArchiveIndex): Promise<ArchiveItem[]> {
  const index = suppliedIndex ?? await fetchArchiveIndex()
  const grouped = new Map<number, number[]>()
  rows.forEach((row) => {
    const first = Math.floor(row / index.rowsPerShard) * index.rowsPerShard
    const group = grouped.get(first) ?? []
    group.push(row)
    grouped.set(first, group)
  })

  const itemMap = new Map<number, ArchiveItem>()
  await Promise.all([...grouped.entries()].map(async ([first, wanted]) => {
    const wantedSet = new Set(wanted)
    const shard = await fetchItemShard(first, index)
    shard.forEach((item) => {
      if (wantedSet.has(item.row_index)) itemMap.set(item.row_index, item)
    })
  }))
  return rows.map((row) => itemMap.get(row)).filter((item): item is ArchiveItem => Boolean(item))
}

export async function fetchBookMap(): Promise<Map<string, BookRecord>> {
  const catalogue = await fetchBookCatalogue()
  return new Map(catalogue.books.map((book) => [`${book.source}\0${book.sourceItemId}`, book]))
}

export async function fetchArchiveGeometry(row: number): Promise<ArchiveGeometry> {
  const index = await fetchArchiveIndex()
  if (!geometryPromise) {
    geometryPromise = fetch(archiveAsset(index.geometry.url)).then((response) => {
      if (!response.ok) throw new Error(`Could not load archive geometry (${response.status})`)
      return response.arrayBuffer()
    })
  }
  const buffer = await geometryPromise
  const offset = row * index.geometry.recordBytes
  const view = new DataView(buffer, offset, index.geometry.recordBytes)
  return {
    pageWidth: view.getUint32(0, true),
    pageHeight: view.getUint32(4, true),
    cropBox: [8, 12, 16, 20].map((position) => view.getUint32(position, true)) as ArchiveGeometry['cropBox'],
    detectorBox: [24, 28, 32, 36].map((position) => view.getFloat32(position, true)) as ArchiveGeometry['detectorBox'],
  }
}

export async function fetchNeighbours(row: number, model: EmbeddingModel): Promise<NeighbourRecord> {
  const index = await fetchArchiveIndex()
  const { first, last } = shardBounds(row, index.cropCount, index.rowsPerShard)
  const key = `${model}:${row}`
  let promise = neighbourRecordCache.get(key)
  if (!promise) {
    const path = `${index.azureDataPrefix}/neighbours/${model}/${shardName(first, last)}`
    promise = fetch(`${searchBotanyAssetUrl(path)}&row=${row}`).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${model} neighbours (${response.status})`)
      return response.json() as Promise<NeighbourRecord>
    })
    neighbourRecordCache.set(key, promise)
  }
  const record = await promise
  if (!record) throw new Error(`Neighbour record missing for row ${row}`)
  return record
}

export async function fetchEmbeddingMap(model: EmbeddingModel) {
  const index = await fetchArchiveIndex()
  const config = index.embeddingMaps[model]
  const [coordinateResponse, clusterResponse] = await Promise.all([
    fetch(archiveAsset(config.coordinates.url)),
    fetch(archiveAsset(config.clusters.url)),
  ])
  if (!coordinateResponse.ok || !clusterResponse.ok) throw new Error('Could not load embedding map')
  const [coordinateBuffer, clusterBuffer] = await Promise.all([
    coordinateResponse.arrayBuffer(),
    clusterResponse.arrayBuffer(),
  ])
  return {
    coordinates: new Float32Array(coordinateBuffer),
    clusters: new Int16Array(clusterBuffer),
  }
}
