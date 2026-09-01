import { useState, useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { IllustrationPopup, AZURE_BASE, AZURE_SAS } from '../Illustrations/Illustrations'
import type { IllustrationPhoto } from '../Illustrations/Illustrations'
import { type IllustrationRecord, fetchIllustrations } from '../../data/illustrationsCache'
import './IllustrationNetwork.css'
const TOP_K_EDGES = 3

const CLUSTER_COLORS: Record<number, string> = {
  '-1': '#64748b',
  0: '#34d399',
  1: '#f59e0b',
  2: '#38bdf8',
  3: '#a78bfa',
  4: '#f472b6',
}

function clusterColor(id: number): string {
  return CLUSTER_COLORS[id] ?? '#94a3b8'
}

function clusterLabel(id: number): string {
  return id === -1 ? 'Noise / Unclustered' : `Cluster ${id}`
}

function makePhotoMap(records: IllustrationRecord[]): Map<string, IllustrationPhoto> {
  const map = new Map<string, IllustrationPhoto>()
  for (const r of records) {
    map.set(r.illustration_id, {
      src: `${AZURE_BASE}/${r.illustration.crop_image}?${AZURE_SAS}`,
      width: r.illustration.width,
      height: r.illustration.height,
      key: r.illustration_id,
      record: r,
    })
  }
  return map
}

function buildGraph(records: IllustrationRecord[]): Graph {
  const graph = new Graph({ multi: false, type: 'undirected' })
  const nodeSet = new Set(records.map((r) => r.illustration_id))

  // Seed positions by cluster so ForceAtlas2 converges faster
  const clusterIds = [...new Set(records.map((r) => r.cluster.cluster_id))]
  const nonNoise = clusterIds.filter((id) => id !== -1)
  const clusterCenters = new Map<number, { cx: number; cy: number }>()
  nonNoise.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / Math.max(nonNoise.length, 1)
    clusterCenters.set(id, { cx: Math.cos(angle) * 6, cy: Math.sin(angle) * 6 })
  })
  clusterCenters.set(-1, { cx: 0, cy: 0 })

  for (const r of records) {
    const { cx, cy } = clusterCenters.get(r.cluster.cluster_id) ?? { cx: 0, cy: 0 }
    const spread = r.cluster.cluster_id === -1 ? 8 : 3
    graph.addNode(r.illustration_id, {
      x: cx + (Math.random() - 0.5) * spread,
      y: cy + (Math.random() - 0.5) * spread,
      size: 4,
      color: clusterColor(r.cluster.cluster_id),
      label: r.book.title,
      record: r,
    })
  }

  for (const r of records) {
    let added = 0
    for (const neighborId of r.neighbors ?? []) {
      if (added >= TOP_K_EDGES) break
      if (!nodeSet.has(neighborId)) continue
      if (graph.hasEdge(r.illustration_id, neighborId)) continue
      try {
        graph.addEdge(r.illustration_id, neighborId)
        added++
      } catch {
        // ignore duplicate-edge errors
      }
    }
  }

  const N = records.length
  forceAtlas2.assign(graph, {
    iterations: N > 1500 ? 100 : N > 500 ? 150 : 300,
    settings: {
      gravity: 0.05,
      scalingRatio: 15,
      strongGravityMode: false,
      linLogMode: false,
      adjustSizes: false,
      barnesHutOptimize: N > 400,
      barnesHutTheta: 0.5,
      slowDown: 3,
    },
  })

  return graph
}

// ── Embeddable section component ───────────────────────────

export function IllustrationNetworkSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const [dataLoading, setDataLoading] = useState(true)
  const [graphBuilding, setGraphBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<IllustrationPhoto | null>(null)
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })
  const [clusterCounts, setClusterCounts] = useState<Map<number, number>>(new Map())

  const photoMapRef = useRef<Map<string, IllustrationPhoto>>(new Map())

  // Close popup on Esc / click outside the popup or sigma canvas
  useEffect(() => {
    if (!selectedPhoto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedPhoto(null) }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (popupRef.current?.contains(target)) return
      if ((target as Element).closest?.('.illus-network-sigma')) return
      setSelectedPhoto(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [selectedPhoto])

  // Load data + build graph (file is browser-cached from the Illustrations tab)
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    fetchIllustrations()
      .then((records) => {
        if (cancelled) return

        photoMapRef.current = makePhotoMap(records)

        const counts = new Map<number, number>()
        for (const r of records) {
          const id = r.cluster.cluster_id
          counts.set(id, (counts.get(id) ?? 0) + 1)
        }
        setClusterCounts(counts)
        setDataLoading(false)
        setGraphBuilding(true)

        // Flush the "building…" spinner to the DOM before ForceAtlas2 blocks the thread
        timeoutId = setTimeout(() => {
          if (cancelled || !containerRef.current) return

          const graph = buildGraph(records)
          if (cancelled) return

          setStats({ nodes: graph.order, edges: graph.size })

          sigmaRef.current?.kill()
          sigmaRef.current = null
          if (cancelled) return

          let hoveredNode: string | null = null
          let hoveredNeighborSet = new Set<string>()

          const sigma = new Sigma(graph, containerRef.current!, {
            labelFont: 'Inter, sans-serif',
            labelSize: 10,
            labelWeight: '400',
            labelColor: { color: '#cbd5e1' },
            labelRenderedSizeThreshold: 18,
            defaultEdgeColor: '#334155',
            nodeReducer: (_node, data) => {
              if (hoveredNode === null) return data
              const isLit = _node === hoveredNode || hoveredNeighborSet.has(_node)
              return { ...data, color: isLit ? data.color : '#1a2332', zIndex: isLit ? 1 : 0 }
            },
            edgeReducer: (edge, data) => {
              if (hoveredNode === null) return { ...data, hidden: true }
              const src = graph.source(edge)
              const tgt = graph.target(edge)
              return {
                ...data,
                hidden: src !== hoveredNode && tgt !== hoveredNode,
                color: '#64748b',
                size: 1.5,
              }
            },
          })

          sigma.on('enterNode', ({ node }) => {
            hoveredNode = node
            hoveredNeighborSet = new Set(graph.neighbors(node))
            containerRef.current!.style.cursor = 'pointer'
            sigma.refresh()
          })
          sigma.on('leaveNode', () => {
            hoveredNode = null
            hoveredNeighborSet = new Set()
            containerRef.current!.style.cursor = 'default'
            sigma.refresh()
          })
          sigma.on('clickNode', ({ node }) => {
            if (cancelled) return
            const record = graph.getNodeAttribute(node, 'record') as IllustrationRecord
            const photo = photoMapRef.current.get(record.illustration_id)
            if (photo) setSelectedPhoto(photo)
          })
          sigma.on('clickStage', () => {
            if (!cancelled) setSelectedPhoto(null)
          })

          sigmaRef.current = sigma
          if (!cancelled) setGraphBuilding(false)
        }, 30)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setDataLoading(false)
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      sigmaRef.current?.kill()
      sigmaRef.current = null
    }
  }, [])

  const isLoading = dataLoading || graphBuilding

  const legendEntries = [...clusterCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, count]) => ({ id, label: clusterLabel(id), count }))

  return (
    <div className="illus-network-section">
      <div className="illus-network-section-header">
        <h2 className="illus-heading">Illustration Network</h2>
        <p className="illus-subheading">
          Similarity graph of all illustrations. Nodes are coloured by cluster.
          Hover a node to reveal its nearest neighbours; click to inspect.
        </p>
      </div>

      <div className="illus-network-canvas-wrap">
        <div ref={containerRef} className="illus-network-sigma sigma-container" />

        {isLoading && (
          <div className="illus-network-overlay">
            <div className="illus-spinner" />
            <p>{dataLoading ? 'Loading illustrations…' : 'Building network layout…'}</p>
          </div>
        )}

        {error && (
          <div className="illus-network-overlay illus-network-error">
            Failed to load: {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="illus-network-legend">
            <div className="illus-network-stats">
              {stats.nodes.toLocaleString()} nodes · {stats.edges.toLocaleString()} edges
            </div>
            {legendEntries.map(({ id, label, count }) => (
              <div key={id} className="illus-network-legend-row">
                <span className="illus-network-legend-dot" style={{ background: clusterColor(id) }} />
                <span>{label} ({count.toLocaleString()})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <IllustrationPopup
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          popupRef={popupRef}
          photoMap={photoMapRef.current}
          onSelectNeighbor={setSelectedPhoto}
        />
      )}
    </div>
  )
}
