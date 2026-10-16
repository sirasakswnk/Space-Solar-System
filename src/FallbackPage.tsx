import { journeyPlanets } from './data/planets'
import { planetImages } from './data/planetImages'

// Shown when the browser cannot create a WebGL context: the same journey
// content as readable text, with the local image maps as static pictures.
export default function FallbackPage() {
  return <main className="fallback-page" aria-labelledby="fallback-title">
    <header>
      <p className="eyebrow">Solar System Journey</p>
      <h1 id="fallback-title">BEYOND</h1>
      <p className="subtitle">การเดินทางสำรวจระบบสุริยะ</p>
    </header>
    <p className="fallback-notice" role="note">
      เบราว์เซอร์หรืออุปกรณ์นี้แสดงฉากสามมิติ (WebGL) ไม่ได้ จึงแสดงเนื้อหาการเดินทางแบบอ่านได้แทน
      ลองเปิดด้วย Chrome หรือ Edge รุ่นล่าสุด หรือเปิดการเร่งกราฟิก (hardware acceleration) ในการตั้งค่าเบราว์เซอร์
    </p>
    <nav aria-label="จุดหมายในเส้นทาง">
      <h2>เส้นทาง Earth ถึง Neptune</h2>
      <ol className="fallback-route">
        <li>Earth — จุดเริ่มต้น</li>
        {journeyPlanets.map(planet => <li key={planet.id}>
          <a href={`#planet-${planet.id}`}>{planet.name} — {planet.thaiName}</a>
        </li>)}
      </ol>
    </nav>
    <p className="scale-note">ภาพจำลองเพื่อการสำรวจ ขนาด ระยะห่าง และเส้นทางไม่ได้เป็นมาตราส่วนจริง</p>
    <section className="fallback-planet" aria-labelledby="planet-earth-title">
      <h2 id="planet-earth-title">Earth — โลก</h2>
      <img src={planetImages.earth.src} alt={planetImages.earth.alt} width={512} height={256} loading="lazy" />
      <p>จุดเริ่มต้นของการเดินทาง ยานออกจากฐานปล่อยบนโลก ผ่านชั้นบรรยากาศสู่อวกาศ</p>
    </section>
    {journeyPlanets.map(planet => <section key={planet.id} id={`planet-${planet.id}`}
      className="fallback-planet" aria-labelledby={`planet-${planet.id}-title`}>
      <h2 id={`planet-${planet.id}-title`}>{planet.name} — {planet.thaiName}</h2>
      <img src={planetImages[planet.id].src} alt={planetImages[planet.id].alt} width={512} height={256} loading="lazy" />
      <p>{planet.summary}</p>
      {planet.hotspots.map(hotspot => <div key={hotspot.id} className="fallback-hotspot">
        <h3>{hotspot.title}</h3>
        <p>{hotspot.summary}</p>
        <ul>{hotspot.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
        <p className="fallback-note">{hotspot.illustrationNote}</p>
      </div>)}
      <p><a href={planet.source.url} target="_blank" rel="noopener noreferrer">แหล่งข้อมูล: {planet.source.title} (เปิดแท็บใหม่)</a></p>
    </section>)}
    <footer className="fallback-footer">
      ภาพแผนที่ดาว: <a href="https://ssi.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a>
      {' · '}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
    </footer>
  </main>
}
