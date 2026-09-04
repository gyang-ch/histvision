import { useEffect, useMemo, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

import { HomePage } from './pages/Home/Home'
import { LibraryPage } from './pages/Library/Library'
import { AIHubPage } from './pages/AIHub/AIHub'
import { IllustrationsPage } from './pages/Illustrations/Illustrations'
import { DinoIllustrationArchivePage } from './pages/DinoIllustrationArchive/DinoIllustrationArchive'
import { MethodologyPage } from './pages/Methodology/Methodology'

const navItems = [
  { to: '/home', label: 'Home', end: true },
  { to: '/books', label: 'Books', end: true },
  { to: '/explore', label: 'Explore', end: false },
  { to: '/illustration-archive', label: 'Illustration Archive', end: true },
  { to: '/botanical-case-study', label: 'Botanical Case Study', end: true },
  { to: '/methods-and-findings', label: 'Methods & Findings', end: true },
] as const

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  // const apiBaseUrl = (
  //   (window as any).APP_CONFIG?.API_URL ||
  //   import.meta.env.VITE_API_URL ||
  //   import.meta.env.VITE_API_BASE_URL ||
  //   'https://gyang-ch--image-api.modal.run'
  // ).replace(/\/+$/, '')

  const tabBarRef = useRef<HTMLDivElement>(null)

  const pathname = location.pathname
  const isReaderMode = useMemo(() => pathname.startsWith('/explore/') && pathname.split('/').length >= 3, [pathname])
  const isWhiteTheme = pathname === '/home' || pathname === '/' || pathname.startsWith('/books') || pathname.startsWith('/explore') || pathname.startsWith('/illustration-archive') || pathname.startsWith('/botanical-case-study') || pathname.startsWith('/methods-and-findings')

  // Scroll to top on navigation so each page's entrance animations are visible
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (!tabBarRef.current) return
      if (window.scrollY > 50) tabBarRef.current.classList.add('scrolled')
      else tabBarRef.current.classList.remove('scrolled')
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // useEffect(() => {
  //   const controller = new AbortController()

  //   fetch(`${apiBaseUrl}/healthz`, {
  //     method: 'GET',
  //     cache: 'no-store',
  //     signal: controller.signal,
  //   }).catch(() => {
  //     // Ignore warm-up failures. The first real backend request can still proceed normally.
  //   })

  //   return () => controller.abort()
  // }, [apiBaseUrl])

  return (
    <div className="app-container">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="tab-bar-container" ref={tabBarRef}>
        <div className="tab-bar-wrapper">
          <button
            className="brand"
            type="button"
            onClick={() => {
              navigate('/home')
            }}
            aria-label="Go to home"
          >
            <img src="/Icon.png" className="brand-icon" alt="HistVision Logo" />
            <span className="brand-title" aria-hidden="true">
              <span className="brand-hist">Hist</span>
              <span className="brand-vision">Vision</span>
            </span>
          </button>

          <nav className="tab-bar" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main
        id="main"
        className={`content ${isReaderMode ? 'reader-mode' : ''} ${isWhiteTheme ? 'white-theme-mode' : ''}`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/books" element={<LibraryPage />} />
          <Route path="/explore" element={<AIHubPage />} />
          <Route path="/explore/:bookId" element={<AIHubPage />} />
          <Route path="/illustration-archive" element={<DinoIllustrationArchivePage />} />
          <Route path="/botanical-case-study" element={<IllustrationsPage />} />
          <Route path="/methods-and-findings" element={<MethodologyPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>© 2026 Guang Yang • University College Cork</p>
      </footer>

      <Analytics />
    </div>
  )
}

export default App
