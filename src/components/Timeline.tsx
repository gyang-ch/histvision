import React, { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import type { BookRecord } from '../data/books';

function barPath(bx: number, barTop: number, bw: number, bh: number): string {
  if (bh <= 0) return '';
  const r = Math.min(5, bh / 2, bw / 2);
  return `M${bx},${barTop + r} Q${bx},${barTop} ${bx + r},${barTop} H${bx + bw - r} Q${bx + bw},${barTop} ${bx + bw},${barTop + r} V${barTop + bh} H${bx} Z`;
}

interface TimelineProps {
  data: BookRecord[];
  width: number;
  height: number;
  onSelectPeriod: (books: BookRecord[], period: string) => void;
  selectedPeriod: string | null;
}

export const Timeline: React.FC<TimelineProps> = ({
  data,
  width,
  height,
  onSelectPeriod,
  selectedPeriod,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Group books by 100-year intervals
  const binnedData = useMemo(() => {
    const bins: Record<string, BookRecord[]> = {};
    const minYear = 1300;
    const maxYear = 1800;
    
    for (let year = minYear; year <= maxYear; year += 100) {
      const label = `${year}-${year + 99}`;
      bins[label] = [];
    }

    data.forEach((book) => {
      const binStart = Math.floor(book.year / 100) * 100;
      const label = `${binStart}-${binStart + 99}`;
      if (bins[label]) {
        bins[label].push(book);
      } else {
        bins[label] = [book];
      }
    });

    return Object.entries(bins).map(([period, books]) => ({
      period,
      count: books.length,
      books,
    })).sort((a, b) => parseInt(a.period) - parseInt(b.period));
  }, [data]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || width < 10) return;

    const margin = { top: 20, right: 12, bottom: 40, left: 46 };
    const plotHeight = height - margin.top - margin.bottom;

    const root = d3.select(mount).html('').style('position', 'relative');

    const svg = root
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none')
      .attr('class', 'block w-full')
      .attr('role', 'img')
      .attr('aria-label', `Timeline`)
      .style('overflow', 'visible');

    const gradientId = `bar-gradient-timeline`;
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 1);

    const x = d3
      .scaleBand()
      .domain(binnedData.map((d) => d.period))
      .range([margin.left, width - margin.right])
      .paddingInner(0.22)
      .paddingOuter(0.14);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(binnedData, (d) => d.count) || 1])
      .nice(4)
      .range([margin.top + plotHeight, margin.top]);

    const tickValues = y.ticks(4);
    svg
      .append('g')
      .selectAll('line')
      .data(tickValues)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', 'rgba(148, 163, 184, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 4')
      .attr('shape-rendering', 'crispEdges');

    svg
      .append('g')
      .selectAll('text')
      .data(tickValues)
      .join('text')
      .attr('x', margin.left - 10)
      .attr('y', (d) => y(d) + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .style('font-family', 'sans-serif')
      .text((d) => d.toLocaleString());

    const bottomY = margin.top + plotHeight;

    const bars = svg
      .append('g')
      .selectAll('path')
      .data(binnedData)
      .join('path')
      .attr('d', (d) => barPath(x(d.period) || 0, y(d.count), x.bandwidth(), bottomY - y(d.count)))
      .attr('fill', (d) => d.period === selectedPeriod ? '#7dd3fc' : `url(#${gradientId})`)
      .style('cursor', 'pointer');

    // Apply selected glow style on initialization
    bars.filter(d => d.period === selectedPeriod)
      .attr('filter', 'drop-shadow(0px 0px 10px rgba(56, 189, 248, 0.9)) drop-shadow(0px 0px 24px rgba(14, 165, 233, 0.8))');

    // Animate bars growing from the baseline upward
    bars.each(function(_d, index) {
      gsap.set(this, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.to(this, {
        scaleY: 1,
        duration: 0.8,
        delay: index * 0.05,
        ease: 'power3.out',
      });
    });

    let activeBarNode: any = null;
    let activeDatum: any = null;
    const tippyInstances: any[] = [];

    bars.each(function(d) {
      const instance = tippy(this as any, {
        content: `
          <div class="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5" style="font-family: sans-serif; text-transform: uppercase; font-size: 10px; color: #94a3b8;">PERIOD</div>
          <div class="text-sm font-bold text-slate-100" style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: #f8fafc; margin-bottom: 4px;">${d.period}</div>
          <div style="display: flex; align-items: center; gap: 6px; border-top: 1px solid #334155; padding-top: 6px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #38bdf8;"></div>
            <span style="font-family: sans-serif; font-weight: 600; color: #cbd5e1; font-size: 13px;">${d.count} Works</span>
          </div>
        `,
        allowHTML: true,
        placement: 'top',
        animation: 'scale',
        theme: 'stats',
      });
      tippyInstances.push(instance);
    });

    const showHoverEffect = (d: any, node: any) => {
      if (d.period === selectedPeriod) return;

      if (activeBarNode && activeBarNode !== node && activeDatum && activeDatum.period !== selectedPeriod) {
        gsap.to(activeBarNode, {
          attr: { fill: `url(#${gradientId})` },
          filter: 'none',
          duration: 0.15,
          ease: 'power2.out',
        });
      }

      activeBarNode = node;
      activeDatum = d;

      gsap.to(node, {
        attr: { fill: '#7dd3fc' },
        filter: 'drop-shadow(0px 0px 10px rgba(56, 189, 248, 0.9)) drop-shadow(0px 0px 24px rgba(14, 165, 233, 0.8))',
        duration: 0.2,
        ease: 'power2.out',
      });
    };

    const hideHoverEffect = (d: any, node: any) => {
      if (d.period === selectedPeriod) return;

      gsap.to(node, {
        attr: { fill: `url(#${gradientId})` },
        filter: 'none',
        duration: 0.2,
        ease: 'power2.out',
      });

      activeBarNode = null;
      activeDatum = null;
    };

    bars
      .on('pointerenter', function (_event: any, d: any) {
        showHoverEffect(d, this);
      })
      .on('pointerleave', function (_event: any, d: any) {
        hideHoverEffect(d, this);
      })
      .on('click', function(_event: any, d: any) {
        onSelectPeriod(d.books, d.period);
      });

    root.on('pointerleave', () => {
      if (activeBarNode && activeDatum && activeDatum.period !== selectedPeriod) {
        hideHoverEffect(activeDatum, activeBarNode);
      }
    });

    svg
      .append('g')
      .selectAll('text.x-axis')
      .data(binnedData)
      .join('text')
      .attr('class', 'x-axis')
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .attr('x', (d) => (x(d.period) || 0) + x.bandwidth() / 2)
      .attr('y', margin.top + plotHeight + 16)
      .text((d) => d.period);

    return () => {
      bars.on('pointerenter', null).on('pointerleave', null).on('click', null);
      root.on('pointerleave', null);
      bars.each(function() {
        gsap.killTweensOf(this);
      });
      tippyInstances.forEach(instance => instance.destroy());
    };
  }, [binnedData, width, height, selectedPeriod, onSelectPeriod]);

  if (width < 10) return null;

  return (
    <>
      <style>{`
        .tippy-box[data-theme~='stats'] {
          background-color: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(51, 65, 85, 0.8);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
        }
        .tippy-box[data-theme~='stats'][data-placement^='top'] > .tippy-arrow::before {
          border-top-color: rgba(51, 65, 85, 0.8);
        }
      `}</style>
      <div style={{ position: 'relative', width, height }} ref={mountRef} />
    </>
  );
};