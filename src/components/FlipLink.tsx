import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import './FlipLink.css'

interface FlipLinkProps {
  to: string
  children: string
}

export function FlipLink({ to, children }: FlipLinkProps) {
  const wrapperRef = useRef<HTMLAnchorElement>(null)
  const primaryCharsRef = useRef<(HTMLSpanElement | null)[]>([])
  const secondaryCharsRef = useRef<(HTMLSpanElement | null)[]>([])
  const navigate = useNavigate()
  const chars = String(children).split('')

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const primary = primaryCharsRef.current
    const secondary = secondaryCharsRef.current

    // Park secondary chars below, invisible
    gsap.set(secondary, {
      yPercent: 110,
      rotationX: -20,
      opacity: 0,
      transformPerspective: 600,
    })

    const tl = gsap.timeline({ paused: true })

    // Primary chars exit upward — fast ease-in, staggered left→right
    tl.to(primary, {
      yPercent: -110,
      rotationX: 20,
      opacity: 0,
      duration: 0.3,
      stagger: 0.022,
      ease: 'power4.in',
      transformPerspective: 600,
    }, 0)

    // Secondary chars enter from below — expo snap landing, slight delay so
    // the exit wave leads the entrance wave by one stagger step
    .to(secondary, {
      yPercent: 0,
      rotationX: 0,
      opacity: 1,
      duration: 0.42,
      stagger: 0.022,
      ease: 'expo.out',
      transformPerspective: 600,
    }, 0.04)

    const play = () => tl.play()
    const reverse = () => tl.reverse()
    wrapper.addEventListener('mouseenter', play)
    wrapper.addEventListener('mouseleave', reverse)

    return () => {
      wrapper.removeEventListener('mouseenter', play)
      wrapper.removeEventListener('mouseleave', reverse)
      tl.kill()
    }
  }, [])

  return (
    <a
      href={to}
      ref={wrapperRef}
      className="flip-link"
      onClick={(e) => { e.preventDefault(); navigate(to) }}
    >
      {/* Primary text — each char is its own animatable unit */}
      <span className="flip-link-primary" style={{ display: 'flex' }}>
        {chars.map((char, i) => (
          <span
            key={`p-${i}`}
            ref={(el) => { primaryCharsRef.current[i] = el }}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </span>

      {/* Secondary text — teal, absolutely overlaid, char-for-char */}
      <span
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}
        aria-hidden="true"
      >
        {chars.map((char, i) => (
          <span
            key={`s-${i}`}
            ref={(el) => { secondaryCharsRef.current[i] = el }}
            style={{ display: 'inline-block', color: '#0d9488', fontWeight: 600 }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </span>
    </a>
  )
}
