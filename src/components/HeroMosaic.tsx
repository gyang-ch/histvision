import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './HeroMosaic.css'

const HERO_TILES_URL = '/data/hero-tiles.json'
const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string

const ROWS = 4
const PER_ROW = 13

export function HeroMosaic() {
  const [rows, setRows] = useState<string[][]>([])
  const trackRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    fetch(HERO_TILES_URL)
      .then((r) => r.json() as Promise<string[][]>)
      .then((sets) => {
        const set = sets[Math.floor(Math.random() * sets.length)]
        const srcs = set.map((path) => `${AZURE_BASE}/${path}?${AZURE_SAS}`)
        setRows(
          Array.from({ length: ROWS }, (_, i) =>
            srcs.slice(i * PER_ROW, (i + 1) * PER_ROW),
          ).filter((row) => row.length > 0),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!rows.length) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const anims: gsap.core.Tween[] = []
    trackRefs.current.forEach((track, i) => {
      if (!track) return
      // Even rows scroll right, odd rows scroll left
      const goRight = i % 2 === 0
      const anim = gsap.fromTo(
        track,
        { xPercent: goRight ? -50 : 0 },
        {
          xPercent: goRight ? 0 : -50,
          duration: 32 + i * 4,
          repeat: -1,
          ease: 'none',
        }
      )
      anims.push(anim)
    })

    return () => anims.forEach((a) => a.kill())
  }, [rows])

  return (
    <div className="hero-mosaic" aria-hidden="true">
      {rows.map((srcs, i) => (
        <div key={i} className="hero-mosaic-rail">
          <div
            ref={(el) => { trackRefs.current[i] = el }}
            className="hero-mosaic-track"
          >
            {[0, 1].map((copy) => (
              <div key={copy} className="hero-mosaic-set">
                {srcs.map((src, j) => (
                  <img
                    key={j}
                    src={src}
                    alt=""
                    className="hero-mosaic-img"
                    loading="eager"
                    draggable={false}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
