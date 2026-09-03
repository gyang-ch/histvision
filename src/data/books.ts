export interface BookRecord {
  id: string
  source: string
  sourceLabel: string
  sourceItemId: string
  title: string
  dateLabel: string
  year: number | null
  description: string
  subjects: string[]
  manifestUrl: string
  museumUrl?: string
  representativeCropBlobPath: string
  pageCount: number
  positivePageCount: number
  institution: string
  attribution: string
  license?: string
  language: string[]
  languageFamily?: 'european' | 'sino_japanese' | 'arabic_persian' | 'other'
  authors: string[]
  shelfmark: string
  illustrationCount: number
  yoloIllustrationCount: number
  keywordsMatched: string[]
  metadataAvailable: boolean
  blobBookId?: string
}

export interface BookCatalogue {
  schemaVersion: string
  generatedFrom: {
    runId: string
    cropDatasetVersion: string
    detector: string
  }
  bookCount: number
  illustrationCount: number
  missingMetadataCount: number
  sourceCounts: Record<string, number>
  ordering?: {
    method: string
    seed: string
    languageFamilies: string[]
    openingLanguageFamilyWeights?: Record<string, number>
    harvardYenchingPhotographsDeferredUntilSourcePosition?: number
  }
  books: BookRecord[]
}

let cataloguePromise: Promise<BookCatalogue> | null = null

export function fetchBookCatalogue(): Promise<BookCatalogue> {
  if (!cataloguePromise) {
    const url = `${import.meta.env.BASE_URL}data/books.catalog.json`
    cataloguePromise = fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load the book catalogue (${response.status})`)
      }
      return response.json() as Promise<BookCatalogue>
    })
  }
  return cataloguePromise
}

export function getBookThumbnailUrl(book: BookRecord): string {
  const proxy = import.meta.env.VITE_SEARCH_BOTANY_IMAGE_PROXY || '/api/search-botany-blob'
  return `${proxy}?path=${encodeURIComponent(book.representativeCropBlobPath)}`
}
