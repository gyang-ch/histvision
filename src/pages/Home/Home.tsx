import { NavLink } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import './Home.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const TITLE_LINE_1 = 'Computational Analysis of '
const TITLE_LINE_2 = 'Illustrations in Historical Books'

// Video temporarily disabled — presentation video to be re-recorded.
// import { useRef, useState } from 'react'
// const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
// const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string
// const PRESENTATION_VIDEO_URL = `${AZURE_BASE}/presentation.mp4?${AZURE_SAS}`

const entries = [
  {
    to: '/books',
    title: 'Books',
    description: 'High-resolution book images retrieved live via IIIF from museum and library servers.',
  },
  {
    to: '/explore',
    title: 'Explore',
    description: 'Transcribed with Kraken and the Qwen-VL vision-language model.',
  },
  {
    to: '/illustration-archive',
    title: 'Illustration Archive',
    description: '189,764 illustration crops across 3,358 books, with provenance and similarity search.',
  },
  {
    to: '/botanical-case-study',
    title: 'Botanical Case Study',
    description: 'A focused set of botanical illustrations, each linked back to its source page.',
  },
  {
    to: '/methods-and-findings',
    title: 'Methods & Findings',
    description: 'Evaluation charts for page-layout detection and illustration similarity models.',
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
  play,
}: {
  title: string
  slices: DonutSlice[]
  total: number
  totalLabel: string
  /** Only run the slice entrance animation once this chart has scrolled into view. */
  play: boolean
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
            <g key={arc.id} className={`home-donut-slice${play ? ' is-visible' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
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
  const [isVisible, setIsVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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

  // Only play the donut entrance once the section actually scrolls into
  // view — it renders below the fold, so playing it on mount meant nobody
  // ever saw it.
  useEffect(() => {
    if (isVisible) return
    const el = panelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      // Require a third of the actual chart panel on screen — the section
      // heading alone can poke into a short viewport without the donuts
      // themselves being visible yet.
      { threshold: 0.34 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [composition, isVisible])

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
      <div className="home-composition-panel" ref={panelRef}>
        <CollectionDonut title="Books by library" slices={makeSlices('books')} total={composition.totalBooks} totalLabel="books" play={isVisible} />
        <CollectionDonut title="Illustrations by library" slices={makeSlices('illustrations')} total={composition.totalIllustrations} totalLabel="illustrations" play={isVisible} />
      </div>
    </section>
  )
}

export function HomePage() {
  const titleRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    if (!titleRef.current) return

    const chars = Array.from(
      titleRef.current.querySelectorAll<HTMLElement>('.home-title-char'),
    )

    if (chars.length === 0) return

    const scatterFrom = {
      opacity: 0,
      x: () => gsap.utils.random(-90, 90),
      y: () => gsap.utils.random(-60, 60),
      rotation: () => gsap.utils.random(-22, 22),
      scale: 0.6,
    }

    // The whole headline scatter-flies in as one tight, unified burst; the
    // per-char delay is scaled down so ~59 characters still fully settle in
    // about ~1.1s — a fast single wave, not a slow cascade down two lines.
    gsap.fromTo(chars, scatterFrom, {
      opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
      duration: 0.65,
      delay: 0.1,
      stagger: { each: 0.008, from: 'start' },
      ease: 'back.out(1.4)',
      clearProps: 'transform',
    })
  }, [])

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
      <div className="home-hero">
        <div className="home-title" ref={titleRef}>
          <h1>
            {TITLE_LINE_1.split('').map((char, i) => (
              <span key={i} className="home-title-char">{char}</span>
            ))}
            <br />
            <span className="home-title-gradient">
              {TITLE_LINE_2.split('').map((char, i) => (
                <span key={i} className="home-title-char">{char}</span>
              ))}
            </span>
          </h1>
        </div>

        <div className="home-intro">
          <p>
            HistVision applies computer vision and multimodal methods to explore
            visual culture in digitised historical books at scale.
          </p>
        </div>
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
          <NavLink key={entry.to} to={entry.to} className="home-entry-card">
            <h3 className="home-entry-card-title">{entry.title}</h3>
            <p className="home-entry-card-text">{entry.description}</p>
            <span className="home-entry-card-foot" aria-hidden="true">
              <span>Open</span>
              <span className="home-entry-card-arrow">→</span>
            </span>
          </NavLink>
        ))}
      </div>
    </section>
  )
}
