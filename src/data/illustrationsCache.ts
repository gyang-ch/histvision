const ILLUSTRATIONS_URL = '/data/illustrations.public.jsonl'

export interface IllustrationRecord {
  illustration_id: string
  book: {
    book_id: string
    title: string
    authors: string[]
    language: string[]
    year: number
    category: string
    institution: string
    shelfmark: string
    iiif_manifest: string
  }
  page: {
    page_number: number
    page_index: number
    iiif_url: string
    page_image?: string
    image_width: number
    image_height: number
  }
  illustration: {
    crop_image: string
    width: number
    height: number
    bbox_px: [number, number, number, number]
  }
  detection: {
    plant_type_by_YOLO: string | null
    confidence: number
    plant_type_from_text: string | null
  }
  text: {
    page_transcription: string
    illustration_caption: string
  }
  quality: {
    needs_review: boolean
    human_verified: boolean
    verification_notes: string
  }
  cluster: {
    algorithm: string
    cluster_id: number
  }
  neighbors: string[]
}

// Module-level singleton: the first caller triggers one fetch; every subsequent
// caller — including IllustrationNetwork before the first resolves — receives
// the same Promise and therefore the same parsed array.
let cached: Promise<IllustrationRecord[]> | null = null

export function fetchIllustrations(): Promise<IllustrationRecord[]> {
  if (!cached) {
    cached = fetch(ILLUSTRATIONS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) =>
        text
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as IllustrationRecord),
      )
  }
  return cached
}
