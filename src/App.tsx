import { useMemo } from 'react'
import { chapters } from './content/chapters'
import { scrollStore } from './journey/scrollStore'
import { buildTimeline } from './journey/timeline'
import { useSmoothScroll } from './journey/useSmoothScroll'
import { Experience } from './scene/Experience'
import { Chapters } from './ui/Chapters'
import { DebugHud } from './ui/DebugHud'
import { Loader } from './ui/Loader'
import { Nav } from './ui/Nav'
import { Cursor } from './ui/Cursor'
import { useAudioCues } from './audio/useAudioCues'
import { ProjectPanel } from './ui/ProjectPanel'
import { ViewAllGrid } from './ui/ViewAllGrid'

const debug = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const timeline = useMemo(() => buildTimeline(chapters), [])
  useSmoothScroll(timeline)
  useAudioCues(timeline)

  // Debug handle for scripts/inspect.mjs.
  if (debug) Object.assign(window, { __journey: { stops: timeline.stops, unit: () => scrollStore.unit } })

  return (
    <>
      <Experience timeline={timeline} />
      <Chapters timeline={timeline} />
      <Nav timeline={timeline} />
      <ProjectPanel />
      <ViewAllGrid />
      <Loader />
      {debug && <DebugHud timeline={timeline} />}
      <Cursor />
    </>
  )
}
