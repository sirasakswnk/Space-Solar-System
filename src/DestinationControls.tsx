import { journeyPlanets } from './data/planets'

export default function DestinationControls({ context, onNavigate, onReplay }: {
  context: 'travel' | 'explore' | 'overview'; onNavigate: (id: string) => void; onReplay: () => void;
}) {
  return <div className="destination-controls" data-navigation={context}>
    <div className="destination-grid" role="group" aria-label="เลือกดาวปลายทาง">
      {journeyPlanets.map(planet => <button key={planet.id} type="button" data-destination={planet.id}
        aria-label={`ไปยัง ${planet.name} — ${planet.thaiName}`} onClick={() => onNavigate(planet.id)}>{planet.name}</button>)}
    </div>
    <button type="button" className="replay-button" data-replay onClick={onReplay}>เริ่มการเดินทางใหม่</button>
  </div>
}
