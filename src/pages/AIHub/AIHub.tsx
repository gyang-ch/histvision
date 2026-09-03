import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBookCatalogue, type BookRecord } from '../../data/books'
import { BookReader } from '../../components/BookReader'

let customBookCounter = 0
// `file` carries the original upload: blob: URLs (`url`) only resolve inside
// this browser tab, so any backend call needs the raw bytes, not the URL.
type CustomTileSource = { type: 'image'; url: string; file?: File }

const makeCustomBook = (manifestUrl: string, title: string): BookRecord => ({
  id: `custom-${Date.now()}-${customBookCounter++}`,
  source: 'custom',
  sourceLabel: 'Uploaded item',
  sourceItemId: '',
  title: title || 'Untitled upload',
  year: new Date().getFullYear(),
  dateLabel: String(new Date().getFullYear()),
  description: 'Item opened directly in Explore.',
  subjects: [],
  manifestUrl,
  museumUrl: '',
  representativeCropBlobPath: '',
  pageCount: 0,
  positivePageCount: 0,
  institution: 'Uploaded item',
  attribution: '',
  license: '',
  language: [],
  authors: [],
  shelfmark: '',
  illustrationCount: 0,
  yoloIllustrationCount: 0,
  keywordsMatched: [],
  metadataAvailable: true,
})

export function AIHubPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const [customBook, setCustomBook] = useState<BookRecord | null>(null)
  const [customTileSources, setCustomTileSources] = useState<CustomTileSource[] | undefined>(undefined)
  const [manifestUrlInput, setManifestUrlInput] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null)
  const [isCatalogueLoading, setIsCatalogueLoading] = useState(Boolean(bookId))
  const objectUrlsRef = useRef<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    if (!bookId) return
    fetchBookCatalogue()
      .then((catalogue) => {
        if (active) setSelectedBook(catalogue.books.find((book) => book.id === bookId) ?? null)
      })
      .finally(() => {
        if (active) setIsCatalogueLoading(false)
      })
    return () => { active = false }
  }, [bookId])

  const clearCustomBook = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
    setCustomBook(null)
    setCustomTileSources(undefined)
  }

  const handleManifestUrlSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = manifestUrlInput.trim()
    if (!trimmed) return
    setUploadError(null)
    setCustomTileSources(undefined)
    setCustomBook(makeCustomBook(trimmed, 'Custom manifest'))
  }

  const processFile = async (file: File) => {
    setUploadError(null)
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    const isImage = file.type.startsWith('image/')

    try {
      if (isJson) {
        const text = await file.text()
        JSON.parse(text) // validate it's a manifest before opening it
        const blobUrl = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
        objectUrlsRef.current.push(blobUrl)
        setCustomTileSources(undefined)
        setCustomBook(makeCustomBook(blobUrl, file.name.replace(/\.json$/i, '')))
      } else if (isImage) {
        const objectUrl = URL.createObjectURL(file)
        objectUrlsRef.current.push(objectUrl)
        setCustomTileSources([{ type: 'image', url: objectUrl, file }])
        setCustomBook(makeCustomBook(objectUrl, file.name))
      } else {
        setUploadError('Please upload an image file or a IIIF manifest (.json) file.')
      }
    } catch (err) {
      console.error(err)
      setUploadError('Could not open that file. Make sure it is a valid image or IIIF manifest JSON.')
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await processFile(file)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  // Always visible above the viewer, so switching books or opening a new
  // upload doesn't require navigating away from whatever is currently shown.
  const picker = (
    <section className="ai-hub-picker">
      <div className="ai-hub-picker-col">
        <h2 className="ai-hub-title">Explore</h2>
        <p className="ai-hub-body">
          Explore opens from a selected book. Choose an item in Books to begin.
        </p>
        <div className="ai-hub-actions">
          <Link className="ai-hub-link" to="/books">
            Go to Books
          </Link>
        </div>
      </div>

      <div className="ai-hub-picker-divider" aria-hidden="true" />

      <div className="ai-hub-picker-col ai-hub-custom-section">
        <h3 className="ai-hub-custom-title">Or open your own</h3>
        <p className="ai-hub-custom-body">
          Upload a book page image or a IIIF manifest file, or paste a IIIF manifest URL, to view it with the same transcription and detection tools.
        </p>

        <div
          className={`ai-hub-dropzone ${isDragActive ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragActive(true)
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="ai-hub-dropzone-text">
            Drag and drop an image or manifest (.json), or click to choose a file
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <form className="ai-hub-manifest-form" onSubmit={handleManifestUrlSubmit}>
          <input
            type="url"
            className="ai-hub-manifest-input"
            placeholder="Paste a IIIF manifest URL"
            value={manifestUrlInput}
            onChange={(event) => setManifestUrlInput(event.target.value)}
            aria-label="IIIF manifest URL"
          />
          <button type="submit" className="ai-hub-manifest-submit" disabled={!manifestUrlInput.trim()}>
            Open
          </button>
        </form>

        {uploadError && <p className="ai-hub-custom-error">{uploadError}</p>}
      </div>
    </section>
  )

  let viewer: ReactNode = null
  if (customBook) {
    viewer = (
      <BookReader
        book={customBook}
        initialTileSources={customTileSources}
        onBack={clearCustomBook}
      />
    )
  } else if (bookId) {
    if (isCatalogueLoading) {
      viewer = <p className="ai-hub-status" aria-live="polite">Loading book…</p>
    } else if (!selectedBook) {
      viewer = (
        <p className="ai-hub-status">
          This manuscript could not be found. It may have been renamed or removed.
        </p>
      )
    } else {
      viewer = (
        <BookReader
          book={selectedBook}
          onBack={() => {
            navigate('/books')
          }}
        />
      )
    }
  }

  return (
    <div className="ai-hub-page">
      {picker}
      {viewer}
    </div>
  )
}
