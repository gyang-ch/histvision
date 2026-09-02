import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchArchiveIndex,
  fetchEmbeddingMap,
  type ArchiveIndex,
  type EmbeddingModel,
} from '../../data/archiveData'

const SOURCE_COLOURS = ['#17694e', '#9b5c2e', '#466a9f', '#8060a8', '#b2495d', '#527c8b', '#8a7135', '#4f7b45']

function clusterColour(cluster: number) {
  const hue = (cluster * 137.508) % 360
  return `hsl(${hue} 48% 48%)`
}

interface MapData {
  coordinates: Float32Array
  clusters: Int16Array
}

export function DinoIllustrationNetwork({ onSelectRow }: { onSelectRow: (row: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, panX: 0, panY: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const [index, setIndex] = useState<ArchiveIndex | null>(null)
  const [data, setData] = useState<MapData | null>(null)
  const [model, setModel] = useState<EmbeddingModel>('dinov2')
  const [colourMode, setColourMode] = useState<'source' | 'cluster'>('source')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  const sourceRows = useMemo(() => index?.facets.sources.map((facet) => facet.rows) ?? [], [index])
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

  useEffect(() => {
    fetchArchiveIndex().then(setIndex).catch((reason) => setError(String(reason)))
  }, [])

  useEffect(() => {
    let active = true
    fetchEmbeddingMap(model)
      .then((result) => { if (active) setData(result) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [model])

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

    const padding = 20
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2
    const { scale, panX, panY } = transformRef.current
    const pointSize = Math.max(1.15, Math.min(3, 1.15 * Math.sqrt(scale)))
    const xAt = (row: number) => padding + (((data.coordinates[row * 2] - 0.5) * scale + 0.5) * plotWidth) + panX
    const yAt = (row: number) => padding + (((data.coordinates[row * 2 + 1] - 0.5) * scale + 0.5) * plotHeight) + panY

    context.globalAlpha = scale > 2 ? 0.72 : 0.46
    if (colourMode === 'source') {
      sourceRows.forEach((rows, sourceIndex) => {
        context.fillStyle = SOURCE_COLOURS[sourceIndex % SOURCE_COLOURS.length]
        context.beginPath()
        rows.forEach((row) => {
          const x = xAt(row)
          const y = yAt(row)
          if (x < -3 || y < -3 || x > width + 3 || y > height + 3) return
          context.rect(x, y, pointSize, pointSize)
        })
        context.fill()
      })
    } else {
      clusterRows.forEach((rows, cluster) => {
        context.fillStyle = clusterColour(cluster)
        context.beginPath()
        rows.forEach((row) => {
          const x = xAt(row)
          const y = yAt(row)
          if (x < -3 || y < -3 || x > width + 3 || y > height + 3) return
          context.rect(x, y, pointSize, pointSize)
        })
        context.fill()
      })
    }
    context.globalAlpha = 1

    if (selectedRow != null) {
      const x = xAt(selectedRow)
      const y = yAt(selectedRow)
      context.beginPath()
      context.arc(x, y, 7, 0, Math.PI * 2)
      context.fillStyle = '#fff'
      context.fill()
      context.lineWidth = 2
      context.strokeStyle = '#111827'
      context.stroke()
    }
  }, [clusterRows, colourMode, data, index, selectedRow, sourceRows])

  useEffect(() => {
    draw()
    const resize = new ResizeObserver(draw)
    if (wrapRef.current) resize.observe(wrapRef.current)
    return () => resize.disconnect()
  }, [draw])

  const findNearest = (clientX: number, clientY: number) => {
    const wrapper = wrapRef.current
    if (!wrapper || !data) return null
    const rect = wrapper.getBoundingClientRect()
    const padding = 20
    const plotWidth = rect.width - padding * 2
    const plotHeight = rect.height - padding * 2
    const { scale, panX, panY } = transformRef.current
    let nearest = -1
    let bestDistance = 144
    for (let row = 0; row < data.coordinates.length / 2; row += 1) {
      const x = padding + (((data.coordinates[row * 2] - 0.5) * scale + 0.5) * plotWidth) + panX
      const y = padding + (((data.coordinates[row * 2 + 1] - 0.5) * scale + 0.5) * plotHeight) + panY
      const dx = x - (clientX - rect.left)
      const dy = y - (clientY - rect.top)
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        nearest = row
      }
    }
    return nearest >= 0 ? nearest : null
  }

  const resetView = () => {
    transformRef.current = { scale: 1, panX: 0, panY: 0 }
    setSelectedRow(null)
    draw()
  }

  return (
    <section className="archive-network" aria-labelledby="archive-network-heading">
      <div className="archive-section-heading">
        <div>
          <h2 id="archive-network-heading">Illustration Network</h2>
          <p>
            All {index?.cropCount.toLocaleString() ?? '…'} illustrations positioned in a precomputed UMAP projection.
            Nearby points have similar embeddings. Click a point to inspect it and its nearest neighbours.
          </p>
        </div>
        <div className="archive-network-controls">
          <div role="group" aria-label="Embedding model">
            {(['dinov2', 'openclip'] as EmbeddingModel[]).map((value) => (
              <button key={value} type="button" className={model === value ? 'active' : ''} onClick={() => { setLoading(true); setError(null); setModel(value) }}>
                {value === 'dinov2' ? 'DINOv2' : 'OpenCLIP'}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Point colour">
            <button type="button" className={colourMode === 'source' ? 'active' : ''} onClick={() => setColourMode('source')}>Library colour</button>
            <button type="button" className={colourMode === 'cluster' ? 'active' : ''} onClick={() => setColourMode('cluster')}>K-means colour</button>
          </div>
          <button type="button" onClick={resetView}>Reset view</button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="archive-network-canvas"
        onWheel={(event) => {
          event.preventDefault()
          const nextScale = Math.max(0.8, Math.min(12, transformRef.current.scale * (event.deltaY < 0 ? 1.18 : 0.85)))
          transformRef.current.scale = nextScale
          draw()
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = { x: event.clientX, y: event.clientY, panX: transformRef.current.panX, panY: transformRef.current.panY }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag) return
          transformRef.current.panX = drag.panX + event.clientX - drag.x
          transformRef.current.panY = drag.panY + event.clientY - drag.y
          draw()
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current
          dragRef.current = null
          if (drag && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) {
            const row = findNearest(event.clientX, event.clientY)
            if (row != null) {
              setSelectedRow(row)
              onSelectRow(row)
            }
          }
        }}
      >
        <canvas ref={canvasRef} aria-label={`${model} UMAP projection of the illustration corpus`} />
        {(loading || error) && (
          <div className="archive-network-status" role={error ? 'alert' : 'status'}>
            {error || `Loading ${model === 'dinov2' ? 'DINOv2' : 'OpenCLIP'} map…`}
          </div>
        )}
      </div>

      {colourMode === 'source' && index && (
        <div className="archive-network-legend" aria-label="Library colour legend">
          {index.facets.sources.map((source, sourceIndex) => (
            <span key={source.id}><i style={{ background: SOURCE_COLOURS[sourceIndex % SOURCE_COLOURS.length] }} />{source.label}</span>
          ))}
        </div>
      )}
    </section>
  )
}
