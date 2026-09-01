import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ParentSize } from '@visx/responsive'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'

import { bookData } from '../../data/books'
import type { BookRecord } from '../../data/books'
import { Timeline } from '../../components/Timeline'
import { BookDetail } from '../../components/BookDetail'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const BAR_PALETTE = [
  '#4299e1', // blue
  '#48bb78', // green
  '#f6ad55', // orange
  '#9f7aea', // purple
  '#fc8181', // red
  '#2dd4bf', // teal
  '#ec4899', // pink
  '#facc15', // amber
]

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function LibraryPage() {
  const navigate = useNavigate()

  const [selectedBooks, setSelectedBooks] = useState<BookRecord[]>(bookData || [])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All Time')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All')

  const filterContainerRef = useRef<HTMLDivElement>(null)

  const languageStats = useMemo(() => {
    if (!bookData) return []
    const counts: Record<string, number> = {}

    selectedBooks.forEach((b) => {
      b.language?.forEach((l) => {
        counts[l] = (counts[l] || 0) + 1
      })
    })

    return Object.entries(counts)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count)
  }, [selectedBooks])

  const maxCount = useMemo(() => Math.max(...languageStats.map((s) => s.count), 0), [languageStats])

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!filterContainerRef.current) return

    const items = filterContainerRef.current.querySelectorAll('.legend-item')
    const bars = filterContainerRef.current.querySelectorAll('.legend-bar-inner')

    const tl = gsap.timeline()

    tl.fromTo(
      items,
      { opacity: 0, y: 10, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, stagger: 0.045, ease: 'expo.out' },
    )

    tl.fromTo(
      bars,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: (_i, target) => {
          const percentage = target.getAttribute('data-percentage')
          return `inset(0 ${100 - Number(percentage)}% 0 0)`
        },
        duration: 1.05,
        stagger: 0.045,
        ease: 'power4.out',
      },
      '-=0.35',
    )
  }, [languageStats])

  const handleSelectPeriod = (books: BookRecord[], period: string) => {
    if (selectedPeriod === period) {
      setSelectedBooks(bookData)
      setSelectedPeriod('All Time')
    } else {
      setSelectedBooks(books)
      setSelectedPeriod(period)
    }
    setSelectedLanguage('All')
  }

  const displayedBooks = useMemo(() => {
    const filtered =
      selectedLanguage === 'All' ? selectedBooks : selectedBooks.filter((b) => b.language?.includes(selectedLanguage))

    return [...filtered].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
  }, [selectedBooks, selectedLanguage])

  const handleLegendMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return
    const bar = e.currentTarget.querySelector('.legend-bar-inner')
    gsap.to(bar, { filter: 'saturate(1.25) brightness(1.08)', duration: 0.25 })
  }

  const handleLegendMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return
    const bar = e.currentTarget.querySelector('.legend-bar-inner')
    gsap.to(bar, { filter: 'saturate(1) brightness(1)', duration: 0.25 })
  }

  if (!bookData) return <div style={{ padding: '20px' }}>Loading data...</div>

  return (
    <>
      <section className="timeline-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            paddingBottom: '0.5rem',
          }}
        >
          <h3 className="section-heading" style={{ fontSize: '1.75rem', margin: 0, color: 'inherit' }}>
            Temporal Distribution
          </h3>
        </div>
        <div className="timeline-wrapper">
          <ParentSize>
            {({ width, height }) => (
              <Timeline
                data={bookData}
                width={width}
                height={height || 400}
                onSelectPeriod={handleSelectPeriod}
                selectedPeriod={selectedPeriod}
              />
            )}
          </ParentSize>
        </div>

        <div className="language-filter" style={{ marginTop: '3rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              paddingBottom: '0.5rem',
            }}
          >
            <h3 className="section-heading" style={{ fontSize: '1.75rem', margin: 0, color: 'inherit' }}>
              Linguistic Distribution
            </h3>
            <button
              onClick={() => setSelectedLanguage('All')}
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedLanguage === 'All' ? '#13cf71' : '#718096',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
              type="button"
            >
              {selectedLanguage === 'All' ? '• Showing All' : 'Reset Filter'}
            </button>
          </div>

          <div
            ref={filterContainerRef}
            className="legend-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: '0.9rem 2.5rem',
            }}
          >
            {languageStats.map(({ lang, count }, idx) => {
              const isActive = selectedLanguage === lang
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
              const color = BAR_PALETTE[idx % BAR_PALETTE.length]

              return (
                <div
                  key={lang}
                  className={`legend-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage(isActive ? 'All' : lang)}
                  onMouseEnter={handleLegendMouseEnter}
                  onMouseLeave={handleLegendMouseLeave}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    background: isActive ? hexToRgba(color, 0.12) : 'transparent',
                    border: isActive ? `1px solid ${hexToRgba(color, 0.5)}` : '1px solid transparent',
                    transition: 'background 0.2s ease, border-color 0.2s ease',
                    ['--bar-color' as string]: color,
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedLanguage(isActive ? 'All' : lang)
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <strong
                    style={{
                      minWidth: '110px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {lang}
                  </strong>

                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      height: '22px',
                      background: '#e2e8f0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <div
                      className="legend-bar-inner"
                      data-percentage={percentage}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: color,
                        clipPath: `inset(0 ${100 - percentage}% 0 0)`,
                        borderRadius: '6px',
                        boxShadow: isActive ? `0 0 12px ${hexToRgba(color, 0.55)}` : 'none',
                      }}
                    />
                  </div>

                  <span
                    style={{
                      minWidth: '78px',
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#475569',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {count} {count === 1 ? 'Work' : 'Works'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-section" style={{ marginTop: '4rem' }}>
        <BookDetail
          books={displayedBooks}
          period={selectedPeriod}
          aiHubPathForBook={(b) => `/ai-hub/${b.id}`}
          onSelectBook={(book) => {
            navigate(`/ai-hub/${book.id}`)
          }}
        />
      </section>
    </>
  )
}
