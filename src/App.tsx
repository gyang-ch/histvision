import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import './App.css'
import { HeroMosaic } from './components/HeroMosaic'

import { HomePage } from './pages/Home/Home'
import { LibraryPage } from './pages/Library/Library'
import { AIHubPage } from './pages/AIHub/AIHub'
import { GeographicalDistribution } from './pages/GeographicalDistribution/GeographicalDistribution'
import { IllustrationsPage } from './pages/Illustrations/Illustrations'
import { MethodologyPage } from './pages/Methodology/Methodology'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const scrollToContent = (heroRef: React.RefObject<HTMLElement | null>) => {
  const top = heroRef.current?.offsetHeight || 0;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

const navItems = [
  { to: '/home', label: 'Home', end: true },
  { to: '/library', label: 'Library', end: true },
  { to: '/ai-hub', label: 'AI Hub', end: false },
  { to: '/illustrations', label: 'Illustrations', end: true },
  { to: '/geography', label: 'Geographical Distribution', end: true },
  { to: '/methodology', label: 'Methodology', end: true },
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

  const heroTextRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const pathname = location.pathname
  const isReaderMode = useMemo(() => pathname.startsWith('/ai-hub/') && pathname.split('/').length >= 3, [pathname])
  const isFullWidth = useMemo(
    () => pathname.startsWith('/geography'),
    [pathname],
  )
  const isWhiteTheme = pathname === '/home' || pathname === '/' || pathname.startsWith('/library') || pathname.startsWith('/ai-hub') || pathname.startsWith('/illustrations') || pathname.startsWith('/methodology')

  // Scroll to top on navigation so the hero and its entrance animation are visible
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    if (!heroTextRef.current) return

    const chars = Array.from(
      heroTextRef.current.querySelectorAll<HTMLElement>('.hero-char'),
    )
    const subtitle = heroTextRef.current.querySelector<HTMLElement>('.subtitle')

    if (chars.length === 0) return

    const firstLineLength = 'Computational Analysis of '.length
    const line1Chars = chars.slice(0, firstLineLength)
    const line2Chars = chars.slice(firstLineLength)

    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 22, filter: 'blur(8px)' })

    const scatterFrom = {
      opacity: 0,
      x: () => gsap.utils.random(-90, 90),
      y: () => gsap.utils.random(-60, 60),
      rotation: () => gsap.utils.random(-22, 22),
      scale: 0.6,
    }

    const tl = gsap.timeline({ delay: 0.1 })

    // Step 1: line 1 scatter fly-in (faster stagger)
    tl.fromTo(line1Chars, scatterFrom, {
      opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
      duration: 0.65,
      stagger: { each: 0.018, from: 'start' },
      ease: 'back.out(1.4)',
      clearProps: 'transform',
    })

    // Step 2: line 2 starts shortly after line 1 ends
    tl.fromTo(line2Chars, scatterFrom, {
      opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
      duration: 0.65,
      stagger: { each: 0.022, from: 'start' },
      ease: 'back.out(1.4)',
      clearProps: 'transform',
    }, '-=0.8')

    // Step 3: subtitle slides up shortly after line 2 ends
    if (subtitle) {
      tl.to(subtitle, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power3.out',
        clearProps: 'transform,filter',
      }, '+=0.08')
    }
  }, [])

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

      <header className="hero" ref={heroSectionRef}>
        <HeroMosaic />
        <div className="hero-content" ref={heroTextRef}>
          <h1>
            {'Computational Analysis of '.split('').map((char, i) => (
              <span key={i} className="hero-char">{char}</span>
            ))}
            <br />
            <span className="hero-gradient">
              {'Global Botanical Iconography'.split('').map((char, i) => (
                <span key={i} className="hero-char">{char}</span>
              ))}
            </span>
          </h1>
          <p className="subtitle">Exploring the intersection of art history, science, and digital humanities.</p>
        </div>
      </header>

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
            <img src="/Icon.png" className="brand-icon" alt="PhytoVision Logo" />
            <span className="brand-title" aria-hidden="true">
              <span className="brand-phyto">Phyto</span>
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
        className={`content ${isReaderMode ? 'reader-mode' : ''} ${isFullWidth ? 'full-width-content' : ''} ${isWhiteTheme ? 'white-theme-mode' : ''}`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/ai-hub" element={<AIHubPage />} />
          <Route path="/ai-hub/:bookId" element={<AIHubPage />} />
<Route path="/geography" element={<GeographicalDistribution />} />
          <Route path="/illustrations" element={<IllustrationsPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
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
