import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clampProgress } from './path'
import type { ExploreState } from './explore'

gsap.registerPlugin(ScrollTrigger)

export default function useJourneyScroll(explore: ExploreState) {
  const progress = useRef({ target: 0, current: 0 })

  useEffect(() => {
    let resync = 0
    const sync = (trigger: ScrollTrigger) => {
      if (explore.phase !== 'travel') return
      // Wheel input is blocked during the post-exploration cooldown, but a
      // scrollbar or programmatic scroll can still land then; read it afterwards.
      const wait = explore.cooldownUntil - performance.now()
      if (wait > 0) {
        window.clearTimeout(resync)
        resync = window.setTimeout(() => sync(trigger), wait + 1)
        return
      }
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
    return () => { window.clearTimeout(resync); trigger.kill() }
  }, [explore])

  return progress
}
