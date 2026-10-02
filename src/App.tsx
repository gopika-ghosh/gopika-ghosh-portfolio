import { useMemo } from 'react'
import { chapters } from './content/chapters'
import { buildTimeline } from './journey/timeline'
import { useSmoothScroll } from './journey/useSmoothScroll'
import { Experience } from './scene/Experience'
import { Chapters } from './ui/Chapters'
import { DebugHud } from './ui/DebugHud'

const debug = new URLSearchParams(window.location.search).has('debug')

export default function App() {
  const timeline = useMemo(() => buildTimeline(chapters), [])
  useSmoothScroll(timeline)

  return (
    <>
      <Experience timeline={timeline} />
      <Chapters timeline={timeline} />
      {debug && <DebugHud timeline={timeline} />}
    </>
  )
}
