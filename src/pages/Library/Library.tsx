import { useEffect, useMemo, useState } from 'react'
import { ParentSize } from '@visx/responsive'
import { useNavigate } from 'react-router-dom'

import { fetchBookCatalogue, type BookCatalogue, type BookRecord } from '../../data/books'
import { Timeline } from '../../components/Timeline'
import { BookDetail } from '../../components/BookDetail'

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

export function LibraryPage() {
  const navigate = useNavigate()
  const [catalogue, setCatalogue] = useState<BookCatalogue | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('All Time')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [selectedSource, setSelectedSource] = useState('All')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true
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
  }, [])

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
      const languages = book.language.length ? book.language : ['Not recorded']
      languages.forEach((language) => counts.set(language, (counts.get(language) || 0) + 1))
    })
    return [...counts.entries()]
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language))
      .slice(0, 12)
  }, [sourceAndSearchBooks])

  const displayedBooks = useMemo(() => {
    let books = sourceAndSearchBooks
    if (selectedLanguage !== 'All') {
      books = books.filter((book) => {
        if (selectedLanguage === 'Not recorded') return book.language.length === 0
        return book.language.includes(selectedLanguage)
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

  if (loadError) {
    return <section className="library-status" role="alert"><h2>Books</h2><p>{loadError}</p></section>
  }
  if (!catalogue) {
    return <section className="library-status" aria-live="polite"><h2>Books</h2><p>Loading the research catalogue…</p></section>
  }

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
              <span>{sourceShortLabel[source]}</span><strong>{catalogue.sourceCounts[source].toLocaleString()}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="timeline-section">
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
                height={height || 400}
                onSelectPeriod={(_books, period) => setSelectedPeriod(period)}
                selectedPeriod={selectedPeriod}
              />
            )}
          </ParentSize>
        </div>

        <div className="language-filter">
          <div className="library-section-heading">
            <h3>Most represented languages</h3>
            <button type="button" onClick={() => setSelectedLanguage('All')}>
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
                <span>{language}</span><strong>{count.toLocaleString()}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-section library-results">
        <p className="library-result-context" aria-live="polite">
          Showing {displayedBooks.length.toLocaleString()} of {catalogue.bookCount.toLocaleString()} books
        </p>
        <BookDetail
          books={displayedBooks}
          period={selectedPeriod}
          onSelectBook={(book) => navigate(`/explore/${encodeURIComponent(book.id)}`)}
        />
      </section>
    </>
  )
}
