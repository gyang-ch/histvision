import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cropThumbnailUrl,
  fetchArchiveIndex,
  fetchArchiveItems,
  fetchBookMap,
  fetchEmbeddingMap,
  fetchNeighbours,
  type ArchiveIndex,
  type ArchiveItem,
  type EmbeddingModel,
} from '../../data/archiveData'
import type { BookRecord } from '../../data/books'

const SOURCE_COLOURS = ['#17694e', '#9b5c2e', '#466a9f', '#8060a8', '#b2495d', '#527c8b', '#8a7135', '#4f7b45']
const NEIGHBOUR_COUNT = 12

function clusterColour(cluster: number) {
  const hue = (cluster * 137.508) % 360
  return `hsl(${hue} 48% 48%)`
}

function bookKey(source: string, itemId: string) {
  return `${source}\0${itemId}`
}

interface MapData {
  coordinates: Float32Array
  clusters: Int16Array
}

interface HoverPreview {
  row: number
  x: number
  y: number
  item: ArchiveItem | null
}

interface NeighbourPreview {
  row: number
  score: number
  item: ArchiveItem | null
}

export function DinoIllustrationNetwork({ onSelectRow }: { onSelectRow: (row: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, panX: 0, panY: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const itemCacheRef = useRef(new Map<number, ArchiveItem>())
  const [index, setIndex] = useState<ArchiveIndex | null>(null)
  const [books, setBooks] = useState<Map<string, BookRecord>>(new Map())
  const [data, setData] = useState<MapData | null>(null)
  const [model, setModel] = useState<EmbeddingModel>('dinov2')
  const [colourMode, setColourMode] = useState<'source' | 'cluster'>('source')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null)
  const [neighbours, setNeighbours] = useState<NeighbourPreview[]>([])
  const [selectionLoading, setSelectionLoading] = useState(false)
  const [neighbourError, setNeighbourError] = useState(false)
  const [hover, setHover] = useState<HoverPreview | null>(null)

  const sourceRows = useMemo(() => index?.facets.sources.map((facet) => facet.rows) ?? [], [index])
  const sourceByRow = useMemo(() => {
    if (!index) return null
    const lookup = new Int16Array(index.cropCount).fill(-1)
    index.facets.sources.forEach((facet, sourceIndex) => facet.rows.forEach((row) => { lookup[row] = sourceIndex }))
    return lookup
  }, [index])
  const clusterRows = useMemo(() => {
    const grouped = new Map<number, number[]>()
    if (!data) return grouped
    for (let row = 0; row < data.clusters.length; row += 1) {
      const cluster = data.clusters[row]
      const rows = grouped.get(cluster) ?? []
      rows.push(row)
      grouped.set(cluster, rows)
    }
    return grouped
  }, [data])

  const selectedBook = selectedItem ? books.get(bookKey(selectedItem.source, selectedItem.item_id)) : undefined
  const selectedSource = selectedItem && index
    ? index.facets.sources.find((source) => source.id === selectedItem.source)?.label ?? selectedItem.source
    : ''

  useEffect(() => {
    Promise.all([fetchArchiveIndex(), fetchBookMap()])
      .then(([nextIndex, nextBooks]) => { setIndex(nextIndex); setBooks(nextBooks) })
      .catch((reason) => setError(String(reason)))
  }, [])

  useEffect(() => {
    let active = true
    fetchEmbeddingMap(model)
      .then((result) => { if (active) setData(result) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [model])

  useEffect(() => {
    if (selectedRow == null || !index) return
    let active = true
    Promise.allSettled([fetchArchiveItems([selectedRow], index), fetchNeighbours(selectedRow, model)])
      .then(async ([itemResult, neighbourResult]) => {
        if (!active) return
        const items = itemResult.status === 'fulfilled' ? itemResult.value : []
        setSelectedItem(items[0] ?? null)
        items.forEach((item) => itemCacheRef.current.set(item.row_index, item))
        if (neighbourResult.status !== 'fulfilled') {
          setNeighbourError(true)
          return
        }
        const record = neighbourResult.value
        const rows = record.top_200_indices.slice(0, NEIGHBOUR_COUNT)
        const cached = rows.map((row) => itemCacheRef.current.get(row))
        const missingRows = rows.filter((_, position) => !cached[position])
        const fetched = missingRows.length ? await fetchArchiveItems(missingRows, index) : []
        fetched.forEach((item) => itemCacheRef.current.set(item.row_index, item))
        if (!active) return
        setNeighbours(rows.map((row, position) => ({ row, score: record.top_200_scores[position], item: itemCacheRef.current.get(row) ?? null })))
      })
      .catch(() => { if (active) setNeighbourError(true) })
      .finally(() => { if (active) setSelectionLoading(false) })
    return () => { active = false }
  }, [index, model, selectedRow])

  useEffect(() => {
    if (!hover || hover.item || !index) return
    const row = hover.row
    const timeout = window.setTimeout(() => {
      const cached = itemCacheRef.current.get(row)
      if (cached) {
        setHover((current) => current?.row === row ? { ...current, item: cached } : current)
        return
      }
      fetchArchiveItems([row], index).then(([item]) => {
        if (!item) return
        itemCacheRef.current.set(row, item)
        setHover((current) => current?.row === row ? { ...current, item } : current)
      }).catch(() => undefined)
    }, 90)
    return () => window.clearTimeout(timeout)
  }, [hover, index])

  const pointPosition = useCallback((row: number, width: number, height: number) => {
    if (!data) return { x: 0, y: 0 }
    const padding = 20
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2
    const { scale, panX, panY } = transformRef.current
    return {
      x: padding + (((data.coordinates[row * 2] - 0.5) * scale + 0.5) * plotWidth) + panX,
      y: padding + (((data.coordinates[row * 2 + 1] - 0.5) * scale + 0.5) * plotHeight) + panY,
    }
  }, [data])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = wrapRef.current
    if (!canvas || !wrapper || !data || !index) return
    const rect = wrapper.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = '#f5f2ea'
    context.fillRect(0, 0, width, height)

    const { scale } = transformRef.current
    const pointSize = Math.max(1.15, Math.min(3.2, 1.15 * Math.sqrt(scale)))
    const selectedRows = new Set(neighbours.map((neighbour) => neighbour.row))
    context.globalAlpha = selectedRow != null ? 0.1 : scale > 2 ? 0.72 : 0.46
    const paintGroup = (rows: number[], colour: string) => {
      context.fillStyle = colour
      context.beginPath()
      rows.forEach((row) => {
        const { x, y } = pointPosition(row, width, height)
        if (x < -3 || y < -3 || x > width + 3 || y > height + 3) return
        context.rect(x, y, pointSize, pointSize)
      })
      context.fill()
    }
    if (colourMode === 'source') sourceRows.forEach((rows, sourceIndex) => paintGroup(rows, SOURCE_COLOURS[sourceIndex % SOURCE_COLOURS.length]))
    else clusterRows.forEach((rows, cluster) => paintGroup(rows, clusterColour(cluster)))

    if (selectedRow != null) {
      const selectedPosition = pointPosition(selectedRow, width, height)
      context.globalAlpha = 0.35
      context.strokeStyle = '#17694e'
      context.lineWidth = 1
      neighbours.forEach(({ row }) => {
        const position = pointPosition(row, width, height)
        context.beginPath()
        context.moveTo(selectedPosition.x, selectedPosition.y)
        context.lineTo(position.x, position.y)
        context.stroke()
      })
      context.globalAlpha = 0.92
      selectedRows.forEach((row) => {
        const { x, y } = pointPosition(row, width, height)
        const sourceIndex = sourceByRow?.[row] ?? -1
        context.beginPath()
        context.arc(x, y, Math.max(3, pointSize + 1), 0, Math.PI * 2)
        context.fillStyle = colourMode === 'source' ? SOURCE_COLOURS[Math.max(0, sourceIndex) % SOURCE_COLOURS.length] : clusterColour(data.clusters[row])
        context.fill()
        context.strokeStyle = '#fff'
        context.lineWidth = 1.25
        context.stroke()
      })
      context.globalAlpha = 1
      context.beginPath()
      context.arc(selectedPosition.x, selectedPosition.y, 8, 0, Math.PI * 2)
      context.fillStyle = '#fff'
      context.fill()
      context.lineWidth = 2.5
      context.strokeStyle = '#102f24'
      context.stroke()
    }

    if (hover && hover.row !== selectedRow) {
      const { x, y } = pointPosition(hover.row, width, height)
      context.globalAlpha = 1
      context.beginPath()
      context.arc(x, y, 6, 0, Math.PI * 2)
      context.strokeStyle = '#111827'
      context.lineWidth = 2
      context.stroke()
    }
    context.globalAlpha = 1
  }, [clusterRows, colourMode, data, hover, index, neighbours, pointPosition, selectedRow, sourceByRow, sourceRows])

  useEffect(() => {
    draw()
    const resize = new ResizeObserver(draw)
    if (wrapRef.current) resize.observe(wrapRef.current)
    return () => resize.disconnect()
  }, [draw])

  const findNearest = useCallback((clientX: number, clientY: number) => {
    const wrapper = wrapRef.current
    if (!wrapper || !data) return null
    const rect = wrapper.getBoundingClientRect()
    let nearest = -1
    let bestDistance = 196
    for (let row = 0; row < data.coordinates.length / 2; row += 1) {
      const { x, y } = pointPosition(row, rect.width, rect.height)
      const dx = x - (clientX - rect.left)
      const dy = y - (clientY - rect.top)
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) { bestDistance = distance; nearest = row }
    }
    return nearest >= 0 ? nearest : null
  }, [data, pointPosition])

  const zoomAt = (nextScale: number, clientX?: number, clientY?: number) => {
    const wrapper = wrapRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const previous = transformRef.current
    const scale = Math.max(0.8, Math.min(12, nextScale))
    const anchorX = clientX == null ? rect.width / 2 : clientX - rect.left
    const anchorY = clientY == null ? rect.height / 2 : clientY - rect.top
    const centreX = rect.width / 2
    const centreY = rect.height / 2
    previous.panX = anchorX - centreX - ((anchorX - centreX - previous.panX) / previous.scale) * scale
    previous.panY = anchorY - centreY - ((anchorY - centreY - previous.panY) / previous.scale) * scale
    previous.scale = scale
    draw()
  }

  const resetView = () => {
    transformRef.current = { scale: 1, panX: 0, panY: 0 }
    setSelectedRow(null)
    setHover(null)
    draw()
  }

  const selectRow = (row: number) => {
    setSelectedItem(null)
    setNeighbours([])
    setNeighbourError(false)
    setSelectionLoading(true)
    setSelectedRow(row)
    setHover(null)
  }
  const selectModel = (value: EmbeddingModel) => {
    if (value === model) return
    setLoading(true)
    setError(null)
    setSelectedItem(null)
    setNeighbours([])
    setNeighbourError(false)
    if (selectedRow != null) setSelectionLoading(true)
    setModel(value)
  }
  const hoverBook = hover?.item ? books.get(bookKey(hover.item.source, hover.item.item_id)) : undefined

  return (
    <section className="archive-network" aria-labelledby="archive-network-heading">
      <div className="archive-section-heading">
        <div>
          <h2 id="archive-network-heading">Illustration Similarity Map</h2>
          <p id="archive-network-description">
            All {index?.cropCount.toLocaleString() ?? '…'} illustrations in a two-dimensional UMAP projection.
            Nearby points have similar image embeddings; the horizontal and vertical positions have no independent meaning.
          </p>
        </div>
        <div className="archive-network-controls">
          <div role="group" aria-label="Embedding model">
            {(['dinov2', 'openclip'] as EmbeddingModel[]).map((value) => (
              <button key={value} type="button" aria-pressed={model === value} className={model === value ? 'active' : ''} onClick={() => selectModel(value)}>
                {value === 'dinov2' ? 'DINOv2' : 'OpenCLIP'}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Point colour">
            <button type="button" aria-pressed={colourMode === 'source'} className={colourMode === 'source' ? 'active' : ''} onClick={() => setColourMode('source')}>Library colour</button>
            <button type="button" aria-pressed={colourMode === 'cluster'} className={colourMode === 'cluster' ? 'active' : ''} onClick={() => setColourMode('cluster')}>K-means colour</button>
          </div>
        </div>
      </div>

      <div className="archive-network-workspace">
        <div
          ref={wrapRef}
          className="archive-network-canvas"
          role="img"
          aria-describedby="archive-network-description archive-network-instructions"
          onWheel={(event) => { event.preventDefault(); zoomAt(transformRef.current.scale * (event.deltaY < 0 ? 1.18 : 0.85), event.clientX, event.clientY) }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            dragRef.current = { x: event.clientX, y: event.clientY, panX: transformRef.current.panX, panY: transformRef.current.panY }
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current
            if (drag) {
              transformRef.current.panX = drag.panX + event.clientX - drag.x
              transformRef.current.panY = drag.panY + event.clientY - drag.y
              setHover(null)
              draw()
              return
            }
            if (event.pointerType !== 'mouse') return
            const row = findNearest(event.clientX, event.clientY)
            const rect = event.currentTarget.getBoundingClientRect()
            setHover(row == null ? null : (current) => current?.row === row
              ? { ...current, x: event.clientX - rect.left, y: event.clientY - rect.top }
              : { row, x: event.clientX - rect.left, y: event.clientY - rect.top, item: itemCacheRef.current.get(row) ?? null })
          }}
          onPointerLeave={() => { if (!dragRef.current) setHover(null) }}
          onPointerUp={(event) => {
            const drag = dragRef.current
            dragRef.current = null
            if (drag && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) {
              const row = findNearest(event.clientX, event.clientY)
              if (row != null) selectRow(row)
            }
          }}
        >
          <canvas ref={canvasRef} aria-hidden="true" />
          <div className="archive-network-map-tools" aria-label="Map controls">
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoomAt(transformRef.current.scale * 1.35)}>+</button>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoomAt(transformRef.current.scale / 1.35)}>−</button>
            <button type="button" aria-label="Reset map view and selection" title="Reset map view" onClick={resetView}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v6h6M20 20v-6h-6M5.1 15a8 8 0 0 0 13.4 2M18.9 9A8 8 0 0 0 5.5 7" /></svg>
            </button>
          </div>
          <p id="archive-network-instructions" className="archive-network-instructions">Scroll to zoom · drag to move · hover to preview · click to select</p>
          {hover && (
            <div className="archive-network-tooltip" style={{ left: hover.x, top: hover.y }}>
              {hover.item ? <>
                <img src={cropThumbnailUrl(hover.item)} alt="" />
                <span><strong>{hoverBook?.title ?? hover.item.item_id}</strong><small>{hoverBook?.sourceLabel ?? hover.item.source}{hoverBook?.dateLabel ? ` · ${hoverBook.dateLabel}` : ''}</small></span>
              </> : <span>Loading preview…</span>}
            </div>
          )}
          {(loading || error) && <div className="archive-network-status" role={error ? 'alert' : 'status'}>{error || `Loading ${model === 'dinov2' ? 'DINOv2' : 'OpenCLIP'} map…`}</div>}
        </div>

        <aside className="archive-network-detail" aria-live="polite" aria-label="Selected illustration">
          {selectedRow == null ? (
            <div className="archive-network-empty">
              <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="15" cy="17" r="4" /><circle cx="31" cy="13" r="3" /><circle cx="33" cy="31" r="5" /><path d="m18.5 18.5 9.5-4M18 20l11 8" /></svg>
              <h3>Select an illustration</h3>
              <p>Choose any point to reveal the illustration and its closest visual neighbours without leaving the map.</p>
            </div>
          ) : selectionLoading && !selectedItem ? <p className="archive-network-detail-loading">Loading selection…</p> : selectedItem ? <>
            <img className="archive-network-selected-image" src={cropThumbnailUrl(selectedItem)} alt={`Selected illustration from ${selectedBook?.title ?? selectedItem.item_id}`} />
            <div className="archive-network-selected-copy">
              <span className="archive-network-selected-label">Selected illustration</span>
              <h3>{selectedBook?.title ?? selectedItem.item_id}</h3>
              <p>{selectedSource}{selectedBook?.dateLabel ? ` · ${selectedBook.dateLabel}` : ''}</p>
              <dl>
                <div><dt>Model</dt><dd>{model === 'dinov2' ? 'DINOv2' : 'OpenCLIP'}</dd></div>
                <div><dt>Cluster</dt><dd>{data?.clusters[selectedRow] ?? '—'}</dd></div>
                <div><dt>Confidence</dt><dd>{Math.round(selectedItem.confidence * 100)}%</dd></div>
              </dl>
              <button type="button" className="archive-network-open" onClick={() => onSelectRow(selectedRow)}>View full record</button>
            </div>
            <div className="archive-network-neighbours">
              <div><h4>Nearest neighbours</h4><span>{neighbours.length} shown</span></div>
              <div className="archive-network-neighbour-grid">
                {neighbours.map((neighbour, position) => neighbour.item && (
                  <button key={neighbour.row} type="button" onClick={() => selectRow(neighbour.row)} title={`Similarity ${neighbour.score.toFixed(3)}`}>
                    <img src={cropThumbnailUrl(neighbour.item)} alt={`Similar illustration ${position + 1}`} loading="lazy" />
                    <span>{Math.round(neighbour.score * 100)}%</span>
                  </button>
                ))}
              </div>
              {neighbourError && <p className="archive-network-neighbour-error">Nearest neighbours are temporarily unavailable.</p>}
            </div>
          </> : <p className="archive-network-detail-loading">This illustration could not be loaded.</p>}
        </aside>
      </div>

      {colourMode === 'source' && index && (
        <div className="archive-network-legend" aria-label="Library colour legend">
          {index.facets.sources.map((source, sourceIndex) => <span key={source.id}><i style={{ background: SOURCE_COLOURS[sourceIndex % SOURCE_COLOURS.length] }} />{source.label} <small>{source.count.toLocaleString()}</small></span>)}
        </div>
      )}
      {colourMode === 'cluster' && index && <p className="archive-network-cluster-note">Colours distinguish {index.embeddingMaps[model].clusters.cluster_count.toLocaleString()} computational clusters. Select a point to see its cluster number.</p>}
    </section>
  )
}
