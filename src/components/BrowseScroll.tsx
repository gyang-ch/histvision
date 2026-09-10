import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function BrowseScroll() {
  const { pathname } = useLocation()
  useEffect(() => {
    const key = `histvision-scroll:${pathname}`
    const remember = pathname === '/books' || pathname === '/illustration-archive'
    let target = 0
    try { target = remember ? Number(sessionStorage.getItem(key) ?? 0) : 0 } catch { /* Optional storage. */ }
    let restoring = target > 0
    const save = () => {
      if (remember && !restoring) {
        try { sessionStorage.setItem(key, String(window.scrollY)) } catch { /* Optional storage. */ }
      }
    }
    const observer = new ResizeObserver(() => restore())
    const finish = () => { restoring = false; observer.disconnect() }
    const restore = () => {
      window.scrollTo({ top: target, behavior: 'instant' })
      if (document.documentElement.scrollHeight - window.innerHeight >= target) finish()
    }
    if (restoring) observer.observe(document.body)
    restore()
    const timeout = window.setTimeout(finish, 10000)
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('wheel', finish, { passive: true })
    window.addEventListener('touchstart', finish, { passive: true })
    window.addEventListener('keydown', finish)
    return () => {
      clearTimeout(timeout)
      observer.disconnect()
      window.removeEventListener('scroll', save)
      window.removeEventListener('wheel', finish)
      window.removeEventListener('touchstart', finish)
      window.removeEventListener('keydown', finish)
    }
  }, [pathname])
  return null
}
