import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clampProgress } from './path'
import type { ExploreState } from './explore'

gsap.registerPlugin(ScrollTrigger)

export default function useJourneyScroll(explore: ExploreState) {
  const progress = useRef({ target: 0, current: 0 })

  useEffect(() => {
    const sync = (trigger: ScrollTrigger) => {
      if (explore.phase !== 'travel' || performance.now() < explore.cooldownUntil) return
      progress.current.target = clampProgress(trigger.progress)
    }
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: sync,
      onRefresh: sync,
    })
    sync(trigger)
    // Also initialise correctly if the browser restores a previous scroll position.
    progress.current.current = progress.current.target
    return () => trigger.kill()
  }, [explore])

  return progress
}
