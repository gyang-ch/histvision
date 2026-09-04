import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import OpenSeadragon from 'openseadragon'
import { Paginator } from '../../components/Paginator'
import {
  cropImageUrl,
  fetchArchiveGeometry,
  fetchArchiveIndex,
  fetchArchiveItems,
  fetchBookMap,
  fetchClusterLabels,
  fetchHumanAnnotationIndex,
  fetchNeighbours,
  pageImageUrl,
  type ArchiveFacet,
  type ArchiveGeometry,
  type ArchiveIndex,
  type ArchiveItem,
  type EmbeddingModel,
  type HumanAnnotationIndex,
  type HumanAnnotationRecord,
} from '../../data/archiveData'
import type { BookRecord } from '../../data/books'
import { DinoIllustrationNetwork } from './DinoIllustrationNetwork'
import './DinoIllustrationArchive.css'

const PAGE_SIZE = 20

function bookKey(source: string, itemId: string) {
  return `${source}\0${itemId}`
}

function rowsForFacet(facets: ArchiveFacet[], id: string) {
  return id === 'all' ? null : facets.find((facet) => facet.id === id)?.rows ?? []
}

function intersectRows(order: number[], groups: Array<number[] | null>) {
  const active = groups.filter((group): group is number[] => group !== null)
  if (!active.length) return order
  const sets = active.map((rows) => new Set(rows))
  return order.filter((row) => sets.every((set) => set.has(row)))
}

function rowsForCluster(labels: Int16Array | null, selected: string) {
  if (selected === 'all') return null
  if (!labels) return []
  const clusterId = Number(selected)
  const rows: number[] = []
  labels.forEach((label, row) => {
    if (label === clusterId) rows.push(row)
  })
  return rows
}

function rowsForHumanStatus(annotations: HumanAnnotationIndex | null, selected: string, cropCount: number) {
  if (selected === 'all') return null
  if (!annotations) return []
  const annotated = new Set(annotations.records.map((record) => record.row_index))
  if (selected === 'not_annotated') {
    return Array.from({ length: cropCount }, (_, row) => row).filter((row) => !annotated.has(row))
  }
  return annotations.records
    .filter((record) => selected === 'annotated' || record.disposition === selected)
    .map((record) => record.row_index)
}

function rowsForHumanLabel(annotations: HumanAnnotationIndex | null, axis: 'subject' | 'domain', selected: string) {
  if (selected === 'all') return null
  if (!annotations) return []
  return annotations.records
    .filter((record) => (axis === 'subject' ? record.subject_form_labels : record.domain_labels).includes(selected))
    .map((record) => record.row_index)
}

function humanLabel(label: string) {
  return label.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function ClusterSelect({
  label,
  model,
  selected,
  counts,
  loading,
  unavailable,
  onChange,
}: {
  label: string
  model: EmbeddingModel
  selected: string
  counts: Record<string, number>
  loading: boolean
  unavailable: boolean
  onChange: (value: string) => void
}) {
  const clusters = Object.entries(counts).sort(([left], [right]) => Number(left) - Number(right))
  return (
    <label className="archive-cluster-filter">
      <span>{label}</span>
      <select
        value={selected}
        disabled={loading || unavailable}
        aria-label={`Filter by ${label}`}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">
          {unavailable ? 'Cluster filter unavailable' : loading ? 'Loading clusters…' : `All ${label} clusters`}
        </option>
        {clusters.map(([clusterId, count]) => (
          <option key={`${model}-${clusterId}`} value={clusterId}>
            Cluster {clusterId} ({count.toLocaleString()})
          </option>
        ))}
      </select>
    </label>
  )
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

// ── Source page viewer (OpenSeadragon, matching the Botanical Case Study) ──

function ArchiveSourceViewer({
  imageUrl,
  pageWidth,
  cropBox,
  detectorBox,
}: {
  imageUrl: string
  /** Width of the page image that cropBox/detectorBox coordinates are relative to. */
  pageWidth: number
  cropBox: [number, number, number, number]
  detectorBox: [number, number, number, number]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [, setTick] = useState(0)

  // Init OSD once per mount (component is keyed by crop_id).
  // Archive page images come through our own blob proxy, not a IIIF tiled
  // endpoint, so this always uses the "simple image" path — loaded without
  // CORS and rendered via the HTML drawer to avoid tainted-canvas issues.
  useEffect(() => {
    if (!containerRef.current) return
    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      tileSources: { type: 'image', url: imageUrl },
      crossOriginPolicy: false,
      drawer: 'html',
      showNavigationControl: false,
      showNavigator: false,
      defaultZoomLevel: 0,
      minZoomLevel: 0,
      maxZoomLevel: 10,
      gestureSettingsMouse: { scrollToZoom: false },
      gestureSettingsTouch: { scrollToZoom: false },
      constrainDuringPan: true,
      visibilityRatio: 1.0,
      animationTime: 0.5,
    })
    viewer.addHandler('open', () => setIsReady(true))
    osdRef.current = viewer
    return () => {
      viewer.destroy()
      osdRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rerender overlay on viewport change
  useEffect(() => {
    if (!isReady || !osdRef.current) return
    const update = () => setTick((t) => t + 1)
    const v = osdRef.current
    v.addHandler('animation', update)
    v.addHandler('canvas-drag', update)
    v.addHandler('resize', update)
    return () => {
      v.removeHandler('animation', update)
      v.removeHandler('canvas-drag', update)
      v.removeHandler('resize', update)
    }
  }, [isReady])

  const getBoxPath = (box: [number, number, number, number]): string | null => {
    const v = osdRef.current
    if (!v?.viewport) return null
    const [x1, y1, x2, y2] = box
    try {
      const corners: [number, number][] = [
        [x1, y1], [x2, y1], [x2, y2], [x1, y2],
      ]
      const pts = corners.map(([x, y]) => {
        const vp = new OpenSeadragon.Point(x / pageWidth, y / pageWidth)
        const cp = v.viewport.viewportToViewerElementCoordinates(vp)
        return `${cp.x},${cp.y}`
      })
      return `M ${pts.join(' L ')} Z`
    } catch {
      return null
    }
  }

  const cropPath = isReady ? getBoxPath(cropBox) : null
  const detectorPath = isReady ? getBoxPath(detectorBox) : null

  return (
    <div className="archive-viewer-wrap">
      <div ref={containerRef} className="archive-viewer-canvas" />

      {/* Minimal controls: zoom in, zoom out, reset */}
      <div className="archive-viewer-controls">
        <button
          type="button"
          className="archive-viewer-btn"
          title="Zoom in"
          onClick={() => osdRef.current?.viewport?.zoomBy(1.5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          type="button"
          className="archive-viewer-btn"
          title="Zoom out"
          onClick={() => osdRef.current?.viewport?.zoomBy(1 / 1.5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          type="button"
          className="archive-viewer-btn"
          title="Return to full view"
          onClick={() => osdRef.current?.viewport?.goHome()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Crop-box / detector-box overlay */}
      {(cropPath || detectorPath) && (
        <svg className="archive-viewer-overlay">
          {cropPath && (
            <path d={cropPath} className="archive-bbox-path archive-crop-box" vectorEffect="non-scaling-stroke" />
          )}
          {detectorPath && (
            <path d={detectorPath} className="archive-bbox-path archive-detector-box" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      )}

      <div className="archive-box-key"><span className="crop">Padded crop</span><span className="detector">DINO detection</span></div>
    </div>
  )
}

function ArchiveInspector({
  row,
  annotation,
  onClose,
  onSelectRow,
}: {
  row: number
  annotation?: HumanAnnotationRecord
  onClose: () => void
  onSelectRow: (row: number) => void
}) {
  const [item, setItem] = useState<ArchiveItem | null>(null)
  const [book, setBook] = useState<BookRecord | null>(null)
  const [geometry, setGeometry] = useState<ArchiveGeometry | null>(null)
  const [model, setModel] = useState<EmbeddingModel>('dinov2')
  const [neighbours, setNeighbours] = useState<Array<{ item: ArchiveItem; score: number }>>([])
  const [error, setError] = useState<string | null>(null)

  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Track mount status so the exit-animation onComplete never calls onClose
  // after the component has already been unmounted (e.g. a neighbour click
  // swaps in a fresh, differently-keyed instance before the tween finishes).
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])
  // Guards so the content/neighbour stagger-ins each fire once per reveal
  // rather than replaying every time an unrelated state update re-renders.
  const contentAnimatedRef = useRef(false)
  const neighboursAnimatedRef = useRef(false)

  // Animated close – plays exit tween, then unmounts.
  const animatedClose = useCallback(() => {
    const backdrop = backdropRef.current
    const card = cardRef.current
    if (!backdrop || !card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    // Block further interaction while animating out
    card.style.pointerEvents = 'none'
    gsap.to(backdrop, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    gsap.to(card, {
      opacity: 0,
      y: 20,
      scale: 0.96,
      duration: 0.28,
      ease: 'power3.in',
      onComplete: () => { if (isMountedRef.current) onClose() },
    })
  }, [onClose])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') animatedClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [animatedClose])

  // GSAP entrance – backdrop fade + card pop-in, runs once per mount.
  useEffect(() => {
    const backdrop = backdropRef.current
    const card = cardRef.current
    if (!backdrop || !card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'power2.out' })
    const tween = gsap.fromTo(
      card,
      { opacity: 0, y: 32, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.52, ease: 'power3.out', clearProps: 'transform' },
    )
    return () => { tween.kill() }
  }, [])

  // Content stagger-in – fires once the fetched item/geometry replace the
  // "Loading illustration details…" placeholder inside the card.
  useEffect(() => {
    if (!item || !geometry || contentAnimatedRef.current) return
    contentAnimatedRef.current = true
    const card = cardRef.current
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline()

    const sourcePage = card.querySelector('.archive-source-page')
    if (sourcePage) {
      tl.fromTo(
        sourcePage,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
      )
    }

    const metaEls = card.querySelectorAll('.archive-inspector-meta > *')
    if (metaEls.length) {
      tl.fromTo(
        metaEls,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' },
        '-=0.25',
      )
    }

    const neighboursSection = card.querySelector('.archive-neighbours')
    if (neighboursSection) {
      tl.fromTo(
        neighboursSection,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', clearProps: 'transform' },
        '-=0.08',
      )
    }

    return () => { tl.kill() }
  }, [item, geometry])

  // Reset the neighbour-thumb stagger guard whenever the embedding model
  // changes, so switching DINOv2 ↔ OpenCLIP re-plays the reveal for the new set.
  useEffect(() => { neighboursAnimatedRef.current = false }, [model])

  // Neighbour thumbs stagger in once their images have loaded for this model.
  useEffect(() => {
    if (!neighbours.length || neighboursAnimatedRef.current) return
    neighboursAnimatedRef.current = true
    const strip = cardRef.current?.querySelector('.archive-neighbour-strip')
    if (!strip || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const thumbs = strip.querySelectorAll('button')
    if (!thumbs.length) return
    gsap.fromTo(
      thumbs,
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, duration: 0.28, stagger: 0.04, ease: 'back.out(1.4)', clearProps: 'transform' },
    )
  }, [neighbours])

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
    <div
      className="archive-inspector-backdrop"
      ref={backdropRef}
      onPointerDown={(event) => { if (event.target === event.currentTarget) animatedClose() }}
    >
      <article className="archive-inspector" ref={cardRef} role="dialog" aria-modal="true" aria-label="Illustration details">
        <button type="button" className="archive-inspector-close" onClick={animatedClose} aria-label="Close illustration details">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {error && <p className="archive-error" role="alert">{error}</p>}
        {!item || !geometry ? <p className="archive-inspector-loading">Loading illustration details…</p> : (
          <>
            <div className="archive-inspector-main">
              <div className="archive-source-page">
                <ArchiveSourceViewer
                  key={item.crop_id}
                  imageUrl={pageImageUrl(item)}
                  pageWidth={geometry.pageWidth}
                  cropBox={geometry.cropBox}
                  detectorBox={geometry.detectorBox}
                />
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
                {annotation && (
                  <section className="archive-human-summary" aria-label="Human classification">
                    <p className="archive-kicker">Human classification</p>
                    <div className="archive-human-labels">
                      {annotation.subject_form_labels.map((label) => <span key={`subject-${label}`}>{humanLabel(label)}</span>)}
                      {annotation.domain_labels.map((label) => <span className="domain" key={`domain-${label}`}>{humanLabel(label)}</span>)}
                      {annotation.disposition === 'exclude_unusable_crop' && <span className="unusable">Unusable crop</span>}
                    </div>
                    {annotation.quality_flags.length > 0 && <p className="archive-quality-flags">{annotation.quality_flags.map(humanLabel).join(' · ')}</p>}
                  </section>
                )}
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
  const [humanAnnotations, setHumanAnnotations] = useState<HumanAnnotationIndex | null>(null)
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedAspect, setSelectedAspect] = useState('all')
  const [selectedCentury, setSelectedCentury] = useState('all')
  const [selectedDinov2Cluster, setSelectedDinov2Cluster] = useState('all')
  const [selectedOpenclipCluster, setSelectedOpenclipCluster] = useState('all')
  const [selectedHumanStatus, setSelectedHumanStatus] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [dinov2Clusters, setDinov2Clusters] = useState<Int16Array | null>(null)
  const [openclipClusters, setOpenclipClusters] = useState<Int16Array | null>(null)
  const [clusterError, setClusterError] = useState<string | null>(null)
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

  useEffect(() => {
    let active = true
    fetchHumanAnnotationIndex()
      .then((annotations) => { if (active) setHumanAnnotations(annotations) })
      .catch(() => { if (active) setHumanAnnotations(null) })
    return () => { active = false }
  }, [])

  const annotationsByRow = useMemo(
    () => new Map(humanAnnotations?.records.map((record) => [record.row_index, record]) ?? []),
    [humanAnnotations],
  )

  useEffect(() => {
    let active = true
    Promise.all([fetchClusterLabels('dinov2'), fetchClusterLabels('openclip')])
      .then(([dinov2, openclip]) => {
        if (!active) return
        setDinov2Clusters(dinov2)
        setOpenclipClusters(openclip)
      })
      .catch((reason) => {
        if (active) setClusterError(reason instanceof Error ? reason.message : String(reason))
      })
    return () => { active = false }
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
    return intersectRows(index.displayRows ?? Array.from({ length: index.cropCount }, (_, row) => row), [
      rowsForFacet(index.facets.sources, selectedSource),
      rowsForFacet(index.facets.confidenceTiers, selectedTier),
      rowsForFacet(index.facets.aspects, selectedAspect),
      rowsForFacet(index.facets.centuries, selectedCentury),
      rowsForCluster(dinov2Clusters, selectedDinov2Cluster),
      rowsForCluster(openclipClusters, selectedOpenclipCluster),
      rowsForHumanStatus(humanAnnotations, selectedHumanStatus, index.cropCount),
      rowsForHumanLabel(humanAnnotations, 'subject', selectedSubject),
      rowsForHumanLabel(humanAnnotations, 'domain', selectedDomain),
      searchRows,
    ])
  }, [dinov2Clusters, humanAnnotations, index, openclipClusters, searchRows, selectedAspect, selectedCentury, selectedDinov2Cluster, selectedDomain, selectedHumanStatus, selectedOpenclipCluster, selectedSource, selectedSubject, selectedTier])

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
    setSelectedCentury('all')
    setSelectedDinov2Cluster('all')
    setSelectedOpenclipCluster('all')
    setSelectedHumanStatus('all')
    setSelectedSubject('all')
    setSelectedDomain('all')
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
          <fieldset className="archive-human-filters">
            <legend>Human classification</legend>
            <label>
              <span>Status</span>
              <select value={selectedHumanStatus} disabled={!humanAnnotations} onChange={(event) => changeFilter(setSelectedHumanStatus)(event.target.value)}>
                <option value="all">All illustrations</option>
                <option value="annotated">Human annotated ({humanAnnotations?.recordCount.toLocaleString() ?? '…'})</option>
                <option value="not_annotated">Not annotated</option>
                <option value="include">Usable</option>
                <option value="exclude_unusable_crop">Unusable crop</option>
              </select>
            </label>
            <label>
              <span>Subject / form</span>
              <select value={selectedSubject} disabled={!humanAnnotations} onChange={(event) => changeFilter(setSelectedSubject)(event.target.value)}>
                <option value="all">All subjects / forms</option>
                {humanAnnotations?.labels.subjectForm.filter((label) => label.count > 0).map((label) => (
                  <option key={label.id} value={label.id}>{label.label} ({label.count.toLocaleString()})</option>
                ))}
              </select>
            </label>
            <label>
              <span>Knowledge domain</span>
              <select value={selectedDomain} disabled={!humanAnnotations} onChange={(event) => changeFilter(setSelectedDomain)(event.target.value)}>
                <option value="all">All domains</option>
                {humanAnnotations?.labels.domain.filter((label) => label.count > 0).map((label) => (
                  <option key={label.id} value={label.id}>{label.label} ({label.count.toLocaleString()})</option>
                ))}
              </select>
            </label>
          </fieldset>
          <fieldset className="archive-cluster-filters">
            <legend>Embedding clusters</legend>
            <ClusterSelect
              label="DINOv2"
              model="dinov2"
              selected={selectedDinov2Cluster}
              counts={index.embeddingMaps.dinov2.clusters.counts}
              loading={!dinov2Clusters && !clusterError}
              unavailable={Boolean(clusterError)}
              onChange={changeFilter(setSelectedDinov2Cluster)}
            />
            <ClusterSelect
              label="OpenCLIP"
              model="openclip"
              selected={selectedOpenclipCluster}
              counts={index.embeddingMaps.openclip.clusters.counts}
              loading={!openclipClusters && !clusterError}
              unavailable={Boolean(clusterError)}
              onChange={changeFilter(setSelectedOpenclipCluster)}
            />
            {clusterError && <p className="archive-cluster-error" role="status">Cluster filters unavailable: {clusterError}</p>}
          </fieldset>
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
                const annotation = annotationsByRow.get(item.row_index)
                return (
                  <button key={item.crop_id} type="button" className="archive-card" onClick={() => setSelectedRow(item.row_index)}>
                    <div className="archive-card-image"><img src={cropImageUrl(item)} alt={`Illustration from ${book?.title ?? item.item_id}`} loading="lazy" /></div>
                    <div className="archive-card-tags"><span>{book?.sourceLabel ?? item.source}</span><span>{Math.round(item.confidence * 100)}%</span></div>
                    {annotation && <div className="archive-card-human"><span>Human reviewed</span>{annotation.subject_form_labels.slice(0, 2).map((label) => <span key={label}>{humanLabel(label)}</span>)}</div>}
                    <h3>{book?.title ?? item.item_id}</h3>
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

      {selectedRow != null && <ArchiveInspector key={selectedRow} row={selectedRow} annotation={annotationsByRow.get(selectedRow)} onClose={() => setSelectedRow(null)} onSelectRow={setSelectedRow} />}
    </div>
  )
}
