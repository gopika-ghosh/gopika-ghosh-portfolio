import { lazy, Suspense, useMemo, useState } from 'react'
import { useAudioCues } from './audio/useAudioCues'
import { chapters } from './content/chapters'
import { webglAvailable } from './lib/env'
import { scrollStore } from './journey/scrollStore'
import { buildTimeline } from './journey/timeline'
import { useSmoothScroll } from './journey/useSmoothScroll'
import { Chapters } from './ui/Chapters'
import { DebugHud } from './ui/DebugHud'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { Fallback2D } from './ui/Fallback2D'
import { Loader } from './ui/Loader'
import { Nav } from './ui/Nav'
import { ProjectPanel } from './ui/ProjectPanel'
import { ViewAllGrid } from './ui/ViewAllGrid'

// The 3D layer (three.js, R3F, post-processing) is its own chunk: the HTML content and
// loader render without waiting for it, and the 2D fallback never downloads it at all.
const Experience = lazy(() => import('./scene/Experience').then((m) => ({ default: m.Experience })))

const debug = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const [mode, setMode] = useState<'3d' | '2d'>(webglAvailable ? '3d' : '2d')
  if (mode === '2d') return <Fallback2D />
  return (
    <Journey
      onFail={(e) => {
        console.warn('[heliocentric] 3D unavailable, switching to the 2D version', e)
        setMode('2d')
      }}
    />
  )
}

function Journey({ onFail }: { onFail: (e: unknown) => void }) {
  const timeline = useMemo(() => buildTimeline(chapters), [])
  useSmoothScroll(timeline)
  useAudioCues(timeline)

  // Debug handle for scripts/inspect.mjs.
  if (debug) Object.assign(window, { __journey: { stops: timeline.stops, unit: () => scrollStore.unit } })

  return (
    <>
      <ErrorBoundary onError={onFail}>
        <Suspense fallback={null}>
          <Experience timeline={timeline} onContextLost={onFail} />
        </Suspense>
      </ErrorBoundary>
      <Chapters timeline={timeline} />
      <Nav timeline={timeline} />
      <ProjectPanel />
      <ViewAllGrid />
      <Loader />
      {debug && <DebugHud timeline={timeline} />}
    </>
  )
}
