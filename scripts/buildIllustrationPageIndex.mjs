import { createReadStream, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const manifestPath = resolve(process.argv[2] ?? '')
const pageLogPath = resolve(process.argv[3] ?? '')
const outputDirectory = resolve(process.argv[4] ?? 'public/data/dino1575-page-boxes')
const textBlockThreshold = 0.10

if (!process.argv[2] || !process.argv[3]) {
  console.error('Usage: node scripts/buildIllustrationPageIndex.mjs <crop_manifest.jsonl> <page_log.jsonl> [output-directory]')
  process.exit(1)
}

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
let illustrationDetectionCount = 0
let textBlockDetectionCount = 0

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
    throw new Error(`Invalid crop-manifest row ${illustrationDetectionCount + 1}`)
  }
  illustratedPages.add(addDetection({
    source: record.source,
    itemId: record.item_id,
    pageFilename: record.page_filename,
    compactDetection: [record.crop_id, 'i', rounded(record.confidence), ...box.map(rounded)],
  }))
  illustrationDetectionCount += 1
}

const pageLog = createInterface({
  input: createReadStream(pageLogPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

for await (const line of pageLog) {
  if (!line.trim()) continue
  const record = JSON.parse(line)
  if (!books.has(`${record.source}\0${record.item_id}`)) continue
  const detections = record.detected_classes ?? []
  detections.forEach((detection, index) => {
    if (detection.class !== 'text_block' || Number(detection.confidence) < textBlockThreshold) return
    const box = detection.bbox_normalized_xyxy
    if (!Array.isArray(box) || box.length !== 4) return
    addDetection({
      source: record.source,
      itemId: record.item_id,
      pageFilename: record.page_filename,
      compactDetection: [`t${Number(record.row_index).toString(36)}_${index.toString(36)}`, 't', rounded(detection.confidence), ...box.map(rounded)],
    })
    textBlockDetectionCount += 1
  })
}

rmSync(outputDirectory, { recursive: true, force: true })
mkdirSync(outputDirectory, { recursive: true })

for (const [shardName, shardBooks] of [...shards.entries()].sort()) {
  writeFileSync(join(outputDirectory, `${shardName}.json`), JSON.stringify({
    schemaVersion: 'dino1575-page-boxes-v1',
    detector: 'DINO-R50-1575',
    classes: ['illustration', 'text_block'],
    textBlockThreshold,
    books: shardBooks,
  }))
}

const summary = {
  schemaVersion: 'dino1575-page-boxes-v1',
  sourceManifest: basename(manifestPath),
  sourcePageLog: basename(pageLogPath),
  textBlockThreshold,
  shardCount: shards.size,
  bookCount: books.size,
  indexedPageCount: pages.size,
  illustratedPageCount: illustratedPages.size,
  illustrationDetectionCount,
  textBlockDetectionCount,
}
writeFileSync(join(outputDirectory, 'index.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify({ outputDirectory, ...summary }, null, 2))
