import { useState, useEffect } from 'react'

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

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#94a3b8',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  lineHeight: 1,
  userSelect: 'none',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
  marginLeft: '-1px',
  position: 'relative',
}

const baseFirst: React.CSSProperties = { ...base, borderRadius: '6px 0 0 6px', marginLeft: 0 }
const baseLast: React.CSSProperties  = { ...base, borderRadius: '0 6px 6px 0' }

const activeStyle: React.CSSProperties = {
  ...base,
  background: 'rgba(59, 130, 246, 0.08)',
  borderColor: '#3b82f6',
  color: '#3b82f6',
  zIndex: 1,
}

const disabledStyle: React.CSSProperties = {
  ...base,
  opacity: 0.35,
  cursor: 'not-allowed',
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

function hoverOn(e: React.MouseEvent<HTMLButtonElement>) {
  const el = e.currentTarget
  el.style.background = '#263548'
  el.style.color = '#e2e8f0'
  el.style.zIndex = '1'
}

function hoverOff(e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) {
  const el = e.currentTarget
  if (isActive) {
    el.style.background = 'rgba(59, 130, 246, 0.08)'
    el.style.color = '#3b82f6'
  } else {
    el.style.background = '#1e293b'
    el.style.color = '#94a3b8'
  }
  el.style.zIndex = '0'
}

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '1.5rem 0',
    }}>
      {/* Button group */}
      <div role="group" style={{
        display: 'inline-flex',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}>
        {/* Prev */}
        <button
          type="button"
          style={currentPage === 1 ? { ...disabledStyle, ...baseFirst } : baseFirst}
          disabled={currentPage === 1}
          onClick={() => goTo(currentPage - 1)}
          title="Previous page"
          onMouseEnter={currentPage !== 1 ? hoverOn : undefined}
          onMouseLeave={currentPage !== 1 ? (e) => hoverOff(e, false) : undefined}
        >
          <ChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) => {
          const isActive = p === currentPage

          if (p === 'el' || p === 'er') {
            return (
              <span key={p + i} style={{ ...base, cursor: 'default', color: '#475569', borderRadius: 0 }}>
                …
              </span>
            )
          }

          return (
            <button
              key={p}
              type="button"
              style={isActive ? { ...activeStyle, borderRadius: 0 } : { ...base, borderRadius: 0 }}
              onClick={() => goTo(p as number)}
              onMouseEnter={!isActive ? hoverOn : undefined}
              onMouseLeave={!isActive ? (e) => hoverOff(e, false) : undefined}
            >
              {p}
            </button>
          )
        })}

        {/* Next */}
        <button
          type="button"
          style={currentPage === totalPages
            ? { ...disabledStyle, borderRadius: '0 6px 6px 0', marginLeft: '-1px' }
            : { ...baseLast }}
          disabled={currentPage === totalPages}
          onClick={() => goTo(currentPage + 1)}
          title="Next page"
          onMouseEnter={currentPage !== totalPages ? hoverOn : undefined}
          onMouseLeave={currentPage !== totalPages ? (e) => hoverOff(e, false) : undefined}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Jump to page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#475569', fontSize: '0.78rem' }}>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
          style={{
            width: '52px',
            height: '36px',
            padding: '0 8px',
            borderRadius: '6px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '0.82rem',
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <span style={{ color: '#475569', fontSize: '0.78rem' }}>of {totalPages}</span>
      </div>
    </div>
  )
}
