import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { ParentSize } from '@visx/responsive'
import { useNavigate } from 'react-router-dom'
import { useBrowseState } from '../../hooks/useBrowseState'

import { fetchBookCatalogue, type BookCatalogue, type BookRecord } from '../../data/books'
import { Timeline } from '../../components/Timeline'
import { BookDetail } from '../../components/BookDetail'
import {
  canonicalLanguages,
  hasNoLinguisticContent,
  hasUnspecifiedLanguage,
  LANGUAGE_UNSPECIFIED,
} from '../../utils/canonicalLanguages'

const SOURCE_ORDER = [
  'bodleian_new',
  'gallica',
  'harvard_yenching',
  'mdz',
  'ndl',
  'pul',
  'rmda',
  'wellcome',
]

const sourceShortLabel: Record<string, string> = {
  bodleian_new: 'Bodleian',
  gallica: 'Gallica',
  harvard_yenching: 'Harvard-Yenching',
  mdz: 'Bavarian State Library',
  ndl: 'National Diet Library',
  pul: 'Princeton',
  rmda: 'Kyoto University',
  wellcome: 'Wellcome',
}

function bookMatchesSearch(book: BookRecord, query: string) {
  if (!query) return true
  const haystack = [
    book.title,
    ...book.authors,
    ...book.subjects,
    ...book.keywordsMatched,
    book.institution,
    book.shelfmark,
    book.sourceItemId,
  ].join(' ').toLocaleLowerCase()
  return haystack.includes(query.toLocaleLowerCase())
}

function filterFillWidth(count: number, maximum: number) {
  return `${Math.min(100, Math.max(5, count / maximum * 100))}%`
}

export function LibraryPage() {
  const navigate = useNavigate()
  const [catalogue, setCatalogue] = useState<BookCatalogue | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, updateView] = useBrowseState('histvision-books', { period: 'All Time', language: 'All', source: 'All', query: '', page: 1, expanded: true })
  const { period: selectedPeriod, language: selectedLanguage, source: selectedSource, query: searchInput } = view
  const setSelectedPeriod = (period: string) => updateView({ period, page: 1 })
  const setSelectedLanguage = (language: string) => updateView({ language, page: 1 })
  const setSelectedSource = (source: string) => updateView({ source, page: 1 })
  const setSearchInput = (query: string) => updateView({ query, page: 1 })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoadError(null)
    fetchBookCatalogue()
      .then((result) => {
        if (active) setCatalogue(result)
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Could not load the catalogue')
      })
    return () => {
      active = false
    }
  }, [retry])

  const bookData = useMemo(() => catalogue?.books ?? [], [catalogue])
  const searchQuery = searchInput.trim()

  const sourceAndSearchBooks = useMemo(
    () => bookData.filter((book) =>
      (selectedSource === 'All' || book.source === selectedSource) && bookMatchesSearch(book, searchQuery),
    ),
    [bookData, searchQuery, selectedSource],
  )

  const languageStats = useMemo(() => {
    const counts = new Map<string, number>()
    sourceAndSearchBooks.forEach((book) => {
      canonicalLanguages(book.language).forEach((language) => counts.set(language, (counts.get(language) || 0) + 1))
    })
    return [...counts.entries()]
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language))
      .slice(0, 12)
  }, [sourceAndSearchBooks])

  const languageFilterMaximum = languageStats[0]?.count ?? 1

  const languageMetadataCounts = useMemo(() => ({
    unspecified: sourceAndSearchBooks.filter((book) => hasUnspecifiedLanguage(book.language)).length,
    noLinguisticContent: sourceAndSearchBooks.filter((book) => hasNoLinguisticContent(book.language)).length,
  }), [sourceAndSearchBooks])

  const displayedBooks = useMemo(() => {
    let books = sourceAndSearchBooks
    if (selectedLanguage !== 'All') {
      books = books.filter((book) => {
        // Retain compatibility with an existing saved browse state from before
        // language facets were canonicalised.
        if (selectedLanguage === LANGUAGE_UNSPECIFIED || selectedLanguage === 'Not recorded') {
          return hasUnspecifiedLanguage(book.language)
        }
        return canonicalLanguages(book.language).includes(selectedLanguage)
      })
    }
    if (selectedPeriod === 'Date unknown') {
      books = books.filter((book) => book.year == null)
    } else if (selectedPeriod !== 'All Time') {
      const start = Number(selectedPeriod.slice(0, 4))
      books = books.filter((book) => book.year != null && book.year >= start && book.year <= start + 99)
    }
    return books
  }, [selectedLanguage, selectedPeriod, sourceAndSearchBooks])

  const unknownDateCount = sourceAndSearchBooks.filter((book) => book.year == null).length

  const resetFilters = () => {
    setSelectedPeriod('All Time')
    setSelectedLanguage('All')
    setSelectedSource('All')
    setSearchInput('')
  }

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const resultContext = document.querySelector<HTMLElement>('.library-result-context')
    const activeControls = document.querySelectorAll<HTMLElement>('.source-filter button.active, .language-chip-list button.active')
    const timeline = document.querySelector<HTMLElement>('.timeline-wrapper')
    const targets = [resultContext, ...Array.from(activeControls), timeline].filter(Boolean)
    if (!targets.length) return
    const tween = gsap.fromTo(targets, { opacity: 0.45, y: 7 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.035, ease: 'power2.out', clearProps: 'transform' })
    return () => { tween.kill() }
  }, [selectedLanguage, selectedPeriod, selectedSource, searchQuery, displayedBooks.length])

  if (loadError) {
    return <section className="library-status" role="alert"><h2>Books</h2><p>{loadError}</p><button type="button" onClick={() => setRetry(n => n + 1)}>Retry catalogue</button></section>
  }
  if (!catalogue) {
    return <section className="library-status" aria-live="polite"><h2>Books</h2><p>Loading the research catalogue…</p></section>
  }

  const sourceFilterMaximum = Math.max(...Object.values(catalogue.sourceCounts), 1)

  return (
    <>
      <section className="library-intro" aria-labelledby="library-heading">
        <div className="library-intro-row">
          <div>
            <h2 id="library-heading">Illustrated books across eight digital libraries</h2>
            <p>
              Browse {catalogue.bookCount.toLocaleString()} source items containing{' '}
              {catalogue.illustrationCount.toLocaleString()} retained illustration crops. Each preview is an
              illustration selected from the book, rather than a generic cover image.
            </p>
          </div>
          <dl className="library-summary" aria-label="Catalogue summary">
            <div><dt>Books</dt><dd>{catalogue.bookCount.toLocaleString()}</dd></div>
            <div><dt>Illustrations</dt><dd>{catalogue.illustrationCount.toLocaleString()}</dd></div>
            <div><dt>Libraries</dt><dd>{SOURCE_ORDER.length}</dd></div>
          </dl>
        </div>

        <div className="library-controls">
          <label className="library-search">
            <span>Search catalogue</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
                setSelectedPeriod('All Time')
              }}
              placeholder="Title, author, subject, shelfmark, or item ID"
            />
          </label>
          <button type="button" className="library-reset" onClick={resetFilters}>Reset filters</button>
        </div>

        <div className="source-filter" aria-label="Filter books by source library">
          <button
            type="button"
            className={selectedSource === 'All' ? 'active' : ''}
            aria-pressed={selectedSource === 'All'}
            onClick={() => { setSelectedSource('All'); setSelectedPeriod('All Time') }}
          >
            <i className="library-filter-fill" aria-hidden="true" style={{ width: '100%' }} />
            <span>All libraries</span><strong>{catalogue.bookCount.toLocaleString()}</strong>
          </button>
          {SOURCE_ORDER.map((source) => (
            <button
              key={source}
              type="button"
              className={selectedSource === source ? 'active' : ''}
              aria-pressed={selectedSource === source}
            onClick={() => { setSelectedSource(source); setSelectedPeriod('All Time') }}
          >
              <i className="library-filter-fill" aria-hidden="true" style={{ width: filterFillWidth(catalogue.sourceCounts[source], sourceFilterMaximum) }} />
              <span>{sourceShortLabel[source]}</span><strong>{catalogue.sourceCounts[source].toLocaleString()}</strong>
            </button>
          ))}
        </div>
      </section>

      <details className="timeline-section library-filter-disclosure" open={view.expanded} onToggle={event => { if (event.currentTarget.open !== view.expanded) updateView({ expanded: event.currentTarget.open }) }}>
        <summary>Date and language <span>{selectedPeriod === 'All Time' ? 'All dates' : selectedPeriod} · {selectedLanguage === 'All' ? 'All languages' : selectedLanguage}</span></summary>
        <div className="library-section-heading">
          <h3>Temporal distribution</h3>
          <div className="period-controls">
            <button
              type="button"
              className={selectedPeriod === 'All Time' ? 'active' : ''}
              onClick={() => setSelectedPeriod('All Time')}
            >All dates</button>
            <button
              type="button"
              className={selectedPeriod === 'Date unknown' ? 'active' : ''}
              onClick={() => setSelectedPeriod('Date unknown')}
            >Date not recorded ({unknownDateCount.toLocaleString()})</button>
          </div>
        </div>
        <div className="timeline-wrapper">
          <ParentSize>
            {({ width, height }) => (
              <Timeline
                data={sourceAndSearchBooks}
                width={width}
                height={height || 160}
                onSelectPeriod={(_books, period) => setSelectedPeriod(period)}
                selectedPeriod={selectedPeriod}
              />
            )}
          </ParentSize>
        </div>

        <div className="language-filter">
          <div className="library-section-heading">
            <h3>Most represented languages</h3>
            <button type="button" className="library-language-reset" onClick={() => setSelectedLanguage('All')}>
              {selectedLanguage === 'All' ? 'Showing all' : 'Clear language filter'}
            </button>
          </div>
          <div className="language-chip-list" aria-label="Filter by language">
            {languageStats.map(({ language, count }) => (
              <button
                key={language}
                type="button"
                className={selectedLanguage === language ? 'active' : ''}
                aria-pressed={selectedLanguage === language}
                onClick={() => setSelectedLanguage(selectedLanguage === language ? 'All' : language)}
              >
                <i className="library-filter-fill" aria-hidden="true" style={{ width: filterFillWidth(count, languageFilterMaximum) }} />
                <span>{language}</span><strong>{count.toLocaleString()}</strong>
              </button>
            ))}
          </div>
          <p className="library-language-note">
            {languageMetadataCounts.unspecified.toLocaleString()} books have no recorded language metadata
            {languageMetadataCounts.noLinguisticContent > 0 && `; ${languageMetadataCounts.noLinguisticContent.toLocaleString()} have no linguistic content`}.
          </p>
        </div>
      </details>

      <section className="detail-section library-results">
        <p className="library-result-context" aria-live="polite">
          Showing {displayedBooks.length.toLocaleString()} of {catalogue.bookCount.toLocaleString()} books
        </p>
        <BookDetail
          books={displayedBooks}
          period={selectedPeriod}
          page={Math.max(1, Math.trunc(view.page))}
          onPageChange={page => updateView({ page })}
          onSelectBook={(book) => navigate(`/explore/${encodeURIComponent(book.id)}`)}
        />
      </section>
    </>
  )
}
