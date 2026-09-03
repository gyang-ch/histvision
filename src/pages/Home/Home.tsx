import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Home.css'

// Video temporarily disabled — presentation video to be re-recorded.
// import { useRef, useState } from 'react'
// const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
// const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string
// const PRESENTATION_VIDEO_URL = `${AZURE_BASE}/presentation.mp4?${AZURE_SAS}`

const entries = [
  {
    to: '/books',
    title: 'Books',
    side: 'High-resolution book images are retrieved via IIIF directly from museum and library servers, supporting decentralised access to digital cultural resources.',
    align: 'left',
  },
  {
    to: '/explore',
    title: 'Explore',
    side: 'Transcription is handled by Kraken and Qwen-VL, a vision-language model reflecting the multimodal turn in Digital Humanities.',
    align: 'right',
  },
  {
    to: '/illustration-archive',
    title: 'Illustration Archive',
    side: 'Explore 189,764 illustration crops detected across 3,358 books, with page provenance, visual similarity, and two embedding-space maps.',
    align: 'left',
  },
] as const

type CompositionSource = {
  id: string
  label: string
  books: number
  illustrations: number
}

type HomeComposition = {
  totalBooks: number
  totalIllustrations: number
  sources: CompositionSource[]
}

type DonutSlice = {
  id: string
  label: string
  shortLabel: string
  count: number
  color: string
}

const SOURCE_SHORT_LABELS: Record<string, string> = {
  bodleian_new: 'Bodleian',
  gallica: 'BnF Gallica',
  harvard_yenching: 'Harvard-Yenching',
  mdz: 'Bavarian State',
  ndl: 'National Diet',
  pul: 'Princeton',
  rmda: 'Kyoto',
  wellcome: 'Wellcome',
}

const SOURCE_COLORS: Record<string, string> = {
  bodleian_new: '#5c7c92',
  gallica: '#c28d5b',
  harvard_yenching: '#7b6f9c',
  mdz: '#7d8f7e',
  ndl: '#ad6f70',
  pul: '#4f8f8a',
  rmda: '#9b7653',
  wellcome: '#71829d',
}

function donutArc(cx: number, cy: number, outerRadius: number, innerRadius: number, start: number, end: number) {
  const gap = 0.022
  const arcStart = start + gap
  const arcEnd = end - gap
  if (arcEnd <= arcStart) return ''
  const largeArc = arcEnd - arcStart > Math.PI ? 1 : 0
  const point = (angle: number, radius: number) =>
    `${(cx + radius * Math.cos(angle)).toFixed(3)} ${(cy + radius * Math.sin(angle)).toFixed(3)}`
  return `M ${point(arcStart, outerRadius)} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${point(arcEnd, outerRadius)} L ${point(arcEnd, innerRadius)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${point(arcStart, innerRadius)} Z`
}

function CollectionDonut({
  title,
  slices,
  total,
  totalLabel,
}: {
  title: string
  slices: DonutSlice[]
  total: number
  totalLabel: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const centerX = 80
  const centerY = 80
  let angle = -Math.PI / 2
  const arcs = slices.map((slice) => {
    const sweep = total ? (slice.count / total) * Math.PI * 2 : 0
    const arc = { ...slice, start: angle, end: angle + sweep }
    angle += sweep
    return arc
  })
  const active = hovered == null ? null : arcs[hovered]
  const centerValue = active ? `${((active.count / total) * 100).toFixed(1)}%` : total.toLocaleString()
  const centerLabel = active?.shortLabel ?? totalLabel
  const glowId = `home-donut-glow-${title.toLocaleLowerCase().replace(/\W+/g, '-')}`

  return (
    <div className="home-donut">
      <h3>{title}</h3>
      <svg viewBox="0 0 160 160" aria-label={`${title}, distributed across eight source libraries`} onMouseLeave={() => setHovered(null)}>
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {arcs.map((arc, index) => {
          const middle = (arc.start + arc.end) / 2
          const isActive = hovered === index
          const translateX = (5 * Math.cos(middle)).toFixed(2)
          const translateY = (5 * Math.sin(middle)).toFixed(2)
          const path = donutArc(centerX, centerY, 60, 36, arc.start, arc.end)
          return (
            <g key={arc.id} className="home-donut-slice" style={{ animationDelay: `${index * 70}ms` }}>
              <path
                d={path}
                fill={arc.color}
                opacity={hovered == null || isActive ? 1 : 0.34}
                filter={isActive ? `url(#${glowId})` : undefined}
                className="home-donut-slice-visual"
                style={{ transform: isActive ? `translate(${translateX}px, ${translateY}px)` : undefined }}
              />
              <path
                d={path}
                fill="transparent"
                className="home-donut-hit-area"
                tabIndex={0}
                aria-label={`${arc.label}: ${arc.count.toLocaleString()}, ${((arc.count / total) * 100).toFixed(1)} percent`}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
              />
            </g>
          )
        })}
        <text x={centerX} y={centerY - 5} textAnchor="middle" className="home-donut-center-value">{centerValue}</text>
        <text x={centerX} y={centerY + 10} textAnchor="middle" className="home-donut-center-label">{centerLabel}</text>
      </svg>
      <div className="home-donut-legend">
        {slices.map((slice) => (
          <div key={slice.id} title={slice.label}>
            <i style={{ background: slice.color }} />
            <span>{slice.shortLabel} <small>{((slice.count / total) * 100).toFixed(1)}%</small></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollectionComposition() {
  const [composition, setComposition] = useState<HomeComposition | null>(null)

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}data/home-composition.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load collection composition (${response.status})`)
        return response.json() as Promise<HomeComposition>
      })
      .then((data) => { if (active) setComposition(data) })
      .catch((error) => console.error(error))
    return () => { active = false }
  }, [])

  if (!composition) return <div className="home-composition-loading" aria-live="polite">Loading collection composition…</div>

  const makeSlices = (field: 'books' | 'illustrations'): DonutSlice[] => composition.sources.map((source) => ({
    id: source.id,
    label: source.label,
    shortLabel: SOURCE_SHORT_LABELS[source.id] ?? source.label,
    count: source[field],
    color: SOURCE_COLORS[source.id] ?? '#718096',
  }))

  return (
    <section className="home-composition" aria-labelledby="home-composition-title">
      <div className="home-composition-heading">
        <h2 id="home-composition-title">Collection composition</h2>
      </div>
      <div className="home-composition-panel">
        <CollectionDonut title="Books by library" slices={makeSlices('books')} total={composition.totalBooks} totalLabel="books" />
        <CollectionDonut title="Illustrations by library" slices={makeSlices('illustrations')} total={composition.totalIllustrations} totalLabel="illustrations" />
      </div>
    </section>
  )
}

export function HomePage() {
  // Video temporarily disabled — presentation video to be re-recorded.
  // const videoRef = useRef<HTMLVideoElement>(null)
  // const videoWrapperRef = useRef<HTMLDivElement>(null)
  // const [buffering, setBuffering] = useState(false)

  // const toggleFullscreen = () => {
  //   if (!videoWrapperRef.current) return
  //   if (!document.fullscreenElement) {
  //     videoWrapperRef.current.requestFullscreen()
  //   } else {
  //     document.exitFullscreen()
  //   }
  // }

  // const togglePictureInPicture = () => {
  //   if (!videoRef.current || !document.pictureInPictureEnabled) return
  //   if (document.pictureInPictureElement) {
  //     document.exitPictureInPicture()
  //   } else {
  //     videoRef.current.requestPictureInPicture()
  //   }
  // }

  // const handleVideoKeyDown = (event: React.KeyboardEvent<HTMLVideoElement>) => {
  //   if (event.key === 'p' || event.key === 'P') {
  //     event.preventDefault()
  //     togglePictureInPicture()
  //   }
  // }

  return (
    <section className="home">
      <div className="home-intro">
        <p>
          HistVision explores visual culture through digitised historical books, 
          investigating how computer vision and multimodal methods can support 
          the large-scale discovery and analysis of illustrations across diverse 
          historical collections.
        </p>
      </div>

      <CollectionComposition />

      {/* Video temporarily disabled — presentation video to be re-recorded.
      <div className="home-video">
        <p className="home-video-caption">The video below is my presentation of the project.</p>
        <div className="home-video-wrapper" ref={videoWrapperRef}>
          <video
            ref={videoRef}
            className="home-video-player"
            src={PRESENTATION_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            aria-label="HistVision project presentation video"
            onDoubleClick={toggleFullscreen}
            onKeyDown={handleVideoKeyDown}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onPlaying={() => setBuffering(false)}
          />
          {buffering && (
            <div className="home-video-spinner" role="status" aria-label="Video loading">
              <span className="home-video-spinner-ring" />
            </div>
          )}
          <button
            type="button"
            className="home-video-pip-button"
            onClick={togglePictureInPicture}
            aria-label="Toggle picture-in-picture"
            title="Picture-in-picture (P)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-2-8h-7v5h7v-5z"
              />
            </svg>
          </button>
        </div>
      </div>
      */}

      <div className="home-entries">
        {entries.map((entry) => (
          <div key={entry.to} className={`home-entry home-entry--${entry.align}`}>
            <NavLink 
              to={entry.to} 
              className={`home-card home-card--${entry.to.replace('/', '')}`}
            >
              <div className="home-card-title">{entry.title}</div>
              <div className="home-card-foot" aria-hidden="true">
                <span>Open</span>
                <span className="home-card-arrow">→</span>
              </div>
            </NavLink>
            <p className="home-entry-text">{entry.side}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
