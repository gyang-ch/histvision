import { useEffect, useMemo, useState } from 'react'
import { Paginator } from '../../components/Paginator'
import {
  cropImageUrl,
  fetchArchiveGeometry,
  fetchArchiveIndex,
  fetchArchiveItems,
  fetchBookMap,
  fetchNeighbours,
  pageImageUrl,
  type ArchiveFacet,
  type ArchiveGeometry,
  type ArchiveIndex,
  type ArchiveItem,
  type EmbeddingModel,
} from '../../data/archiveData'
import type { BookRecord } from '../../data/books'
import { DinoIllustrationNetwork } from './DinoIllustrationNetwork'
import './DinoIllustrationArchive.css'

const PAGE_SIZE = 60

function bookKey(source: string, itemId: string) {
  return `${source}\0${itemId}`
}

function formatTier(tier: string) {
  if (tier.includes('high')) return 'High confidence'
  if (tier.includes('medium')) return 'Medium confidence'
  return 'Low confidence'
}

function rowsForFacet(facets: ArchiveFacet[], id: string) {
  return id === 'all' ? null : facets.find((facet) => facet.id === id)?.rows ?? []
}

function intersectRows(total: number, groups: Array<number[] | null>) {
  const active = groups.filter((group): group is number[] => group !== null)
  if (!active.length) return Array.from({ length: total }, (_, row) => row)
  active.sort((a, b) => a.length - b.length)
  const [smallest, ...rest] = active
  const sets = rest.map((rows) => new Set(rows))
  return smallest.filter((row) => sets.every((set) => set.has(row)))
}

function FacetButtons({
  title,
  facets,
  selected,
  onChange,
}: {
  title: string
  facets: ArchiveFacet[]
  selected: string
  onChange: (value: string) => void
}) {
  const max = Math.max(...facets.map((facet) => facet.count), 1)
  return (
    <fieldset className="archive-facet">
      <legend>{title}</legend>
      <button type="button" className={selected === 'all' ? 'active' : ''} onClick={() => onChange('all')}>
        <span>All</span>
      </button>
      {facets.map((facet) => (
        <button
          key={facet.id}
          type="button"
          className={selected === facet.id ? 'active' : ''}
          aria-pressed={selected === facet.id}
          onClick={() => onChange(selected === facet.id ? 'all' : facet.id)}
        >
          <i style={{ width: `${Math.max(5, facet.count / max * 100)}%` }} />
          <span>{facet.label}</span>
          <strong>{facet.count.toLocaleString()}</strong>
        </button>
      ))}
    </fieldset>
  )
}

function ArchiveInspector({
  row,
  onClose,
  onSelectRow,
}: {
  row: number
  onClose: () => void
  onSelectRow: (row: number) => void
}) {
  const [item, setItem] = useState<ArchiveItem | null>(null)
  const [book, setBook] = useState<BookRecord | null>(null)
  const [geometry, setGeometry] = useState<ArchiveGeometry | null>(null)
  const [model, setModel] = useState<EmbeddingModel>('dinov2')
  const [neighbours, setNeighbours] = useState<Array<{ item: ArchiveItem; score: number }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let active = true
    Promise.all([fetchArchiveItems([row]), fetchBookMap(), fetchArchiveGeometry(row)])
      .then(([items, books, geometryResult]) => {
        if (!active || !items[0]) return
        setItem(items[0])
        setBook(books.get(bookKey(items[0].source, items[0].item_id)) ?? null)
        setGeometry(geometryResult)
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { active = false }
  }, [row])

  useEffect(() => {
    let active = true
    fetchNeighbours(row, model)
      .then(async (record) => {
        const indices = record.cross_book_top_50_indices?.slice(0, 12) ?? record.top_200_indices.slice(0, 12)
        const scores = record.cross_book_top_50_scores?.slice(0, 12) ?? record.top_200_scores.slice(0, 12)
        const items = await fetchArchiveItems(indices)
        if (active) setNeighbours(items.map((candidate, index) => ({ item: candidate, score: scores[index] ?? 0 })))
      })
      .catch(() => { if (active) setNeighbours([]) })
    return () => { active = false }
  }, [model, row])

  return (
    <div className="archive-inspector-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <article className="archive-inspector" role="dialog" aria-modal="true" aria-label="Illustration details">
        <button type="button" className="archive-inspector-close" onClick={onClose} aria-label="Close illustration details">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {error && <p className="archive-error" role="alert">{error}</p>}
        {!item || !geometry ? <p className="archive-inspector-loading">Loading illustration details…</p> : (
          <>
            <div className="archive-inspector-main">
              <div className="archive-source-page">
                <img src={pageImageUrl(item)} alt={`Original page containing ${item.crop_id}`} />
                <svg viewBox={`0 0 ${geometry.pageWidth} ${geometry.pageHeight}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <rect
                    x={geometry.cropBox[0]}
                    y={geometry.cropBox[1]}
                    width={geometry.cropBox[2] - geometry.cropBox[0]}
                    height={geometry.cropBox[3] - geometry.cropBox[1]}
                    className="archive-crop-box"
                  />
                  <rect
                    x={geometry.detectorBox[0]}
                    y={geometry.detectorBox[1]}
                    width={geometry.detectorBox[2] - geometry.detectorBox[0]}
                    height={geometry.detectorBox[3] - geometry.detectorBox[1]}
                    className="archive-detector-box"
                  />
                </svg>
                <div className="archive-box-key"><span className="crop">Padded crop</span><span className="detector">DINO detection</span></div>
              </div>

              <div className="archive-inspector-meta">
                <img className="archive-selected-crop" src={cropImageUrl(item)} alt="Selected illustration crop" />
                <p className="archive-kicker">{book?.institution ?? item.source}</p>
                <h2>{book?.title ?? item.item_id}</h2>
                {book?.authors.length ? <p className="archive-authors">{book.authors.join('; ')}</p> : null}
                <dl>
                  <div><dt>Crop ID</dt><dd>{item.crop_id}</dd></div>
                  <div><dt>Page</dt><dd>{item.page_number ?? item.page_filename}</dd></div>
                  <div><dt>Confidence</dt><dd>{(item.confidence * 100).toFixed(1)}%</dd></div>
                  <div><dt>Crop size</dt><dd>{geometry.cropBox[2] - geometry.cropBox[0]} × {geometry.cropBox[3] - geometry.cropBox[1]} px</dd></div>
                  <div><dt>Page size</dt><dd>{geometry.pageWidth} × {geometry.pageHeight} px</dd></div>
                  <div><dt>Detection box</dt><dd>{geometry.detectorBox.map((value) => Math.round(value)).join(', ')}</dd></div>
                  <div><dt>Crop box</dt><dd>{geometry.cropBox.join(', ')}</dd></div>
                </dl>
                <div className="archive-inspector-links">
                  {book?.museumUrl && <a href={book.museumUrl} target="_blank" rel="noreferrer">Library record ↗</a>}
                  {book?.manifestUrl && <a href={book.manifestUrl} target="_blank" rel="noreferrer">IIIF manifest ↗</a>}
                </div>
              </div>
            </div>

            <section className="archive-neighbours">
              <div className="archive-neighbour-heading">
                <div><p className="archive-kicker">Embedding retrieval</p><h3>Nearest illustrations</h3></div>
                <div role="group" aria-label="Nearest-neighbour model">
                  <button type="button" className={model === 'dinov2' ? 'active' : ''} onClick={() => { setNeighbours([]); setModel('dinov2') }}>DINOv2</button>
                  <button type="button" className={model === 'openclip' ? 'active' : ''} onClick={() => { setNeighbours([]); setModel('openclip') }}>OpenCLIP</button>
                </div>
              </div>
              <div className="archive-neighbour-strip">
                {neighbours.map(({ item: neighbour, score }) => (
                  <button key={neighbour.crop_id} type="button" onClick={() => onSelectRow(neighbour.row_index)} title={`Similarity ${score.toFixed(3)}`}>
                    <img src={cropImageUrl(neighbour)} alt={`Nearest illustration, similarity ${score.toFixed(3)}`} loading="lazy" />
                    <span>{score.toFixed(3)}</span>
                  </button>
                ))}
                {!neighbours.length && <p>Loading neighbours…</p>}
              </div>
            </section>
          </>
        )}
      </article>
    </div>
  )
}

export function DinoIllustrationArchivePage() {
  const [index, setIndex] = useState<ArchiveIndex | null>(null)
  const [books, setBooks] = useState<Map<string, BookRecord>>(new Map())
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedAspect, setSelectedAspect] = useState('all')
  const [selectedSourceSet, setSelectedSourceSet] = useState('all')
  const [selectedCentury, setSelectedCentury] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loadedPageKey, setLoadedPageKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchArchiveIndex(), fetchBookMap()])
      .then(([archiveIndex, bookMap]) => { setIndex(archiveIndex); setBooks(bookMap) })
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [])

  const searchRows = useMemo(() => {
    if (!index || !query.trim()) return null
    const normalized = query.trim().toLocaleLowerCase()
    const rows: number[] = []
    books.forEach((book, key) => {
      const text = [book.title, ...book.authors, ...book.subjects, book.sourceItemId, book.shelfmark].join(' ').toLocaleLowerCase()
      if (text.includes(normalized)) rows.push(...(index.bookRows[key] ?? []))
    })
    return rows.sort((a, b) => a - b)
  }, [books, index, query])

  const filteredRows = useMemo(() => {
    if (!index) return []
    return intersectRows(index.cropCount, [
      rowsForFacet(index.facets.sources, selectedSource),
      rowsForFacet(index.facets.confidenceTiers, selectedTier),
      rowsForFacet(index.facets.aspects, selectedAspect),
      rowsForFacet(index.facets.sourceSets, selectedSourceSet),
      rowsForFacet(index.facets.centuries, selectedCentury),
      searchRows,
    ])
  }, [index, searchRows, selectedAspect, selectedCentury, selectedSource, selectedSourceSet, selectedTier])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page],
  )
  const pageKey = pageRows.join(',')
  const pageLoading = pageKey !== loadedPageKey

  useEffect(() => {
    if (!index) return
    let active = true
    fetchArchiveItems(pageRows, index)
      .then((result) => {
        if (active) {
          setItems(result)
          setLoadedPageKey(pageKey)
        }
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { active = false }
  }, [index, pageKey, pageRows])

  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const reset = () => {
    setSelectedSource('all')
    setSelectedTier('all')
    setSelectedAspect('all')
    setSelectedSourceSet('all')
    setSelectedCentury('all')
    setQuery('')
    setPage(1)
  }

  if (error) return <div className="archive-error" role="alert">Failed to load Illustration Archive: {error}</div>
  if (!index) return <div className="archive-loading" aria-live="polite">Loading Illustration Archive…</div>

  return (
    <div className="archive-page">
      <header className="archive-header">
        <div>
          <h1>Illustration Archive</h1>
          <p>
            Explore {index.cropCount.toLocaleString()} illustration crops from {index.bookCount.toLocaleString()} books
            across eight digital libraries. Organization reflects provenance and detector evidence, not unverified subject labels.
          </p>
        </div>
        <dl>
          <div><dt>Illustrations</dt><dd>{index.cropCount.toLocaleString()}</dd></div>
          <div><dt>Books</dt><dd>{index.bookCount.toLocaleString()}</dd></div>
          <div><dt>Libraries</dt><dd>{index.facets.sources.length}</dd></div>
        </dl>
      </header>

      <div className="archive-shell">
        <aside className="archive-sidebar" aria-label="Illustration filters">
          <div className="archive-filter-heading"><h2>Organize the corpus</h2><button type="button" onClick={reset}>Reset</button></div>
          <label className="archive-search">
            <span>Search book metadata</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} type="search" placeholder="Title, author, subject, or item ID" />
          </label>
          <FacetButtons title="Source library" facets={index.facets.sources} selected={selectedSource} onChange={changeFilter(setSelectedSource)} />
          <FacetButtons title="Detection confidence" facets={index.facets.confidenceTiers} selected={selectedTier} onChange={changeFilter(setSelectedTier)} />
          <FacetButtons title="Crop orientation" facets={index.facets.aspects} selected={selectedAspect} onChange={changeFilter(setSelectedAspect)} />
          <FacetButtons title="Page provenance" facets={index.facets.sourceSets} selected={selectedSourceSet} onChange={changeFilter(setSelectedSourceSet)} />
          <label className="archive-century">
            <span>Book date</span>
            <select value={selectedCentury} onChange={(event) => changeFilter(setSelectedCentury)(event.target.value)}>
              <option value="all">All recorded dates</option>
              {[...index.facets.centuries]
                .sort((a, b) => a.id === 'unknown' ? 1 : b.id === 'unknown' ? -1 : Number(a.id) - Number(b.id))
                .map((facet) => <option key={facet.id} value={facet.id}>{facet.id === 'unknown' ? facet.label : `${facet.id}s`} ({facet.count.toLocaleString()})</option>)}
            </select>
          </label>
        </aside>

        <main className="archive-results">
          <div className="archive-results-bar">
            <div><strong>{filteredRows.length.toLocaleString()}</strong><span>matching illustrations</span></div>
            <div><span>Page {page.toLocaleString()} of {totalPages.toLocaleString()}</span></div>
          </div>

          {pageLoading ? <div className="archive-grid-loading">Loading this group of illustrations…</div> : (
            <div className="archive-grid">
              {items.map((item) => {
                const book = books.get(bookKey(item.source, item.item_id))
                return (
                  <button key={item.crop_id} type="button" className="archive-card" onClick={() => setSelectedRow(item.row_index)}>
                    <div className="archive-card-image"><img src={cropImageUrl(item)} alt={`Illustration from ${book?.title ?? item.item_id}`} loading="lazy" /></div>
                    <div className="archive-card-tags"><span>{book?.sourceLabel ?? item.source}</span><span>{Math.round(item.confidence * 100)}%</span></div>
                    <h3>{book?.title ?? item.item_id}</h3>
                    <p>{formatTier(item.confidence_tier)} · {item.page_number ?? item.page_filename}</p>
                  </button>
                )
              })}
            </div>
          )}
          {!pageLoading && !items.length && <p className="archive-empty">No illustrations match these filters.</p>}
          <Paginator currentPage={page} totalPages={totalPages} onPageChange={(next) => { setPage(next); window.scrollTo({ top: 540, behavior: 'smooth' }) }} />
        </main>
      </div>

      <DinoIllustrationNetwork onSelectRow={setSelectedRow} />

      {selectedRow != null && <ArchiveInspector key={selectedRow} row={selectedRow} onClose={() => setSelectedRow(null)} onSelectRow={setSelectedRow} />}
    </div>
  )
}
