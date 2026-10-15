import { Canvas } from '@react-three/fiber'
import { useState, useRef } from 'react'
import JourneyScene from './scene/JourneyScene'
import useJourneyScroll from './journey/useJourneyScroll'
import { createExploreState } from './journey/explore'
import useExploreJourney from './journey/useExploreJourney'
import ExplorePanel from './ExplorePanel'
import type { Planet } from './data/planets'
import { journeyPlanets } from './data/planets'
import { journeyScrollLength } from './journey/path'
import DestinationControls from './DestinationControls'

export default function App() {
  const [explore] = useState(createExploreState)
  const progress = useJourneyScroll(explore)
  const { phase, changePhase, open, close, selectedHotspot, selectHotspot, resetView, axisVisible, toggleAxis, navigate } = useExploreJourney(explore, progress)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const navigationRef = useRef<HTMLDetailsElement>(null)
  const navigationSummaryRef = useRef<HTMLElement>(null)
  const overviewRef = useRef<HTMLElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapLabels = useRef<Record<string, HTMLElement | null>>({})
  const onNavigate = (id: string) => {
    if (navigationRef.current) navigationRef.current.open = false
    navigate(id, navigationSummaryRef.current)
  }
  const onReplay = () => {
    if (navigationRef.current) navigationRef.current.open = false
    navigate(null, titleRef.current)
  }
  const hotspotButtons = useRef<Record<string, HTMLButtonElement | null>>({})
  const meterRef = useRef<HTMLProgressElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const hoverRef = useRef<HTMLSpanElement>(null)
  const openExplore = (planet?: Planet) => open(exploreButtonRef.current, planet)
  return (
    <main className="experience" aria-labelledby="site-title" data-mode={phase}
      style={{ minHeight: `calc(100vh + ${journeyScrollLength}px)` }}>
      <header className="intro">
        <p className="eyebrow">Solar System Journey</p>
        <h1 ref={titleRef} id="site-title" tabIndex={-1}>BEYOND</h1>
        <p className="subtitle">การเดินทางสำรวจระบบสุริยะ</p>
      </header>
      <details ref={navigationRef} className="travel-navigation">
        <summary ref={navigationSummaryRef}>เลือกจุดหมาย / เริ่มใหม่</summary>
        <DestinationControls context="travel" onNavigate={onNavigate} onReplay={onReplay} />
      </details>

      <div
        className="scene"
        role="img"
        aria-label="ยานสำรวจเดินทางจาก Earth ผ่าน Mercury, Venus, Mars, Jupiter, Saturn, Uranus และ Neptune เลื่อนลงเพื่อเดินหน้า เลื่อนขึ้นเพื่อย้อนกลับ"
      >
        <Canvas
          camera={{ position: [3, 3, 7], fov: 50, near: 0.1, far: 1000 }}
          dpr={[1, 1.5]}
          onCreated={({ gl, scene, camera }) => {
            // Read-only development diagnostics for checking the applied 3D pose.
            if (import.meta.env.DEV) Object.defineProperty(gl.domElement, 'journeySnapshot', {
              configurable: true,
              get: () => ({
                ...scene.userData.journeyProgress,
                launch: scene.userData.launchEffects,
                engine: scene.userData.engineEffects,
                shipAppearance: scene.userData.shipAppearance,
                earth: scene.userData.earthAppearance,
                mercury: scene.userData.mercuryAppearance ? { ...scene.userData.mercuryAppearance } : null,
                craterHighlight: scene.getObjectByName('mercury-crater-highlight')?.visible,
                venus: scene.userData.venusAppearance ? { ...scene.userData.venusAppearance } : null,
                cloudHighlight: scene.getObjectByName('venus-cloud-highlight')?.visible,
                mars: scene.userData.marsAppearance ? { ...scene.userData.marsAppearance } : null,
                terrainHighlight: scene.getObjectByName('mars-terrain-highlight')?.visible,
                polarHighlight: scene.getObjectByName('mars-polar-highlight')?.visible,
                jupiter: scene.userData.jupiterAppearance ? { ...scene.userData.jupiterAppearance } : null,
                jupiterCloudHighlight: scene.getObjectByName('jupiter-clouds-highlight')?.visible,
                saturn: scene.userData.saturnAppearance ? { ...scene.userData.saturnAppearance } : null,
                saturnBodyHighlight: scene.getObjectByName('saturn-body-highlight')?.visible,
                uranus: scene.userData.uranusAppearance ? { ...scene.userData.uranusAppearance } : null,
                uranusAtmosphereHighlight: scene.getObjectByName('uranus-atmosphere-highlight')?.visible,
                neptune: scene.userData.neptuneAppearance ? { ...scene.userData.neptuneAppearance } : null,
                neptuneAtmosphereHighlight: scene.getObjectByName('neptune-atmosphere-highlight')?.visible,
                ship: scene.getObjectByName('ship')?.position.toArray(),
                shipQuaternion: scene.getObjectByName('ship')?.quaternion.toArray(),
                planets: journeyPlanets.map(({ id }) => ({ id, visible: scene.getObjectByName(`planet-${id}`)?.visible })),
                stormHighlight: scene.getObjectByName('jupiter-storm-highlight')?.visible,
                axisVisible: scene.getObjectByName('uranus-axis')?.visible,
                routeComparisonVisible: scene.getObjectByName('neptune-route-comparison')?.visible,
                overview: scene.userData.overview,
                pointerLook: scene.userData.pointerLook ? structuredClone(scene.userData.pointerLook) : null,
                camera: camera.position.toArray(),
                cameraQuaternion: camera.quaternion.toArray(),
                explore: scene.userData.exploreState ? {
                  phase: scene.userData.exploreState.phase,
                  planet: scene.userData.exploreState.planet.id,
                  orbit: { ...scene.userData.exploreState.orbit },
                  savedScrollY: scene.userData.exploreState.saved?.scrollY,
                  selectedHotspot: scene.userData.exploreState.selectedHotspot,
                  focusing: !!scene.userData.exploreState.focus,
                  replayCount: scene.userData.exploreState.replayCount,
                  pendingDestination: scene.userData.exploreState.navigation?.planet.id ?? null,
                } : null,
              }),
            })
          }}
          fallback={<p className="fallback">เบราว์เซอร์นี้ไม่รองรับฉากสามมิติ</p>}
        >
          <JourneyScene progress={progress} meterRef={meterRef} percentRef={percentRef} labelRef={labelRef}
            exploreButtonRef={exploreButtonRef} hoverRef={hoverRef} explore={explore}
            changePhase={changePhase} openExplore={openExplore} hotspotButtons={hotspotButtons}
            overviewRef={overviewRef} mapRef={mapRef} mapLabels={mapLabels} />
        </Canvas>
      </div>
      <div ref={mapRef} className="overview-labels" hidden aria-label="จุดในภาพรวมเส้นทาง">
        <span ref={element => { mapLabels.current.earth = element }}>Earth · เริ่มต้น</span>
        {journeyPlanets.map(planet => <button key={planet.id} type="button" data-map-destination={planet.id}
          ref={element => { mapLabels.current[planet.id] = element }}
          aria-label={`เลือก ${planet.name} จากภาพรวม`} onClick={() => onNavigate(planet.id)}>{planet.name}</button>)}
      </div>
      <section ref={overviewRef} className="overview-panel" hidden aria-labelledby="overview-title">
        <h2 id="overview-title">ถึงปลายทางแล้ว</h2>
        <p>Earth → Neptune · แวะสำรวจดาวทั้งเจ็ด</p>
        <p>เลือกดาวเพื่อกลับไปชม หรือเริ่มการเดินทางใหม่ เลื่อนขึ้นเพื่อย้อนออกจากภาพรวม</p>
        <DestinationControls context="overview" onNavigate={onNavigate} onReplay={onReplay} />
      </section>

      <footer className="caption">
        <p ref={labelRef}>Earth — ฐานปล่อย</p>
        <span ref={hoverRef} className="hover-name" hidden />
        <button ref={exploreButtonRef} id="explore-planet" type="button" hidden
          title="หยุดเลื่อนเพื่อสำรวจดาว" onClick={() => openExplore()}>สำรวจดาว</button>
        <p className="scroll-hint">เลื่อนลงเพื่อเดินหน้า · เลื่อนขึ้นเพื่อย้อนกลับ · หยุดเลื่อนเพื่อพักชม</p>
        <p className="scale-note">
          ภาพจำลองเพื่อการสำรวจ ขนาด ระยะห่าง และเส้นทางไม่ได้เป็นมาตราส่วนจริง
        </p>
        <p className="asset-credit">ภาพ Earth / Mercury / Venus / Mars / Jupiter / Saturn / Uranus / Neptune: <a href="https://ssi.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a>
          {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p>
      </footer>
      <aside className="journey-meter" aria-label="เส้นทาง Earth ผ่านดาวทั้งเจ็ดถึง Neptune">
        <p>Earth → {journeyPlanets.map(planet => planet.name).join(' → ')}</p>
        <label htmlFor="journey-progress">ความคืบหน้า <span ref={percentRef}>0%</span></label>
        <progress ref={meterRef} id="journey-progress" max={100} value={0} />
      </aside>
      <ExplorePanel model={explore} phase={phase} close={close} selectedHotspot={selectedHotspot}
        selectHotspot={selectHotspot} resetView={resetView} hotspotButtons={hotspotButtons}
        axisVisible={axisVisible} toggleAxis={toggleAxis} onNavigate={onNavigate} onReplay={onReplay} />
    </main>
  )
}
