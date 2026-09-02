import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'

const SOURCE_CONFIG = {
  bodleian_new: {
    run: 'bodleian_illustration_yolo_run',
    idField: 'bodleian_item_id',
    label: 'Bodleian Libraries',
    sourceUrlField: 'bodleian_url',
  },
  gallica: {
    run: 'gallica_illustration_yolo_run',
    idField: 'gallica_item_id',
    label: 'Bibliothèque nationale de France',
    sourceUrlField: 'gallica_url',
  },
  harvard_yenching: {
    run: 'harvard_yenching_illustration_yolo_run',
    idField: 'harvard_item_id',
    label: 'Harvard-Yenching Library',
    sourceUrlField: 'harvard_url',
    normaliseId: (value) => value.replaceAll(':', '_'),
  },
  mdz: {
    run: 'mdz_illustration_yolo_run',
    idField: 'mdz_item_id',
    label: 'Bavarian State Library',
    sourceUrlField: 'mdz_details_url',
  },
  ndl: {
    run: 'ndl_illustration_yolo_run',
    idField: 'ndl_item_id',
    label: 'National Diet Library, Japan',
    sourceUrlField: 'ndl_url',
  },
  pul: {
    run: 'pul_illustration_yolo_run',
    idField: 'pul_item_uuid',
    label: 'Princeton University Library',
    sourceUrlField: 'detail_url',
  },
  rmda: {
    run: 'rmda_illustration_yolo_run',
    idField: 'rmda_item_id',
    label: 'Kyoto University Rare Materials Digital Archive',
    sourceUrlField: 'rmda_url',
  },
  wellcome: {
    run: 'wellcome_illustration_yolo_run',
    idField: 'wellcome_item_id',
    label: 'Wellcome Collection',
    sourceUrlField: 'wellcome_url',
  },
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), values[index + 1]])
    return pairs
  }, []),
)

if (!args['books-root'] || !args['crop-manifest'] || !args.output) {
  console.error('Usage: node scripts/buildBookCatalogue.mjs --books-root PATH --crop-manifest PATH --output PATH')
  process.exit(2)
}

async function readJsonLines(filePath, onRecord) {
  const input = createReadStream(filePath, { encoding: 'utf8' })
  const lines = readline.createInterface({ input, crlfDelay: Infinity })
  for await (const line of lines) {
    if (line.trim()) onRecord(JSON.parse(line))
  }
}

function asText(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('; ')
  return String(value).replace(/\s+/g, ' ').trim()
}

function asList(value) {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return [...new Set(value.map(asText).filter(Boolean))]
  return [asText(value)].filter(Boolean)
}

function extractYear(value) {
  const text = asText(value)
  const exact = text.match(/(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)/)
  if (exact) return Number(exact[1])
  const century = text.match(/(?<!\d)(1[0-9]|20)(?:st|nd|rd|th)\s+century/i)
  if (century) return (Number(century[1]) - 1) * 100 + 50
  return null
}

function concise(value, length = 900) {
  const text = asText(value)
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text
}

function fallbackUrls(source, itemId) {
  if (source === 'bodleian_new') return {
    manifestUrl: `https://iiif.bodleian.ox.ac.uk/iiif/manifest/${itemId}.json`,
    museumUrl: `https://digital.bodleian.ox.ac.uk/objects/${itemId}/`,
  }
  if (source === 'gallica') return {
    manifestUrl: `https://gallica.bnf.fr/iiif/ark:/12148/${itemId}/manifest.json`,
    museumUrl: `https://gallica.bnf.fr/ark:/12148/${itemId}`,
  }
  if (source === 'harvard_yenching') {
    const originalId = itemId.replace(/^FHCL_/, 'FHCL:')
    return {
      manifestUrl: `https://nrs.harvard.edu/URN-3:${originalId}:MANIFEST:3`,
      museumUrl: `https://nrs.harvard.edu/urn-3:${originalId}`,
    }
  }
  if (source === 'mdz') return {
    manifestUrl: `https://api.digitale-sammlungen.de/iiif/presentation/v2/${itemId}/manifest`,
    museumUrl: `https://mdz-nbn-resolving.de/details:${itemId}`,
  }
  if (source === 'ndl') return {
    manifestUrl: `https://www.dl.ndl.go.jp/api/iiif/${itemId}/manifest.json`,
    museumUrl: `https://dl.ndl.go.jp/pid/${itemId}`,
  }
  if (source === 'pul') return {
    manifestUrl: `https://figgy.princeton.edu/concern/scanned_resources/${itemId}/manifest`,
    museumUrl: `https://digital-collections.princeton.edu/catalog/${itemId}`,
  }
  if (source === 'rmda') return {
    manifestUrl: `https://rmda.kulib.kyoto-u.ac.jp/iiif/metadata_manifest/${itemId}/manifest.json`,
    museumUrl: `https://rmda.kulib.kyoto-u.ac.jp/item/${itemId}`,
  }
  return {
    manifestUrl: `https://iiif.wellcomecollection.org/presentation/v2/${itemId}`,
    museumUrl: `https://wellcomecollection.org/works/${itemId}`,
  }
}

function descriptionFor(record) {
  return concise(
    record.description || record.abstract || record.notes || record.physical_description ||
      record.extent || record.catalog_notice || record.collection,
  )
}

const metadataBySource = new Map()
for (const [source, config] of Object.entries(SOURCE_CONFIG)) {
  const records = new Map()
  const filePath = path.join(args['books-root'], config.run, 'books.jsonl')
  await readJsonLines(filePath, (record) => {
    const rawId = asText(record[config.idField])
    if (!rawId) return
    const id = config.normaliseId ? config.normaliseId(rawId) : rawId
    records.set(id, record)
  })
  metadataBySource.set(source, records)
}

const books = new Map()
await readJsonLines(args['crop-manifest'], (crop) => {
  const source = asText(crop.source)
  const itemId = asText(crop.item_id)
  const key = `${source}\u0000${itemId}`
  const current = books.get(key)
  if (!current) {
    books.set(key, {
      source,
      itemId,
      cropCount: 1,
      representativeCropBlobPath: crop.crop_blob_name,
      representativeCropConfidence: Number(crop.confidence) || 0,
    })
  } else {
    current.cropCount += 1
    const confidence = Number(crop.confidence) || 0
    if (confidence > current.representativeCropConfidence) {
      current.representativeCropBlobPath = crop.crop_blob_name
      current.representativeCropConfidence = confidence
    }
  }
})

let missingMetadataCount = 0
const catalogue = [...books.values()].map((item) => {
  const config = SOURCE_CONFIG[item.source]
  if (!config) throw new Error(`Unknown source ${item.source}`)
  const record = metadataBySource.get(item.source)?.get(item.itemId)
  if (!record) missingMetadataCount += 1
  const sourceRecord = record || {}
  const fallback = fallbackUrls(item.source, item.itemId)
  const dateLabel = asText(sourceRecord.date)
  const subjects = asList(sourceRecord.subjects || sourceRecord.subject)
  const authors = asList(sourceRecord.author)
  const languages = asList(sourceRecord.language)
  const shelfmark = asText(sourceRecord.shelfmark || sourceRecord.call_number || sourceRecord.bibliographic_id)
  const museumUrl = asText(sourceRecord[config.sourceUrlField]) || fallback.museumUrl
  const manifestUrl = asText(sourceRecord.manifest_url) || fallback.manifestUrl

  return {
    id: `${item.source}__${item.itemId}`,
    source: item.source,
    sourceLabel: config.label,
    sourceItemId: item.itemId,
    title: asText(sourceRecord.title) || `Untitled item ${item.itemId}`,
    dateLabel,
    year: extractYear(dateLabel),
    description: descriptionFor(sourceRecord),
    subjects,
    manifestUrl,
    museumUrl,
    representativeCropBlobPath: item.representativeCropBlobPath,
    pageCount: Number(sourceRecord.total_pages) || 0,
    positivePageCount: Number(sourceRecord.positive_pages) || 0,
    illustrationCount: item.cropCount,
    yoloIllustrationCount: Number(sourceRecord.total_illustration_detections) || 0,
    institution: config.label,
    attribution: asText(sourceRecord.rights_statement || sourceRecord.repository || config.label),
    license: asText(sourceRecord.rights_statement),
    language: languages,
    authors,
    shelfmark,
    keywordsMatched: asList(sourceRecord.keywords_matched),
    metadataAvailable: Boolean(record),
  }
}).sort((a, b) => {
  if (a.year !== b.year) {
    if (a.year == null) return 1
    if (b.year == null) return -1
    return a.year - b.year
  }
  return a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
})

const sourceCounts = Object.fromEntries(
  Object.keys(SOURCE_CONFIG).map((source) => [source, catalogue.filter((book) => book.source === source).length]),
)

const output = {
  schemaVersion: 'dino1575_book_catalogue_v1',
  generatedFrom: {
    runId: '20260829T190102Z_dino1575',
    cropDatasetVersion: 'v1',
    detector: 'DINO-R50-1575',
  },
  bookCount: catalogue.length,
  illustrationCount: catalogue.reduce((sum, book) => sum + book.illustrationCount, 0),
  missingMetadataCount,
  sourceCounts,
  books: catalogue,
}

await mkdir(path.dirname(args.output), { recursive: true })
const stream = createWriteStream(args.output, { encoding: 'utf8' })
stream.end(`${JSON.stringify(output)}\n`)
await new Promise((resolve, reject) => {
  stream.on('finish', resolve)
  stream.on('error', reject)
})

console.log(JSON.stringify({
  status: 'completed',
  output: args.output,
  bookCount: output.bookCount,
  illustrationCount: output.illustrationCount,
  missingMetadataCount,
  sourceCounts,
}, null, 2))
