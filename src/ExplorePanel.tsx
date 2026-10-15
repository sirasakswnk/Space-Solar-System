import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { ExplorePhase, ExploreState } from './journey/explore'
import { rotateOrbit, zoomOrbit } from './journey/explore'
import type { HotspotButtons } from './scene/PlanetHotspots'
import { journeyPlanets } from './data/planets'
import DestinationControls from './DestinationControls'

export default function ExplorePanel({ model, phase, close, selectedHotspot, selectHotspot, resetView, hotspotButtons, axisVisible, toggleAxis, onNavigate, onReplay }: {
  model: ExploreState; phase: ExplorePhase; close: () => void;
  selectedHotspot: string | null; selectHotspot: (id: string) => void;
  resetView: () => void; hotspotButtons: HotspotButtons;
  axisVisible: boolean; toggleAxis: () => void;
  onNavigate: (id: string) => void; onReplay: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const drag = useRef<null | { id: number; x: number; y: number }>(null)
  const active = phase !== 'travel'
  useEffect(() => {
    if (!active || !dialog.current) return
    const element = dialog.current
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    if (panel.current) panel.current.scrollTop = 0
    const navigation = panel.current?.querySelector('details')
    if (navigation) navigation.open = false
    closeButton.current?.focus()
    const cancelDrag = () => {
      if (drag.current && surface.current?.hasPointerCapture(drag.current.id)) {
        surface.current.releasePointerCapture(drag.current.id)
      }
      drag.current = null
    }
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      if (model.phase === 'exploring') {
        model.focus = null
        const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
        zoomOrbit(model.orbit, Math.max(-600, Math.min(600, pixels)), model.planet)
      }
    }
    const sceneSurface = surface.current
    sceneSurface?.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('blur', cancelDrag)
    return () => {
      cancelDrag()
      sceneSurface?.removeEventListener('wheel', wheel)
      window.removeEventListener('blur', cancelDrag)
      element.close()
      document.body.style.overflow = oldOverflow
      // The opener is inert until the modal closes; restore focus after that.
      if (model.phase === 'travel') {
        (model.returnFocus ?? model.saved?.opener)?.focus({ preventScroll: true })
        model.returnFocus = null
      }
    }
  }, [active, model])
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const previous = drag.current
    if (!previous || previous.id !== event.pointerId || model.phase !== 'exploring') return
    if (!event.buttons) { drag.current = null; return }
    model.focus = null
    rotateOrbit(model.orbit, -(event.clientX - previous.x) * 0.006, (event.clientY - previous.y) * 0.006)
    previous.x = event.clientX
    previous.y = event.clientY
  }
  const disabled = phase !== 'exploring'
  const planet = model.planet
  const selected = planet.hotspots.find(point => point.id === selectedHotspot)
  const rotate = (yaw: number, pitch: number) => { model.focus = null; rotateOrbit(model.orbit, yaw, pitch) }
  const zoom = (delta: number) => { model.focus = null; zoomOrbit(model.orbit, delta, planet) }
  return (
    <dialog ref={dialog} className="explore-dialog" aria-labelledby="explore-title"
      onCancel={event => { event.preventDefault(); close() }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary')]
          .filter(element => element.getClientRects().length > 0)
        const first = buttons[0]
        const last = buttons.at(-1)
        if (!first) { event.preventDefault(); return }
        if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
          event.preventDefault(); last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus()
        }
      }}>
      <div ref={surface} className="explore-surface" aria-label="ลากเพื่อหมุนรอบดาว ใช้ล้อเมาส์เพื่อซูม"
        onPointerDown={event => {
          if (event.button !== 0 || model.phase !== 'exploring') return
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          event.currentTarget.setPointerCapture(event.pointerId)
        }} onPointerMove={move}
        onPointerUp={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          drag.current = null
        }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
        {planet.hotspots.map((point, index) => (
          <button key={point.id} ref={element => { hotspotButtons.current[point.id] = element }}
            type="button" className="hotspot-marker" data-hotspot={point.id} hidden
            aria-label={`จุดข้อมูล ${index + 1}: ${point.title}`} aria-pressed={selectedHotspot === point.id}
            disabled={disabled} onPointerDown={event => event.stopPropagation()}
            onClick={() => selectHotspot(point.id)}>{index + 1}</button>
        ))}
      </div>
      <section ref={panel} className="explore-panel">
        <h2 id="explore-title">{planet.name} — {planet.thaiName}</h2>
        <button ref={closeButton} type="button" className="return-button" onClick={close} disabled={phase === 'exiting'}>
          กลับสู่การเดินทาง
        </button>
        <p role="status">{phase === 'entering' ? 'กำลังเข้าสู่มุมสำรวจ…' : phase === 'exiting' ? 'กำลังกลับสู่การเดินทาง…' : 'โหมดสำรวจดาว'}</p>
        <p>{planet.summary}</p>
        <div className="hotspot-list" role="group" aria-label="จุดข้อมูลดาว">
          {planet.hotspots.map((point, index) => <button key={point.id} type="button" disabled={disabled}
            data-info={point.id} aria-pressed={selectedHotspot === point.id} aria-controls="hotspot-detail"
            onClick={() => selectHotspot(point.id)}>{index + 1}. {point.title}</button>)}
        </div>
        <section id="hotspot-detail" className="hotspot-detail" aria-live="polite" aria-atomic="true">
          {selected ? <>
            <h3>{selected.title}</h3>
            <p>{selected.summary}</p>
            <ul>{selected.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
            <p className="illustration-note">{selected.illustrationNote}</p>
          </> : <p>เลือกจุดบนดาวหรือปุ่มข้อมูล เพื่ออ่านและขยับกล้องเข้าชม</p>}
        </section>
        {planet.axisTilt !== undefined && <div className="axis-control">
          <button type="button" disabled={disabled} data-axis-toggle aria-pressed={axisVisible}
            onClick={toggleAxis}>{axisVisible ? 'ซ่อนแนวแกน' : 'แสดงแนวแกน'}</button>
          <p>แนวแกนหมุนสีฟ้า · แนวอ้างอิงสีเทา · มุมเอียงประมาณ 97.77°</p>
        </div>}
        {selected?.kind === 'route' && <div className="route-comparison-legend" aria-label="ลำดับจุดในเส้นทางย่อ">
          <p>เส้นทางย่อด้านซ้าย: จากบนลงล่าง</p>
          <ol>
            <li>Earth — จุดเริ่มต้น</li>
            {journeyPlanets.map(stop => <li key={stop.id}>
              <span style={{ color: stop.scene.color }}>{stop.name}</span>{stop.id === planet.id ? ' — อยู่ที่นี่' : ''}
            </li>)}
          </ol>
        </div>}
        <a className="source-link" href={planet.source.url} target="_blank" rel="noopener noreferrer">
          แหล่งข้อมูล: {planet.source.title} (เปิดแท็บใหม่)
        </a>
        {['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.id) && <p className="asset-credit">ภาพ {planet.name}: <a href="https://ssi.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a>
          {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p>}
        <p>ลากบนฉากเพื่อหมุนรอบดาว ใช้ล้อเมาส์เพื่อซูมเข้าและออก</p>
        <div className="orbit-buttons" role="group" aria-label="หมุนมุมมอง">
          <button type="button" disabled={disabled} onClick={() => rotate(-0.2, 0)}>หมุนซ้าย</button>
          <button type="button" disabled={disabled} onClick={() => rotate(0.2, 0)}>หมุนขวา</button>
          <button type="button" disabled={disabled} onClick={() => rotate(0, 0.15)}>มองขึ้น</button>
          <button type="button" disabled={disabled} onClick={() => rotate(0, -0.15)}>มองลง</button>
        </div>
        <div className="orbit-buttons" role="group" aria-label="ซูมมุมมอง">
          <button type="button" disabled={disabled} onClick={() => zoom(-160)}>ซูมเข้า</button>
          <button type="button" disabled={disabled} onClick={() => zoom(160)}>ซูมออก</button>
        </div>
        <button type="button" disabled={disabled} onClick={resetView}>คืนมุมเริ่มต้น</button>
        <details className="explore-navigation">
          <summary>เปลี่ยนจุดหมาย / เริ่มใหม่</summary>
          <DestinationControls context="explore" onNavigate={onNavigate} onReplay={onReplay} />
        </details>
        <p>ใช้ปุ่มแทนการลากได้ กด Escape เพื่อกลับสู่การเดินทาง</p>
        <p>การเดินทางพักอยู่ที่ตำแหน่งเดิมระหว่างสำรวจ เลื่อนบนแผงนี้เพื่ออ่านข้อความโดยไม่ซูมฉาก</p>
        <p className="scale-note">ภาพจำลองเพื่อการสำรวจ ขนาด ระยะห่าง และเส้นทางไม่ได้เป็นมาตราส่วนจริง</p>
      </section>
    </dialog>
  )
}
