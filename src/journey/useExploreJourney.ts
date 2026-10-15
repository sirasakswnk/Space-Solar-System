import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { ExplorePhase, ExploreState } from './explore'
import { hotspotOrbit, resetOrbit } from './explore'
import { getExplorePlanet } from './path'
import type { Planet } from '../data/planets'
import { applyNavigation, createNavigationRequest } from './navigation'

export default function useExploreJourney(model: ExploreState,
  progress: RefObject<{ target: number; current: number }>) {
  const [phase, setPhase] = useState<ExplorePhase>('travel')
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null)
  const [axisVisible, setAxisVisible] = useState(false)
  const changePhase = useCallback((next: ExplorePhase) => {
    model.phase = next
    setPhase(next)
    if (next === 'travel' && model.saved) {
      model.selectedHotspot = null
      setSelectedHotspot(null)
      model.axisVisible = false
      setAxisVisible(false)
      const saved = model.saved
      Object.assign(progress.current, { current: saved.current, target: saved.target })
      if (model.navigation) {
        const request = model.navigation
        applyNavigation(model, progress.current, request)
        window.scrollTo(0, request.pixel)
      } else {
        window.scrollTo(0, saved.scrollY)
        model.cooldownUntil = performance.now() + 180
      }
    }
  }, [model, progress])
  const open = useCallback((opener: HTMLElement | null, requested?: Planet) => {
    const state = progress.current
    const planet = getExplorePlanet(state.current)
    if (model.phase !== 'travel' || !planet || (requested && requested.id !== planet.id) || state.current !== state.target) return
    model.planet = planet
    model.saved = { ...state, scrollY: window.scrollY, opener,
      position: model.latestPosition.clone(), quaternion: model.latestQuaternion.clone() }
    resetOrbit(model.orbit, model.planet)
    model.selectedHotspot = null
    model.axisVisible = false
    setAxisVisible(false)
    model.focus = null
    setSelectedHotspot(null)
    model.fromPosition.copy(model.latestPosition)
    model.fromQuaternion.copy(model.latestQuaternion)
    model.elapsed = 0
    changePhase('entering')
    document.body.style.cursor = ''
  }, [model, progress, changePhase])
  const close = useCallback(() => {
    if (model.phase === 'travel' || model.phase === 'exiting') return
    model.focus = null
    model.fromPosition.copy(model.latestPosition)
    model.fromQuaternion.copy(model.latestQuaternion)
    model.elapsed = 0
    changePhase('exiting')
  }, [model, changePhase])
  const selectHotspot = useCallback((id: string) => {
    if (model.phase !== 'exploring') return
    const hotspot = model.planet.hotspots.find(point => point.id === id)
    if (!hotspot) return
    model.selectedHotspot = id
    setSelectedHotspot(id)
    if (hotspot.kind === 'axis') {
      model.axisVisible = true
      setAxisVisible(true)
    }
    // Replace the current focus animation from its applied orbit: latest selection wins.
    model.focus = { from: { ...model.orbit }, to: hotspotOrbit(model.planet, hotspot), elapsed: 0 }
  }, [model])
  const resetView = useCallback(() => {
    model.focus = null
    model.selectedHotspot = null
    setSelectedHotspot(null)
    model.axisVisible = false
    setAxisVisible(false)
    resetOrbit(model.orbit, model.planet)
  }, [model])

  const toggleAxis = useCallback(() => {
    if (model.phase !== 'exploring' || model.planet.axisTilt === undefined) return
    model.axisVisible = !model.axisVisible
    setAxisVisible(model.axisVisible)
  }, [model])

  const navigate = useCallback((id: string | null, focus: HTMLElement | null) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const request = createNavigationRequest(id, maxScroll, focus)
    if (!request) return
    if (model.phase !== 'travel') {
      model.navigation = request // Latest request replaces the pending destination.
      close()
      return
    }
    applyNavigation(model, progress.current, request)
    setSelectedHotspot(null)
    setAxisVisible(false)
    window.scrollTo(0, request.pixel)
    document.body.style.cursor = ''
    request.focus?.focus({ preventScroll: true })
    model.returnFocus = null
  }, [model, progress, close])

  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      if (model.phase !== 'travel') {
        if (!(event.target instanceof Element && event.target.closest('.explore-panel'))) event.preventDefault()
      } else if (performance.now() < model.cooldownUntil) {
        event.preventDefault()
        model.cooldownUntil = performance.now() + 180
      }
    }
    const restoreScroll = () => {
      if (model.phase !== 'travel' && model.saved && window.scrollY !== model.saved.scrollY) {
        window.scrollTo(0, model.saved.scrollY)
      }
    }
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('scroll', restoreScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('scroll', restoreScroll)
      document.body.style.cursor = ''
    }
  }, [model])
  return { phase, changePhase, open, close, selectedHotspot, selectHotspot, resetView, axisVisible, toggleAxis, navigate }
}
