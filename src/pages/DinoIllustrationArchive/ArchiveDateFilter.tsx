import { useMemo, useState } from 'react'
import type { ArchiveIndex } from '../../data/archiveData'
import type { BookRecord } from '../../data/books'

export type DateSelection = { mode: 'all' | 'range' | 'unknown'; from: string; to: string }
export const ALL_DATES: DateSelection = { mode: 'all', from: '', to: '' }

export function buildDateDistribution(index: ArchiveIndex, books: Map<string, BookRecord>) {
  const years = new Map<number, number[]>()
  const known = new Set<number>()
  for (const [key, rows] of Object.entries(index.bookRows)) {
    const year = books.get(key)?.year
    if (year == null || !Number.isFinite(year)) continue
    const rounded = Math.trunc(year)
    years.set(rounded, [...(years.get(rounded) ?? []), ...rows])
    rows.forEach(row => known.add(row))
  }
  const order = index.displayRows ?? Array.from({ length: index.cropCount }, (_, row) => row)
  const unknown = order.filter(row => !known.has(row))
  const sorted = [...years.keys()].sort((a, b) => a - b)
  const min = sorted[0] ?? 0
  const max = sorted.at(-1) ?? min
  const step = [10, 25, 50, 100, 200, 500, 1000].find(size => Math.floor(max / size) - Math.floor(min / size) + 1 <= 15) ?? Math.ceil((max - min + 1) / 14)
  const start = Math.floor(min / step) * step
  const bins = sorted.length ? Array.from({ length: Math.floor((max - start) / step) + 1 }, (_, i) => {
    const from = start + i * step
    return { from, to: from + step - 1, count: 0 }
  }) : []
  for (const [year, rows] of years) bins[Math.floor((year - start) / step)].count += rows.length
  return { years, unknown, bins, min, max, step }
}

export function rowsForDate(data: ReturnType<typeof buildDateDistribution>, selection: DateSelection) {
  if (selection.mode === 'all') return null
  if (selection.mode === 'unknown') return data.unknown
  const from = selection.from === '' ? -Infinity : Number(selection.from)
  const to = selection.to === '' ? Infinity : Number(selection.to)
  return [...data.years].filter(([year]) => year >= from && year <= to).flatMap(([, rows]) => rows)
}

export function ArchiveDateFilter({ data, value, onChange }: {
  data: ReturnType<typeof buildDateDistribution>
  value: DateSelection
  onChange: (value: DateSelection) => void
}) {
  const [detail, setDetail] = useState<string | null>(null)
  const peak = Math.max(1, ...data.bins.map(bin => bin.count))
  const selectedCounts = useMemo(() => data.bins.map(bin => {
    if (value.mode === 'unknown') return 0
    const from = value.from === '' ? -Infinity : Number(value.from)
    const to = value.to === '' ? Infinity : Number(value.to)
    return [...data.years].reduce((sum, [year, rows]) => sum + (year >= bin.from && year <= bin.to && (value.mode === 'all' || (year >= from && year <= to)) ? rows.length : 0), 0)
  }), [data, value])
  const invalid = value.mode === 'range' && value.from !== '' && value.to !== '' && Number(value.from) > Number(value.to)
  return <fieldset className="archive-date-filter">
    <legend>Date</legend>
    <p className="archive-date-caption">Illustrations by date · whole collection</p>
    {data.bins.length > 0 ? <>
      <div className="archive-date-chart" role="group" aria-label={`Illustration counts in ${data.step}-year intervals. Select a bar to filter its period.`}>
        {data.bins.map((bin, i) => {
          const label = `${bin.from}–${bin.to}: ${bin.count.toLocaleString()} illustrations`
          return <button type="button" key={bin.from} aria-label={label} title={label}
            aria-pressed={value.mode === 'range' && value.from === String(bin.from) && value.to === String(bin.to)}
            onMouseEnter={() => setDetail(label)} onMouseLeave={() => setDetail(null)}
            onFocus={() => setDetail(label)} onBlur={() => setDetail(null)}
            onClick={() => onChange({ mode: 'range', from: String(bin.from), to: String(bin.to) })}>
            <span className="archive-date-bar" style={{ height: `${bin.count / peak * 100}%` }} />
            <span className="archive-date-bar selected" style={{ height: `${selectedCounts[i] / peak * 100}%` }} />
          </button>
        })}
      </div>
      <div className="archive-date-axis" aria-hidden="true"><span>{data.bins[0].from}</span><span>{data.bins[Math.floor(data.bins.length / 2)].from}</span><span>{data.bins.at(-1)?.to}</span></div>
      <p className="archive-date-detail" aria-live="polite">{detail ?? `Up to ${peak.toLocaleString()} illustrations per bar. Select a period or enter years.`}</p>
      <div className="archive-date-inputs">
        <label>From<input type="number" step="1" placeholder={String(data.min)} value={value.from} aria-invalid={invalid} onChange={e => onChange({ ...value, mode: 'range', from: e.target.value })} /></label>
        <label>To<input type="number" step="1" placeholder={String(data.max)} value={value.to} aria-invalid={invalid} onChange={e => onChange({ ...value, mode: 'range', to: e.target.value })} /></label>
      </div>
      {invalid && <p className="archive-date-error" role="status">From must be no later than To.</p>}
    </> : <p>No recorded dates available.</p>}
    <div className="archive-date-options">
      <button type="button" aria-pressed={value.mode === 'all'} onClick={() => onChange(ALL_DATES)}>All dates</button>
      <button type="button" aria-pressed={value.mode === 'unknown'} onClick={() => onChange({ mode: 'unknown', from: '', to: '' })}>Date unknown <span>{data.unknown.length.toLocaleString()}</span></button>
    </div>
  </fieldset>
}
