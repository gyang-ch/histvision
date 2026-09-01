import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as d3 from 'd3';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { KeplerMap } from './KeplerMap';

type PlantPoint = { lat: number; lng: number; count: number };

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    fontFamily: '"EB Garamond", Georgia, serif',
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '0.5rem',
    textAlign: 'center',
  }}>
    {children}
  </p>
);

export const GeographicalDistribution: React.FC = () => {
  const [hexData, setHexData] = useState<any[]>([]);
  const [plantPointData, setPlantPointData] = useState<PlantPoint[]>([]);
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tooltip: only count/visibility in state; position updated via DOM ref to avoid
  // re-rendering the Globe 60× per second during mouse movement.
  const [tooltipCount, setTooltipCount] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef({ x: 0, y: 0 });

  const [width, setWidth] = useState(Math.min(window.innerWidth - 64, 1200));

  // Single fetch — data is passed down to KeplerMap as a prop.
  useEffect(() => {
    fetch('/data/plant_points.json')
      .then(res => res.json())
      .then((data: PlantPoint[]) => {
        setPlantPointData(data);
        setHexData(data.map(point => ({ lat: point.lat, lng: point.lng, weight: point.count })));
      });
  }, []);

  // Debounced resize listener — only recalculates after the user finishes resizing.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWidth(Math.min(window.innerWidth - 64, 1200)), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.6;
    }
  }, [globeRef.current]);

  // Mouse-move updates cursor ref and nudges the tooltip div directly in the DOM —
  // no React state change, so the Globe never re-renders due to pointer movement.
  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
      if (tooltipRef.current) {
        tooltipRef.current.style.transform =
          `translate(${event.clientX + 12}px, ${event.clientY - 12}px)`;
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const maxWeight = d3.max(plantPointData, d => d.count) ?? 1;
  // Warm yellow→orange→red scale — cohesive with the Kepler hex palette.
  const weightColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxWeight]);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#FFFFFF',
      padding: '6rem 2rem 4rem',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* Kepler.gl Map Section */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#0f172a',
          padding: '2rem 0 0',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <SectionLabel>Interactive Map</SectionLabel>
          <h2 style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontSize: '1.6rem',
            fontWeight: 400,
            color: '#e2e8f0',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
            Detailed Plant Distribution
          </h2>
          <KeplerMap width={width} plantPoints={plantPointData} />
        </div>

        {/* 3D Globe Section — deferred until data is ready so Kepler gets priority */}
        {hexData.length > 0 && <div
          ref={containerRef}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            background: '#0f172a',
            padding: '2rem 0 0',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <SectionLabel>3D Visualisation</SectionLabel>
          <h2 style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontSize: '1.6rem',
            fontWeight: 400,
            color: '#e2e8f0',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}>
            Global Overview
          </h2>

          {tooltipCount !== null && (
            <div
              ref={tooltipRef}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate(${cursorRef.current.x + 12}px, ${cursorRef.current.y - 12}px)`,
                background: 'rgba(2, 8, 23, 0.88)',
                backdropFilter: 'blur(8px)',
                color: '#e2e8f0',
                padding: '6px 12px',
                borderRadius: '8px',
                fontFamily: '"EB Garamond", Georgia, serif',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                border: '1px solid rgba(226, 232, 240, 0.12)',
              }}
            >
              Observations: {tooltipCount.toLocaleString()}
            </div>
          )}

          <Globe
            ref={globeRef}
            width={width}
            height={800}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#3b82f6"
            atmosphereAltitude={0.18}
            hexBinPointsData={hexData}
            hexBinPointWeight="weight"
            hexAltitude={(d: any) => Math.log10(d.sumWeight + 1) * 0.12}
            hexBinResolution={4}
            hexTopColor={(d: any) => weightColor(d.sumWeight)}
            hexSideColor={(d: any) => weightColor(d.sumWeight)}
            hexBinMerge={true}
            enablePointerInteraction={true}
            onHexHover={(hex: any) => {
              if (!hex) {
                setTooltipCount(null);
                return;
              }
              setTooltipCount(Math.round(hex.sumWeight ?? 0));
            }}
          />
        </div>}

      </div>
    </div>
  );
};
