import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Home.css'

const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string

const PRESENTATION_VIDEO_URL = `${AZURE_BASE}/presentation.mp4?${AZURE_SAS}`

const entries = [
  {
    to: '/library',
    title: 'Library',
    side: 'High-resolution book images are retrieved via IIIF directly from museum and library servers, supporting decentralised access to digital cultural resources.',
    align: 'left',
  },
  {
    to: '/ai-hub',
    title: 'AI Hub',
    side: 'Transcription is handled by Kraken and Qwen-VL, a vision-language model reflecting the multimodal turn in Digital Humanities.',
    align: 'right',
  },
  {
    to: '/illustrations',
    title: 'Illustrations',
    side: 'Plant illustrations extracted and cropped from book page images by the YOLO model.',
    align: 'left',
  },
  {
    to: '/geography',
    title: 'Geographical Distribution',
    side: 'Plant distributions are mapped using kepler.gl, situating the archive in space and engaging spatial humanities methods.',
    align: 'right',
  },
] as const

export function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const [buffering, setBuffering] = useState(false)

  const toggleFullscreen = () => {
    if (!videoWrapperRef.current) return
    if (!document.fullscreenElement) {
      videoWrapperRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const togglePictureInPicture = () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
    } else {
      videoRef.current.requestPictureInPicture()
    }
  }

  const handleVideoKeyDown = (event: React.KeyboardEvent<HTMLVideoElement>) => {
    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault()
      togglePictureInPicture()
    }
  }

  return (
    <section className="home">
      <div className="home-intro">
        <p>
          PhytoVision explores the history of botany through digitised historical books,
          investigating how computer-assisted techniques can enhance the analysis of botanical
          texts and images at large scale through AI models and digital infrastructures.
        </p>
      </div>

      <div className="home-video">
        <p className="home-video-caption">The video below is my presentation of the project.</p>
        <div className="home-video-wrapper" ref={videoWrapperRef}>
          <video
            ref={videoRef}
            className="home-video-player"
            src={PRESENTATION_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            aria-label="PhytoVision project presentation video"
            onDoubleClick={toggleFullscreen}
            onKeyDown={handleVideoKeyDown}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onPlaying={() => setBuffering(false)}
          />
          {buffering && (
            <div className="home-video-spinner" role="status" aria-label="Video loading">
              <span className="home-video-spinner-ring" />
            </div>
          )}
          <button
            type="button"
            className="home-video-pip-button"
            onClick={togglePictureInPicture}
            aria-label="Toggle picture-in-picture"
            title="Picture-in-picture (P)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-2-8h-7v5h7v-5z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="home-entries">
        {entries.map((entry) => (
          <div key={entry.to} className={`home-entry home-entry--${entry.align}`}>
            <NavLink 
              to={entry.to} 
              className={`home-card home-card--${entry.to.replace('/', '')}`}
            >
              <div className="home-card-title">{entry.title}</div>
              <div className="home-card-foot" aria-hidden="true">
                <span>Open</span>
                <span className="home-card-arrow">→</span>
              </div>
            </NavLink>
            <p className="home-entry-text">{entry.side}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
