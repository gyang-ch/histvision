import { useState, useEffect } from 'react'
import './Paginator.css'

interface PaginatorProps {
  currentPage: number   // 1-indexed
  totalPages: number
  onPageChange: (page: number) => void
}

function buildPageRange(current: number, total: number): (number | 'el' | 'er')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'el' | 'er')[] = [1]
  const left = Math.max(2, current - 2)
  const right = Math.min(total - 1, current + 2)

  if (left > 2) pages.push('el')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('er')
  pages.push(total)

  return pages
}

const ChevronLeft = () => (
  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
  </svg>
)

const ChevronRight = () => (
  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
  </svg>
)

export function Paginator({ currentPage, totalPages, onPageChange }: PaginatorProps) {
  const [inputVal, setInputVal] = useState(String(currentPage))

  useEffect(() => setInputVal(String(currentPage)), [currentPage])

  if (totalPages <= 1) return null

  const goTo = (page: number) => onPageChange(Math.max(1, Math.min(totalPages, page)))

  const commitInput = () => {
    const n = parseInt(inputVal, 10)
    if (!isNaN(n)) goTo(n)
    else setInputVal(String(currentPage))
  }

  const pages = buildPageRange(currentPage, totalPages)

  return (
    <nav className="paginator" aria-label="Pagination">
      <div className="paginator-pages" role="group" aria-label="Page selection">
        {/* Prev */}
        <button
          type="button"
          className="paginator-control paginator-control--previous"
          disabled={currentPage === 1}
          onClick={() => goTo(currentPage - 1)}
          title="Previous page"
          >
          <ChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) => {
          const isActive = p === currentPage

          if (p === 'el' || p === 'er') {
            return (
              <span key={p + i} className="paginator-ellipsis" aria-hidden="true">
                …
              </span>
            )
          }

          return (
            <button
              key={p}
              type="button"
              className={isActive ? 'paginator-control is-active' : 'paginator-control'}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => goTo(p as number)}
            >
              {p}
            </button>
          )
        })}

        {/* Next */}
        <button
          type="button"
          className="paginator-control paginator-control--next"
          disabled={currentPage === totalPages}
          onClick={() => goTo(currentPage + 1)}
          title="Next page"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="paginator-jump">
        <label htmlFor="paginator-page-input">Go to</label>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
          id="paginator-page-input"
          className="paginator-input"
        />
        <span>of {totalPages.toLocaleString()}</span>
      </div>
    </nav>
  )
}
