import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookData, type BookRecord } from '../../data/books'
import { BookReader } from '../../components/BookReader'

let customBookCounter = 0

const makeCustomBook = (manifestUrl: string, title: string): BookRecord => ({
  id: `custom-${Date.now()}-${customBookCounter++}`,
  title: title || 'Untitled upload',
  navDate: new Date().toISOString(),
  year: new Date().getFullYear(),
  dynasty: '',
  description: 'Item opened directly in Explore.',
  subjects: [],
  category: 'botany',
  manifestUrl,
  thumbnailUrl: '',
  pageCount: 0,
  institution: 'Uploaded item',
  attribution: '',
  language: [],
  authors: [],
  shelfmark: '',
  hasIllustrations: false,
})

export function AIHubPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const [customBook, setCustomBook] = useState<BookRecord | null>(null)
  const [customTileSources, setCustomTileSources] = useState<any[] | undefined>(undefined)
  const [manifestUrlInput, setManifestUrlInput] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const objectUrlsRef = useRef<string[]>([])

  const selectedBook = useMemo(() => {
    if (!bookId) return null
    return bookData.find((b) => b.id === bookId) ?? null
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

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
        setCustomTileSources([{ type: 'image', url: objectUrl }])
        setCustomBook(makeCustomBook(objectUrl, file.name))
      } else {
        setUploadError('Please upload an image file or a IIIF manifest (.json) file.')
      }
    } catch (err) {
      console.error(err)
      setUploadError('Could not open that file. Make sure it is a valid image or IIIF manifest JSON.')
    }
  }

  if (customBook) {
    return (
      <BookReader
        book={customBook}
        initialTileSources={customTileSources}
        onBack={clearCustomBook}
      />
    )
  }

  if (!bookId) {
    return (
      <section className="ai-hub-empty">
        <h2 className="ai-hub-title">Explore</h2>
        <p className="ai-hub-body">
          Explore opens from a selected book. Choose an item in Books to begin.
        </p>
        <div className="ai-hub-actions">
          <Link className="ai-hub-link" to="/library">
            Go to Books
          </Link>
        </div>

        <div className="ai-hub-divider" />

        <div className="ai-hub-custom-section">
          <h3 className="ai-hub-custom-title">Or open your own</h3>
          <p className="ai-hub-custom-body">
            Upload a book page image or a IIIF manifest file, or paste a IIIF manifest URL, to view it with the same transcription and detection tools.
          </p>

          <div className="ai-hub-custom-controls">
            <label className="ai-hub-upload-btn">
              Upload image or manifest (.json)
              <input
                type="file"
                accept="image/*,.json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

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
          </div>

          {uploadError && <p className="ai-hub-custom-error">{uploadError}</p>}
        </div>
      </section>
    )
  }

  if (!selectedBook) {
    return (
      <section className="ai-hub-empty">
        <h2 className="ai-hub-title">Explore</h2>
        <p className="ai-hub-body">
          This manuscript could not be found. It may have been renamed or removed.
        </p>
        <div className="ai-hub-actions">
          <Link className="ai-hub-link" to="/library">
            Browse Books
          </Link>
        </div>
      </section>
    )
  }

  return (
    <BookReader
      book={selectedBook}
      onBack={() => {
        navigate('/library')
      }}
    />
  )
}
