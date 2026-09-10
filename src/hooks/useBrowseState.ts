import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

// URL wins over the remembered view; all setters share a ref so batched
// filter changes do not overwrite each other before the router renders.
export function useBrowseState<T extends Record<string, unknown>>(key: string, defaults: T) {
  const [params, setParams] = useSearchParams()
  let value = defaults
  try {
    const raw = params.get('view') ?? sessionStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      value = { ...defaults }
      for (const name of Object.keys(defaults)) {
        const candidate = parsed[name]
        const fallback = defaults[name]
        if (candidate === null && fallback === null || typeof candidate === typeof fallback && (typeof candidate !== 'number' || Number.isFinite(candidate))) {
          (value as Record<string, unknown>)[name] = candidate
        }
      }
    }
  } catch { /* An unavailable store or malformed link falls back to defaults. */ }
  const serializedValue = JSON.stringify(value)
  useEffect(() => {
    try { sessionStorage.setItem(key, serializedValue) } catch { /* Optional persistence. */ }
    if (!params.has('view')) {
      const next = new URLSearchParams(params)
      next.set('view', serializedValue)
      setParams(next, { replace: true, preventScrollReset: true })
    }
  }, [key, params, serializedValue, setParams])
  const current = useRef(value)
  current.current = value
  const update = (patch: Partial<T>) => {
    const next = { ...current.current, ...patch }
    current.current = next
    const serialized = JSON.stringify(next)
    try { sessionStorage.setItem(key, serialized) } catch { /* Optional persistence. */ }
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', serialized)
    setParams(nextParams, { replace: true, preventScrollReset: true })
  }
  return [value, update] as const
}
