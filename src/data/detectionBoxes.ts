import type { BookRecord } from './books'

export type DetectionLabel = 'illustration' | 'text_block'

export interface PageDetectionBox {
  cropId: string
  label: DetectionLabel
  confidence: number
  bboxNormalized: [number, number, number, number]
}

type CompactDetection = [string, 'i' | 't', number, number, number, number, number]
type CompactBookPages = Record<string, CompactDetection[]>
type DetectionShard = {
  schemaVersion: string
  books: Record<string, CompactBookPages>
}

const shardCache = new Map<string, Promise<DetectionShard>>()

function bookKey(book: BookRecord): string {
  return `${book.source}\0${book.sourceItemId}`
}

function shardFor(key: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 0x01000193)
  }
  return ((hash >>> 0) & 0xff).toString(16).padStart(2, '0')
}

async function fetchShard(shard: string): Promise<DetectionShard> {
  let pending = shardCache.get(shard)
  if (!pending) {
    const url = `${import.meta.env.BASE_URL}data/dino1575-page-boxes/${shard}.json`
    pending = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error(`Could not load detection boxes (${response.status})`)
      return response.json() as Promise<DetectionShard>
    })
    shardCache.set(shard, pending)
  }
  return pending
}

export async function fetchBookDetectionBoxes(book: BookRecord): Promise<Map<number, PageDetectionBox[]>> {
  if (book.source === 'custom') return new Map()
  const key = bookKey(book)
  const shard = await fetchShard(shardFor(key))
  const compactPages = shard.books[key] ?? {}

  return new Map(Object.entries(compactPages).map(([pageNumber, detections]) => [
    Number(pageNumber) - 1,
    detections.map(([cropId, label, confidence, x1, y1, x2, y2]) => ({
      cropId,
      label: label === 't' ? 'text_block' as const : 'illustration' as const,
      confidence,
      bboxNormalized: [x1, y1, x2, y2],
    })),
  ]))
}
