import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const manifestPath = resolve(process.argv[2] ?? '')
const pageLogPath = resolve(process.argv[3] ?? '')
const outputDirectory = resolve(process.argv[4] ?? 'public/data/dino1575-page-boxes')
const cataloguePath = process.argv[5] ? resolve(process.argv[5]) : null
const textBlockThreshold = 0.10

if (!process.argv[2] || !process.argv[3]) {
  console.error('Usage: node scripts/buildIllustrationPageIndex.mjs <crop_manifest.jsonl> <page_log.jsonl> [output-directory] [books.catalog.json]')
  process.exit(1)
}

const allowedBooks = cataloguePath
  ? new Set(JSON.parse(readFileSync(cataloguePath, 'utf8')).books.map(
      (book) => `${book.source}\0${book.sourceItemId}`,
    ))
  : null

function shardFor(key) {
  let hash = 0x811c9dc5
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 0x01000193)
  }
  return ((hash >>> 0) & 0xff).toString(16).padStart(2, '0')
}

function rounded(value) {
  return Number(Number(value).toFixed(6))
}

const shards = new Map()
const books = new Set()
const pages = new Set()
const illustratedPages = new Set()
const cropIllustratedPages = new Set()
const processedPages = new Set()
let cropIllustrationDetectionCount = 0
let overlayIllustrationDetectionCount = 0
let textBlockDetectionCount = 0
let excludedPageLogRecordCount = 0

function addDetection({ source, itemId, pageFilename, compactDetection }) {
  const pageMatch = /^page_(\d+)\.jpg$/i.exec(pageFilename ?? '')
  if (!pageMatch) throw new Error(`Invalid page filename: ${pageFilename}`)
  const key = `${source}\0${itemId}`
  const pageNumber = String(Number(pageMatch[1]))
  const shardName = shardFor(key)
  let shard = shards.get(shardName)
  if (!shard) {
    shard = {}
    shards.set(shardName, shard)
  }
  shard[key] ??= {}
  shard[key][pageNumber] ??= []
  shard[key][pageNumber].push(compactDetection)
  books.add(key)
  pages.add(`${key}\0${pageNumber}`)
  return `${key}\0${pageNumber}`
}

const input = createInterface({
  input: createReadStream(manifestPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

for await (const line of input) {
  if (!line.trim()) continue
  const record = JSON.parse(line)
  const box = record.detector_bbox_normalized_xyxy
  if (!Array.isArray(box) || box.length !== 4) {
    throw new Error(`Invalid crop-manifest row ${cropIllustrationDetectionCount + 1}`)
  }
  const pageKey = addDetection({
    source: record.source,
    itemId: record.item_id,
    pageFilename: record.page_filename,
    compactDetection: [record.crop_id, 'i', rounded(record.confidence), ...box.map(rounded)],
  })
  illustratedPages.add(pageKey)
  cropIllustratedPages.add(pageKey)
  cropIllustrationDetectionCount += 1
}

const pageLog = createInterface({
  input: createReadStream(pageLogPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

for await (const line of pageLog) {
  if (!line.trim()) continue
  const record = JSON.parse(line)
  if (!record.source || !record.item_id || !record.page_filename) continue
  if (allowedBooks && !allowedBooks.has(`${record.source}\0${record.item_id}`)) {
    excludedPageLogRecordCount += 1
    continue
  }
  const pageMatch = /^page_(\d+)\.jpg$/i.exec(record.page_filename)
  if (!pageMatch) continue
  const pageKey = `${record.source}\0${record.item_id}\0${Number(pageMatch[1])}`
  processedPages.add(pageKey)
  const detections = record.detected_classes ?? []
  detections.forEach((detection, index) => {
    const confidence = Number(detection.confidence)
    const isTextBlock = detection.class === 'text_block' && confidence >= textBlockThreshold
    const isOverlayIllustration = detection.class === 'illustration'
      && confidence >= Number(record.operational_threshold ?? 0.19)
      && !cropIllustratedPages.has(pageKey)
    if (!isTextBlock && !isOverlayIllustration) return
    const box = detection.bbox_normalized_xyxy
    if (!Array.isArray(box) || box.length !== 4) return
    const detectionPageKey = addDetection({
      source: record.source,
      itemId: record.item_id,
      pageFilename: record.page_filename,
      compactDetection: [
        `${isTextBlock ? 't' : 'o'}${record.page_id ?? 'page'}_${index.toString(36)}`,
        isTextBlock ? 't' : 'i',
        rounded(confidence),
        ...box.map(rounded),
      ],
    })
    if (isTextBlock) {
      textBlockDetectionCount += 1
    } else {
      illustratedPages.add(detectionPageKey)
      overlayIllustrationDetectionCount += 1
    }
  })
}

rmSync(outputDirectory, { recursive: true, force: true })
mkdirSync(outputDirectory, { recursive: true })

for (const [shardName, shardBooks] of [...shards.entries()].sort()) {
  writeFileSync(join(outputDirectory, `${shardName}.json`), JSON.stringify({
    schemaVersion: 'dino1575-page-boxes-v2',
    detector: 'DINO-R50-1575',
    classes: ['illustration', 'text_block'],
    textBlockThreshold,
    books: shardBooks,
  }))
}

const summary = {
  schemaVersion: 'dino1575-page-boxes-v2',
  sourceManifest: basename(manifestPath),
  sourcePageLog: basename(pageLogPath),
  sourceBookCatalogue: cataloguePath ? basename(cataloguePath) : null,
  textBlockThreshold,
  shardCount: shards.size,
  bookCount: books.size,
  processedPageCount: processedPages.size,
  indexedPageCount: pages.size,
  illustratedPageCount: illustratedPages.size,
  cropIllustrationDetectionCount,
  overlayIllustrationDetectionCount,
  illustrationDetectionCount: cropIllustrationDetectionCount + overlayIllustrationDetectionCount,
  textBlockDetectionCount,
  excludedPageLogRecordCount,
}
writeFileSync(join(outputDirectory, 'index.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify({ outputDirectory, ...summary }, null, 2))
