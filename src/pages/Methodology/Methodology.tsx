import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { area, curveMonotoneX, line, scaleBand, scaleLinear, scalePoint } from 'd3'
import gsap from 'gsap'
import './Methodology.css'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fires once, the first time the returned ref's element scrolls into view. */
function useRevealOnScroll<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  // threshold is fixed per call site, not meant to be reactive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])
  return [ref, visible] as const
}

/**
 * Grows a chart's bars up from their baseline the first time `play` becomes
 * true (scroll-triggered by the caller). Animates the SVG y/height attributes
 * directly rather than a transform/scale, so the bar's foot stays planted on
 * the baseline throughout — animating y and height together with the same
 * duration keeps y + height constant at the baseline for every frame.
 */
function useBarGrowth(svgRef: React.RefObject<SVGSVGElement | null>, play: boolean, baseline: number, bars: { y: number; height: number }[]) {
  // Flatten to a stable string dependency — the arrays are rebuilt every
  // render (cheap, derived from static data) but only actually change if the
  // underlying chart data does.
  const barsKey = bars.map((bar) => `${bar.y},${bar.height}`).join('|')

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const svg = svgRef.current
    if (!svg) return
    const rects = svg.querySelectorAll<SVGRectElement>('.chart-bar rect')
    gsap.set(rects, { attr: { y: baseline, height: 0 } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barsKey])

  useEffect(() => {
    if (!play || prefersReducedMotion()) return
    const svg = svgRef.current
    if (!svg) return
    const rects = svg.querySelectorAll<SVGRectElement>('.chart-bar rect')
    const tweens = Array.from(rects).map((rect, index) => {
      const target = bars[index]
      if (!target) return null
      return gsap.to(rect, { attr: { y: target.y, height: target.height }, duration: 0.55, delay: index * 0.04, ease: 'power2.out' })
    })
    return () => tweens.forEach((tween) => tween?.kill())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, barsKey])
}

/** Keeps returning the last non-null focus value during the exit fade, instead of snapping to null the instant the pointer leaves. */
function useStickyFocus<T>(focus: T | null): [T | null, () => void] {
  const [display, setDisplay] = useState<T | null>(focus)
  // Adjusting state during render (rather than in an effect) avoids an extra
  // commit — see https://react.dev/learn/you-might-not-need-an-effect.
  const [prevFocus, setPrevFocus] = useState(focus)
  if (focus !== prevFocus) {
    setPrevFocus(focus)
    if (focus !== null) setDisplay(focus)
  }
  return [display, () => setDisplay(null)]
}

/**
 * Fades a tooltip card in or out. Positioning stays on the parent <g> (via
 * its transform attribute) — this only animates opacity, deliberately never
 * scale: a percentage-based transformOrigin on a nested SVG <g> doesn't
 * reliably converge to the same rest position GSAP's clearProps snaps back
 * to, which showed up as a small but visible jump right as the card
 * finished appearing. Opacity alone can't cause any positional drift.
 */
function TooltipFade({ open, onExited, children }: { open: boolean; onExited: () => void; children: React.ReactNode }) {
  const ref = useRef<SVGGElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { opacity: open ? 1 : 0 })
      if (!open) onExited()
      return
    }
    gsap.killTweensOf(el)
    if (open) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power2.out' })
    } else {
      gsap.to(el, { opacity: 0, duration: 0.12, ease: 'power1.in', onComplete: onExited })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return <g ref={ref}>{children}</g>
}

type ModelName = 'YOLO11m' | 'DINO-R50' | 'OpenCLIP' | 'DINOv2'

const colours: Record<ModelName, string> = {
  YOLO11m: '#287da1',
  'DINO-R50': '#c7642d',
  OpenCLIP: '#287da1',
  DINOv2: '#c7642d',
}

const learningCurve = [
  { model: 'YOLO11m' as const, values: [[200, .534520], [400, .568255], [600, .625337], [800, .578416], [1000, .577650], [1152, .575210]] },
  { model: 'DINO-R50' as const, values: [[200, .607507], [400, .637093], [600, .654865], [800, .666576], [1000, .652324], [1152, .667090]] },
]

const refinement = {
  YOLO11m: {
    overall: { labels: ['AP', 'AP50', 'AP75'], old: [.576895, .761388, .621330], next: [.590708, .785325, .650414] },
    classes: { labels: ['Illustration', 'Text block'], old: [.740735, .413056], next: [.688867, .492549] },
  },
  'DINO-R50': {
    overall: { labels: ['AP', 'AP50', 'AP75'], old: [.674079, .864868, .749228], next: [.714184, .894790, .781036] },
    classes: { labels: ['Illustration', 'Text block'], old: [.752444, .595713], next: [.770546, .657823] },
  },
}

const overlapBins = [
  { title: 'Unrestricted top-20 overlap', colour: '#5597ad', counts: [13731, 22152, 24112, 23408, 21187, 18423, 15425, 12633, 10052, 7738, 6077, 4445, 3397, 2393, 1735, 1170, 775, 454, 300, 137, 20] },
  { title: 'Cross-book top-20 overlap', colour: '#cb8054', counts: [37730, 36487, 29002, 22586, 16957, 12841, 9612, 7016, 5110, 3679, 2772, 1879, 1294, 862, 630, 420, 320, 237, 172, 122, 36] },
]

const stability = [
  { model: 'OpenCLIP' as const, k: 50, ari: [.528668, .574206, .617687], ami: [.743664, .762663, .788217] },
  { model: 'OpenCLIP' as const, k: 100, ari: [.533834, .538694, .542478], ami: [.766256, .771350, .776142] },
  { model: 'OpenCLIP' as const, k: 200, ari: [.500171, .513209, .537856], ami: [.775391, .779890, .788367] },
  { model: 'OpenCLIP' as const, k: 400, ari: [.490756, .504071, .515585], ami: [.781115, .786299, .789791] },
  { model: 'DINOv2' as const, k: 50, ari: [.559362, .567071, .580060], ami: [.758559, .761172, .762539] },
  { model: 'DINOv2' as const, k: 100, ari: [.549856, .555970, .566449], ami: [.776140, .779462, .783896] },
  { model: 'DINOv2' as const, k: 200, ari: [.538044, .550393, .574690], ami: [.789274, .795454, .802128] },
  { model: 'DINOv2' as const, k: 400, ari: [.490815, .494838, .502053], ami: [.781415, .782324, .784009] },
]

const yTicks = (minimum: number, maximum: number, count = 5) =>
  Array.from({ length: count }, (_, index) => minimum + (maximum - minimum) * index / (count - 1))

function Legend({ models }: { models: ModelName[] }) {
  return <div className="research-legend" aria-label="Chart legend">{models.map((model) => <span key={model}><i style={{ background: colours[model] }} />{model}</span>)}</div>
}

function LearningCurveChart() {
  const width = 920, height = 470
  const margin = { top: 28, right: 28, bottom: 72, left: 80 }
  const x = scalePoint<number>().domain([200, 400, 600, 800, 1000, 1152]).range([margin.left, width - margin.right])
  const y = scaleLinear().domain([.50, .70]).range([height - margin.bottom, margin.top])
  const makeLine = line<[number, number]>().x((value) => x(value[0]) ?? 0).y((value) => y(value[1])).curve(curveMonotoneX)
  const trainingSizes = [200, 400, 600, 800, 1000, 1152]
  const [focus, setFocus] = useState<number | null>(null)
  const [displayFocus, clearDisplayFocus] = useStickyFocus(focus)

  return <div className="chart-wrap">
    <Legend models={['YOLO11m', 'DINO-R50']} />
    <svg className="research-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="learning-title learning-desc">
      <title id="learning-title">Page-layout detection performance by training-set size</title>
      <desc id="learning-desc">Line chart comparing COCO average precision for YOLO11m and DINO-R50 at six training-set sizes.</desc>
      {yTicks(.50, .70).map((tick) => <g key={tick} className="chart-grid"><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} /><text x={margin.left - 12} y={y(tick) + 4}>{tick.toFixed(2)}</text></g>)}
      {trainingSizes.map((tick) => <text key={tick} className="chart-tick chart-tick-x" x={x(tick)} y={height - margin.bottom + 28}>{tick}</text>)}
      <text className="chart-axis-label" x={width / 2} y={height - 16}>Number of training images</text>
      <text className="chart-axis-label" transform={`translate(20 ${height / 2}) rotate(-90)`}>COCO AP (IoU = 0.50:0.95)</text>
      {learningCurve.map((series) => <g key={series.model}>
        <path className="chart-line" d={makeLine(series.values as [number, number][]) ?? ''} stroke={colours[series.model]} />
        {series.values.map(([images, value]) => <circle key={images} className={focus === images ? 'shared-point active' : 'shared-point'} cx={x(images)} cy={y(value)} r="6" fill={colours[series.model]} />)}
      </g>)}
      {focus !== null && <line className="shared-hover-line" x1={x(focus)} x2={x(focus)} y1={margin.top} y2={height - margin.bottom} />}
      {displayFocus !== null && (
        <g className="shared-tooltip" transform={`translate(${(x(displayFocus) ?? 0) > width * .69 ? (x(displayFocus) ?? 0) - 206 : (x(displayFocus) ?? 0) + 16} ${margin.top + 10})`}>
          <TooltipFade open={focus !== null} onExited={clearDisplayFocus}>
            <rect width="190" height="82" rx="8" />
            <text className="shared-tooltip-title" x="13" y="21">{displayFocus.toLocaleString()} training images</text>
            {[learningCurve[1], learningCurve[0]].map((series, index) => {
              const value = series.values.find(([images]) => images === displayFocus)?.[1] ?? 0
              return <g key={series.model} transform={`translate(0 ${37 + index * 20})`}><circle cx="15" cy="0" r="4" fill={colours[series.model]} /><text className="shared-tooltip-label" x="27" y="4">{series.model}</text><text className="shared-tooltip-value" x="176" y="4">AP {value.toFixed(3)}</text></g>
            })}
          </TooltipFade>
        </g>
      )}
      {trainingSizes.map((images, index) => {
        const currentX = x(images) ?? 0
        const previousX = index === 0 ? margin.left : (x(trainingSizes[index - 1]) ?? currentX)
        const nextX = index === trainingSizes.length - 1 ? width - margin.right : (x(trainingSizes[index + 1]) ?? currentX)
        return <rect key={images} className="shared-hover-target" role="button" tabIndex={0} aria-label={`${images} training images: YOLO11m AP ${learningCurve[0].values[index][1].toFixed(3)}, DINO-R50 AP ${learningCurve[1].values[index][1].toFixed(3)}`} x={(previousX + currentX) / 2} y={margin.top} width={(nextX - previousX) / 2} height={height - margin.top - margin.bottom} onFocus={() => setFocus(images)} onBlur={() => setFocus(null)} onMouseEnter={() => setFocus(images)} onMouseLeave={() => setFocus(null)} />
      })}
    </svg>
  </div>
}

function BarPanel({ model, kind, panel, play }: { model: 'YOLO11m' | 'DINO-R50'; kind: 'overall' | 'classes'; panel: string; play: boolean }) {
  const data = refinement[model][kind]
  const width = 450, height = 280
  const margin = { top: 32, right: 16, bottom: 55, left: 56 }
  const x = scaleBand().domain(data.labels).range([margin.left, width - margin.right]).padding(.28)
  const y = scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top])
  const sub = scaleBand().domain(['old', 'next']).range([0, x.bandwidth()]).padding(.07)
  const [focus, setFocus] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const bars = data.labels.flatMap((label, index) => (['old', 'next'] as const).map((version) => {
    const value = data[version][index]
    return { y: y(value), height: y(0) - y(value) }
  }))
  useBarGrowth(svgRef, play, y(0), bars)
  return <svg ref={svgRef} className="research-chart refinement-panel" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${model} ${kind === 'overall' ? 'overall detection' : 'per-class AP'} comparison`}>
    <text className="chart-panel-title" x={margin.left} y="18">{panel} {model}: {kind === 'overall' ? 'Overall detection' : 'Per-class AP'}</text>
    {yTicks(0, 1, 6).map((tick) => <g key={tick} className="chart-grid"><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} /><text x={margin.left - 10} y={y(tick) + 4}>{tick.toFixed(1)}</text></g>)}
    {data.labels.map((label, index) => <g key={label}>
      <text className="chart-tick chart-tick-x" x={(x(label) ?? 0) + x.bandwidth() / 2} y={height - margin.bottom + 25}>{label}</text>
      {(['old', 'next'] as const).map((version) => {
        const value = data[version][index], key = `${label}-${version}`
        return <g key={version} className="chart-bar" role="button" tabIndex={0} aria-label={`${label}, ${version === 'old' ? 'old 1152' : 'new 1511'}, ${value.toFixed(3)}`} onFocus={() => setFocus(key)} onBlur={() => setFocus(null)} onMouseEnter={() => setFocus(key)} onMouseLeave={() => setFocus(null)}><rect x={(x(label) ?? 0) + (sub(version) ?? 0)} y={y(value)} width={sub.bandwidth()} height={y(0) - y(value)} fill={version === 'old' ? '#aab1b6' : colours[model]} /><text className={focus === key ? 'bar-value active' : 'bar-value'} x={(x(label) ?? 0) + (sub(version) ?? 0) + sub.bandwidth() / 2} y={y(value) - 7}>{value.toFixed(3)}</text></g>
      })}
    </g>)}
  </svg>
}

function RefinementChart() {
  const [wrapRef, visible] = useRevealOnScroll<HTMLDivElement>()
  return <div className="refinement-wrap" ref={wrapRef}><div className="research-legend"><span><i style={{ background: '#aab1b6' }} />Old 1152</span><span><i style={{ background: '#287da1' }} />New 1511</span></div><div className="refinement-grid"><BarPanel model="YOLO11m" kind="overall" panel="A" play={visible} /><BarPanel model="DINO-R50" kind="overall" panel="B" play={visible} /><BarPanel model="YOLO11m" kind="classes" panel="C" play={visible} /><BarPanel model="DINO-R50" kind="classes" panel="D" play={visible} /></div></div>
}

function HistogramPanel({ dataset, play }: { dataset: typeof overlapBins[number]; play: boolean }) {
  const width = 450, height = 310
  const margin = { top: 36, right: 18, bottom: 58, left: 64 }
  const x = scaleLinear().domain([0, 1]).range([margin.left, width - margin.right])
  const maximum = Math.ceil(Math.max(...dataset.counts) / 5000) * 5000
  const y = scaleLinear().domain([0, maximum]).range([height - margin.bottom, margin.top])
  const barWidth = (width - margin.left - margin.right) / 21
  const [focus, setFocus] = useState<number | null>(null)
  const [displayFocus, clearDisplayFocus] = useStickyFocus(focus)
  const svgRef = useRef<SVGSVGElement>(null)
  const bars = dataset.counts.map((count) => ({ y: y(count), height: y(0) - y(count) }))
  useBarGrowth(svgRef, play, y(0), bars)
  return <svg ref={svgRef} className="research-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${dataset.title} distribution across 189,764 illustrations`}>
    <text className="chart-panel-title chart-panel-title-centred" x={width / 2} y="20">{dataset.title}</text>
    {yTicks(0, maximum, maximum / 5000 + 1).map((tick) => <g key={tick} className="chart-grid"><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} /><text x={margin.left - 10} y={y(tick) + 4}>{tick === 0 ? '0' : `${tick / 1000}k`}</text></g>)}
    {[0, .2, .4, .6, .8, 1].map((tick) => <text key={tick} className="chart-tick chart-tick-x" x={x(tick)} y={height - margin.bottom + 24}>{tick.toFixed(1)}</text>)}
    <text className="chart-axis-label" x={width / 2} y={height - 13}>Fraction shared</text><text className="chart-axis-label" transform={`translate(17 ${height / 2}) rotate(-90)`}>Illustrations</text>
    {dataset.counts.map((count, index) => {
      const start = index / 21, end = (index + 1) / 21
      return <g key={index} className="chart-bar" role="button" tabIndex={0} aria-label={`${start.toFixed(2)} to ${end.toFixed(2)} shared, ${count.toLocaleString()} illustrations`} onFocus={() => setFocus(index)} onBlur={() => setFocus(null)} onMouseEnter={() => setFocus(index)} onMouseLeave={() => setFocus(null)}><rect x={margin.left + index * barWidth + .7} y={y(count)} width={Math.max(1, barWidth - 1.4)} height={y(0) - y(count)} fill={dataset.colour} opacity={focus === null || focus === index ? .9 : .38} /></g>
    })}
    {displayFocus !== null && (
      <g className="chart-callout" transform={`translate(${Math.min(width - 62, Math.max(62, margin.left + (displayFocus + .5) * barWidth))} ${Math.max(32, y(dataset.counts[displayFocus]) - 10)})`}>
        <TooltipFade open={focus !== null} onExited={clearDisplayFocus}>
          <rect x="-57" y="-25" width="114" height="24" rx="4" />
          <text>{dataset.counts[displayFocus].toLocaleString()} images</text>
        </TooltipFade>
      </g>
    )}
  </svg>
}

function OverlapChart() {
  const [wrapRef, visible] = useRevealOnScroll<HTMLDivElement>()
  return <div className="paired-chart-grid" ref={wrapRef}>{overlapBins.map((dataset) => <HistogramPanel key={dataset.title} dataset={dataset} play={visible} />)}</div>
}

function StabilityPanel({ metric }: { metric: 'ari' | 'ami' }) {
  const width = 450, height = 320
  const margin = { top: 38, right: 18, bottom: 58, left: 68 }
  const domain = metric === 'ari' ? [.48, .63] : [.74, .805]
  const x = scalePoint<number>().domain([50, 100, 200, 400]).range([margin.left, width - margin.right])
  const y = scaleLinear().domain(domain).range([height - margin.bottom, margin.top])
  const clusterCounts = [50, 100, 200, 400]
  const [focus, setFocus] = useState<number | null>(null)
  const [displayFocus, clearDisplayFocus] = useStickyFocus(focus)
  const valuesFor = (model: 'OpenCLIP' | 'DINOv2') => stability.filter((value) => value.model === model)
  return <svg className="research-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric === 'ari' ? 'Adjusted Rand index' : 'Adjusted mutual information'} across K-means seeds`}>
    <text className="chart-panel-title chart-panel-title-centred" x={width / 2} y="20">{metric === 'ari' ? 'Partition stability across seeds' : 'Information stability across seeds'}</text>
    {yTicks(domain[0], domain[1], 5).map((tick) => <g key={tick} className="chart-grid"><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} /><text x={margin.left - 10} y={y(tick) + 4}>{tick.toFixed(2)}</text></g>)}
    {clusterCounts.map((tick) => <text key={tick} className="chart-tick chart-tick-x" x={x(tick)} y={height - margin.bottom + 24}>{tick}</text>)}
    <text className="chart-axis-label" x={width / 2} y={height - 13}>Number of clusters (K)</text>
    {(['OpenCLIP', 'DINOv2'] as const).map((model) => {
      const rows = valuesFor(model)
      const band = area<typeof rows[number]>().x((value) => x(value.k) ?? 0).y0((value) => y(value[metric][0])).y1((value) => y(value[metric][2])).curve(curveMonotoneX)
      const centre = line<typeof rows[number]>().x((value) => x(value.k) ?? 0).y((value) => y(value[metric][1])).curve(curveMonotoneX)
      return <g key={model}><path d={band(rows) ?? ''} fill={colours[model]} opacity=".14" /><path className="chart-line" d={centre(rows) ?? ''} stroke={colours[model]} />{rows.map((row) => <circle key={row.k} className={focus === row.k ? 'shared-point active' : 'shared-point'} cx={x(row.k)} cy={y(row[metric][1])} r="5" fill={colours[model]} />)}</g>
    })}
    {focus !== null && <line className="shared-hover-line" x1={x(focus)} x2={x(focus)} y1={margin.top} y2={height - margin.bottom} />}
    {displayFocus !== null && (
      <g className="shared-tooltip shared-tooltip-compact" transform={`translate(${(x(displayFocus) ?? 0) > width * .62 ? (x(displayFocus) ?? 0) - 201 : (x(displayFocus) ?? 0) + 12} ${margin.top + 8})`}>
        <TooltipFade open={focus !== null} onExited={clearDisplayFocus}>
          <rect width="189" height="91" rx="8" />
          <text className="shared-tooltip-title" x="13" y="20">K = {displayFocus}</text>
          {(['OpenCLIP', 'DINOv2'] as const).map((model, index) => {
            const values = valuesFor(model).find((row) => row.k === displayFocus)?.[metric] ?? [0, 0, 0]
            return <g key={model} transform={`translate(0 ${38 + index * 22})`}><circle cx="15" cy="0" r="4" fill={colours[model]} /><text className="shared-tooltip-label" x="27" y="4">{model}</text><text className="shared-tooltip-value" x="176" y="-2">{values[1].toFixed(3)}</text><text className="shared-tooltip-range" x="176" y="9">{values[0].toFixed(3)}–{values[2].toFixed(3)}</text></g>
          })}
        </TooltipFade>
      </g>
    )}
    {clusterCounts.map((clusterCount, index) => {
      const currentX = x(clusterCount) ?? 0
      const previousX = index === 0 ? margin.left : (x(clusterCounts[index - 1]) ?? currentX)
      const nextX = index === clusterCounts.length - 1 ? width - margin.right : (x(clusterCounts[index + 1]) ?? currentX)
      const openclip = valuesFor('OpenCLIP')[index][metric]
      const dinov2 = valuesFor('DINOv2')[index][metric]
      return <rect key={clusterCount} className="shared-hover-target" role="button" tabIndex={0} aria-label={`K ${clusterCount}: OpenCLIP mean ${openclip[1].toFixed(3)}, range ${openclip[0].toFixed(3)} to ${openclip[2].toFixed(3)}; DINOv2 mean ${dinov2[1].toFixed(3)}, range ${dinov2[0].toFixed(3)} to ${dinov2[2].toFixed(3)}`} x={(previousX + currentX) / 2} y={margin.top} width={(nextX - previousX) / 2} height={height - margin.top - margin.bottom} onFocus={() => setFocus(clusterCount)} onBlur={() => setFocus(null)} onMouseEnter={() => setFocus(clusterCount)} onMouseLeave={() => setFocus(null)} />
    })}
  </svg>
}

function StabilityChart() {
  return <div><Legend models={['OpenCLIP', 'DINOv2']} /><div className="paired-chart-grid"><StabilityPanel metric="ari" /><StabilityPanel metric="ami" /></div></div>
}

function ResearchFigure({ number, title, caption, children }: { number: string; title: string; caption: string; children: React.ReactNode }) {
  return <figure className="research-figure"><div className="research-figure-heading"><span>{number}</span><h2>{title}</h2></div><div className="research-figure-canvas">{children}</div><figcaption>{caption}</figcaption></figure>
}

export function MethodologyPage() {
  return <article className="research-page">
    <header className="research-header"><h1>Methods &amp; Findings</h1></header>
    <section className="research-section" aria-labelledby="layout-detection-heading">
      <div className="research-section-label"><span>01</span><h2 id="layout-detection-heading">Page-layout detection</h2></div>
      <ResearchFigure number="1" title="Learning across training-set sizes" caption="Test-set COCO AP on the fixed 263-image evaluation set. DINO-R50 exceeded YOLO11m at every training-set size; each point is the validation-selected checkpoint from seed 20260822."><LearningCurveChart /></ResearchFigure>
      <ResearchFigure number="2" title="Effect of dataset refinement" caption="Paired evaluation on the same 263-image version-three test set. The 1,511-image models continued from the earlier 1,152-image checkpoints, so every old/new comparison uses the same annotations and evaluator."><RefinementChart /></ResearchFigure>
    </section>
    <section className="research-section" aria-labelledby="visual-similarity-heading">
      <div className="research-section-label"><span>02</span><h2 id="visual-similarity-heading">Illustration similarity</h2></div>
      <ResearchFigure number="3" title="Agreement between embedding models" caption="Distribution across all 189,764 crops of the fraction of top-20 neighbour identities shared by OpenCLIP and DINOv2. Cross-book retrieval removes neighbours from the query crop's own book and produces lower overlap."><OverlapChart /></ResearchFigure>
      <ResearchFigure number="4" title="K-means stability across seeds" caption="Mean agreement across the three pairwise comparisons formed by seeds 42, 271828, and 314159. Ribbons show the minimum-to-maximum range. ARI measures partition agreement; AMI measures shared information after chance correction."><StabilityChart /></ResearchFigure>
    </section>
  </article>
}
