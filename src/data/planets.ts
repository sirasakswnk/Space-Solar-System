import { mercuryCraterAnchor } from './mercurySurface.ts'
import { venusCloudAnchor } from './venusAppearance.ts'
import { marsMapAnchor, marsMapRegions } from './marsAppearance.ts'
import { jupiterMapAnchor, jupiterMapRegions } from './jupiterAppearance.ts'
import { saturnBodyAnchor } from './saturnAppearance.ts'
import { uranusAxisTilt, uranusAtmosphereAnchor } from './uranusAppearance.ts'
import { neptuneAtmosphereAnchor } from './neptuneAppearance.ts'

export type Hotspot = {
  id: string
  title: string
  kind: 'crater' | 'environment' | 'clouds' | 'terrain' | 'polar' | 'storm' | 'rings' | 'body' | 'axis' | 'route'
  anchor: { yaw: number; pitch: number; height: number }
  view?: { yaw: number; pitch: number }
  focusDistance: number
  summary: string
  details: readonly string[]
  illustrationNote: string
}

export const venus: Planet = {
  id: 'venus', name: 'Venus', thaiName: 'ดาวศุกร์',
  summary: 'ดาวเคราะห์ลำดับที่สองจากดวงอาทิตย์ ห่อหุ้มด้วยเมฆหนาและบรรยากาศหนาแน่น',
  scene: { center: [-18, 10, -85], radius: 3.6, color: '#c9ac78' },
  orbit: { yaw: 0.55, pitch: 0.2, distance: 11, min: 4.8, max: 16 },
  source: { title: 'NASA — Venus Facts', url: 'https://science.nasa.gov/venus/venus-facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'venus-clouds', title: 'ชั้นเมฆ', kind: 'clouds',
      anchor: venusCloudAnchor, focusDistance: 8,
      summary: 'เมฆหนาของดาวศุกร์ประกอบด้วยหยดกรดซัลฟิวริก',
      details: ['เมฆปกคลุมทำให้การมองจากภายนอกในแสงที่ตามองเห็นไม่เผยพื้นผิว',
        'ภาพในฉากเน้นบริเวณชั้นเมฆ โดยไม่เปิดมุมมองทะลุลงไปถึงพื้นดาว'],
      illustrationNote: 'เส้นสีฟ้าเน้นบริเวณเมฆในแผนที่ภาพที่ผู้สร้างปรับสี ไม่ใช่พิกัดเมฆสด และไม่เปิดมองลงถึงพื้นดาว',
    },
    {
      id: 'venus-atmosphere', title: 'บรรยากาศและความร้อน', kind: 'environment',
      anchor: { yaw: 1.1, pitch: 0.5, height: 0.25 }, focusDistance: 8.8,
      summary: 'ดาวศุกร์เป็นดาวเคราะห์ที่ร้อนที่สุดในระบบสุริยะ',
      details: ['บรรยากาศมีคาร์บอนไดออกไซด์เป็นองค์ประกอบหลัก ซึ่งทำให้เกิดปรากฏการณ์เรือนกระจก',
        'ความดันที่พื้นผิวสูงประมาณ 93 เท่าของความดันที่ระดับน้ำทะเลบนโลก'],
      illustrationNote: 'จุดนี้เปิดข้อมูลบรรยากาศทั้งดาว ขอบแสงเป็นภาพจำลอง ไม่ใช่ตำแหน่งวัดหรือความหนาบรรยากาศจริง',
    },
  ],
}

export const mars: Planet = {
  id: 'mars', name: 'Mars', thaiName: 'ดาวอังคาร',
  summary: 'ดาวเคราะห์สีแดงที่มีบรรยากาศเบาบาง ภูมิประเทศหลากหลาย และน้ำแข็งบริเวณขั้วดาว',
  scene: { center: [18, 11, -126], radius: 3, color: '#b86642' },
  orbit: { yaw: 0.55, pitch: 0.2, distance: 9, min: 4.1, max: 14 },
  source: { title: 'NASA — Mars Facts', url: 'https://science.nasa.gov/mars/facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'mars-terrain', title: 'ภูมิประเทศสีแดง', kind: 'terrain',
      anchor: marsMapAnchor(marsMapRegions.terrain), focusDistance: 6.8,
      summary: 'แร่เหล็กที่เกิดออกซิเดชันทำให้ดินบนดาวอังคารดูเป็นสีแดง',
      details: ['ภูเขาไฟ หลุมจากการชน และสภาพอากาศได้เปลี่ยนแปลงภูมิประเทศมาเป็นเวลานาน',
        'ดาวอังคารมีทั้งภูเขาไฟขนาดใหญ่และระบบหุบเขาที่กว้างขวาง'],
      illustrationNote: 'เส้นสีฟ้าเน้นภูมิประเทศตัวอย่างในแผนที่ภาพที่ผู้สร้างปรับสี ไม่ระบุชื่อหรือพิกัดภูเขาหรือหุบเขาจริง',
    },
    {
      id: 'mars-polar', title: 'น้ำแข็งบริเวณขั้วดาว', kind: 'polar',
      anchor: marsMapAnchor(marsMapRegions.polar), focusDistance: 7,
      summary: 'ดาวอังคารมีน้ำแข็งและมีฤดูกาลที่เปลี่ยนไป',
      details: ['น้ำบนดาวอังคารส่วนหนึ่งอยู่ในรูปน้ำแข็งใต้พื้นผิวบริเวณขั้วดาว',
        'บรรยากาศเบาบางทำให้น้ำเหลวบนพื้นผิวคงอยู่ได้ไม่นาน'],
      illustrationNote: 'บริเวณสีอ่อนมาจากแผนที่ภาพ เส้นสีฟ้าใช้เลือกข้อมูล ไม่ใช่ขอบเขตน้ำแข็งหรือฤดูกาลปัจจุบัน แสงและขนาดเป็นภาพจำลอง',
    },
  ],
}

export type Planet = {
  id: string; name: string; thaiName: string
  summary: string
  scene: { center: [number, number, number]; radius: number; color: string }
  rings?: { inner: number; outer: number; tilt: number }
  axisTilt?: number
  orbit: { yaw: number; pitch: number; distance: number; min: number; max: number }
  source: { title: string; url: string; verified: string }
  hotspots: readonly Hotspot[]
}

// Scene coordinates describe the illustration, not geographic coordinates.
export const mercury: Planet = {
  id: 'mercury', name: 'Mercury', thaiName: 'ดาวพุธ',
  summary: 'ดาวเคราะห์ที่เล็กที่สุดในระบบสุริยะและอยู่ใกล้ดวงอาทิตย์ที่สุด',
  scene: { center: [0, 9, -50], radius: 2.6, color: '#938981' },
  orbit: { yaw: 0.55, pitch: 0.2, distance: 8, min: 3.6, max: 12 },
  source: { title: 'NASA — Mercury Facts', url: 'https://science.nasa.gov/mercury/facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'impact-craters', title: 'พื้นผิวและหลุมอุกกาบาต', kind: 'crater',
      anchor: mercuryCraterAnchor, focusDistance: 5.6,
      summary: 'พื้นผิวดาวพุธมีหลุมจำนวนมากจากการชนของวัตถุในอวกาศ',
      details: ['อุกกาบาตและดาวหางที่ชนพื้นผิวทำให้เกิดหลุมคล้ายที่พบบนดวงจันทร์',
        'แรงกระแทกบดหินและเหวี่ยงเศษออกไป บางหลุมจึงมีแนวรัศมีสว่างโดยรอบ'],
      illustrationNote: 'เส้นสีฟ้าเน้นบริเวณหลุมที่มีแนวรัศมีสว่างในแผนที่ภาพ ไม่ระบุชื่อหรือพิกัดหลุมจริง แสงและขนาดเป็นภาพจำลอง',
    },
    {
      id: 'environment', title: 'สภาพแวดล้อม', kind: 'environment',
      anchor: { yaw: 1.1, pitch: 0.5, height: 0.35 }, focusDistance: 6.4,
      summary: 'ดาวพุธมีเอกโซสเฟียร์เบาบางและอุณหภูมิพื้นผิวต่างกันมาก',
      details: ['พื้นผิวกลางวันอาจร้อนถึงประมาณ 430°C และกลางคืนอาจลดลงถึงประมาณ −180°C',
        'เอกโซสเฟียร์ประกอบด้วยอะตอมที่หลุดจากพื้นผิวจากลมสุริยะและการชนของอุกกาบาต'],
      illustrationNote: 'จุดนี้ใช้เปิดข้อมูลสภาพแวดล้อมทั้งดาว ไม่ใช่ตำแหน่งวัดหรือขอบเขตเอกโซสเฟียร์จริง',
    },
  ],
}

export const innerPlanets: readonly Planet[] = [mercury, venus, mars]

export const jupiter: Planet = {
  id: 'jupiter', name: 'Jupiter', thaiName: 'ดาวพฤหัสบดี',
  summary: 'ดาวเคราะห์ที่ใหญ่ที่สุดในระบบสุริยะ มีแถบเมฆและพายุขนาดใหญ่ในบรรยากาศ',
  scene: { center: [-18, 12, -183], radius: 6, color: '#c8a47f' },
  orbit: { yaw: 0.55, pitch: 0.2, distance: 18, min: 8, max: 28 },
  source: { title: 'NASA — Jupiter Facts', url: 'https://science.nasa.gov/jupiter/jupiter-facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'jupiter-clouds', title: 'แถบเมฆ', kind: 'clouds',
      anchor: jupiterMapAnchor(jupiterMapRegions.clouds), focusDistance: 15,
      summary: 'แถบสีของ Jupiter เป็นเมฆที่เคลื่อนไหวอยู่ในบรรยากาศไฮโดรเจนและฮีเลียม',
      details: ['แถบสีเข้มเรียกว่า belts และแถบสีอ่อนเรียกว่า zones',
        'กระแสลมพัดไปทางตะวันออกและตะวันตกในทิศตรงข้ามกันระหว่างแถบ'],
      illustrationNote: 'จุดนี้ยึดบริเวณแถบเมฆในแผนที่ภาพที่ผู้สร้างปรับสีและเติมส่วนที่ขาด เส้นสีฟ้าแสดงการเลือก ไม่ใช่สภาพเมฆ ณ เวลาปัจจุบัน',
    },
    {
      id: 'jupiter-storm', title: 'พายุ Great Red Spot', kind: 'storm',
      anchor: jupiterMapAnchor(jupiterMapRegions.storm), focusDistance: 13,
      summary: 'Great Red Spot เป็นพายุขนาดใหญ่ที่ดำรงอยู่มาหลายร้อยปี',
      details: ['จุดสีแดงเป็นพายุในชั้นบรรยากาศ ไม่ใช่หลุมหรือพื้นผิวแข็ง',
        'เลือกจุดนี้เพื่อเน้นบริเวณพายุ และหมุนหรือซูมเพื่อเปลี่ยนมุมชมได้'],
      illustrationNote: 'จุดนี้ตรงกับ Great Red Spot ในแผนที่ภาพที่ผู้สร้างปรับแต่ง เส้นขอบใช้เน้นการเลือก ไม่ใช่ขอบเขตพายุที่วัดจริงหรือพิกัดปัจจุบัน',
    },
  ],
}

export const saturn: Planet = {
  id: 'saturn', name: 'Saturn', thaiName: 'ดาวเสาร์',
  summary: 'ดาวเคราะห์ลำดับที่หกจากดวงอาทิตย์ เป็นดาวแก๊สขนาดใหญ่ที่มีวงแหวนเด่นชัด',
  scene: { center: [22, 12, -247], radius: 5, color: '#d9c395' },
  rings: { inner: 6.5, outer: 11.5, tilt: 0.35 },
  // Orbit outside the whole ring envelope, even when rotating to the far side.
  orbit: { yaw: 0.55, pitch: 0.5, distance: 26, min: 14, max: 36 },
  source: { title: 'NASA — Saturn Facts', url: 'https://science.nasa.gov/saturn/facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'saturn-rings', title: 'ชมวงแหวน', kind: 'rings',
      anchor: { yaw: 0.9, pitch: Math.atan(Math.tan(0.35) * Math.sin(0.9)), height: 4 },
      view: { yaw: 0.55, pitch: 0.85 }, focusDistance: 26,
      summary: 'วงแหวนของ Saturn ประกอบด้วยชิ้นน้ำแข็งและหินจำนวนมหาศาล',
      details: ['อนุภาคในวงแหวนมีหลายขนาดและโคจรรอบดาว',
        'ช่อง Cassini Division แยกวงแหวนหลัก A กับ B; มุมนี้เผยระนาบและช่องว่างของวงแหวน'],
      illustrationNote: 'ฉากใช้แถบวงแหวนและช่องว่างเพื่ออธิบาย ขนาด ความเอียง และความโปร่งไม่ใช่มาตราส่วนจริง',
    },
    {
      id: 'saturn-body', title: 'ชมตัวดาว', kind: 'body',
      anchor: saturnBodyAnchor, focusDistance: 16,
      summary: 'Saturn เป็นดาวแก๊สที่มีไฮโดรเจนและฮีเลียมเป็นองค์ประกอบหลัก',
      details: ['ดาวไม่มีพื้นผิวแข็งให้ยานลงจอดได้',
        'เลือกมุมนี้เพื่อชมตัวดาวใกล้ขึ้น แล้วเลือก “ชมวงแหวน” เพื่อกลับไปเห็นระบบวงแหวนกว้างขึ้น'],
      illustrationNote: 'จุดชมตัวดาวยึดแถบเมฆในแผนที่ภาพที่ผู้สร้างปรับแต่ง เส้นสีฟ้าแสดงการเลือก ข้อมูลนี้อธิบายทั้งดาว ไม่ใช่พื้นผิวแข็งหรือสภาพอากาศปัจจุบัน',
    },
  ],
}

export const uranus: Planet = {
  id: 'uranus', name: 'Uranus', thaiName: 'ดาวยูเรนัส',
  summary: 'ดาวเคราะห์ลำดับที่เจ็ดจากดวงอาทิตย์ มีสีฟ้าอมเขียวและแกนหมุนเอียงจนคล้ายหมุนตะแคง',
  scene: { center: [-18, 14, -310], radius: 4.2, color: '#8bc8cc' },
  axisTilt: uranusAxisTilt,
  orbit: { yaw: 0.55, pitch: 0.2, distance: 13, min: 5.6, max: 21 },
  source: { title: 'NASA — Uranus Facts', url: 'https://science.nasa.gov/uranus/facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'uranus-axis', title: 'แนวแกนหมุน', kind: 'axis',
      anchor: { yaw: -0.6, pitch: 0.05, height: 0.1 }, focusDistance: 14,
      summary: 'แกนหมุนของ Uranus เอียงประมาณ 97.77° เมื่อเทียบกับแนวตั้งฉากของระนาบวงโคจร',
      details: ['เส้นสีฟ้าแสดงแนวแกนหมุน; เส้นสีเทาเป็นแนวอ้างอิงตั้งฉากกับระนาบวงโคจร',
        'ความเอียงมากทำให้ฤดูกาลของดาวแตกต่างจากดาวที่หมุนตั้งตรงอย่างชัดเจน'],
      illustrationNote: 'เส้นแสดงมุมเอียงเพื่ออธิบาย; ทิศทางในฉากและตำแหน่งจุดข้อมูลไม่ใช่พิกัดจริง',
    },
    {
      id: 'uranus-atmosphere', title: 'บรรยากาศสีฟ้าอมเขียว', kind: 'clouds',
      anchor: uranusAtmosphereAnchor, focusDistance: 10,
      summary: 'มีเทนในบรรยากาศดูดกลืนแสงสีแดง ทำให้ Uranus ดูเป็นสีฟ้าอมเขียว',
      details: ['บรรยากาศมีไฮโดรเจนและฮีเลียมเป็นหลัก รวมถึงมีเทนปริมาณเล็กน้อย',
        'Uranus เป็นดาวยักษ์น้ำแข็งและไม่มีพื้นผิวแข็งให้ยานลงจอด'],
      illustrationNote: 'จุดนี้ยึดแถบจางในแผนที่ภาพที่ผู้สร้างปรับแต่งและเอียงตามแกนอธิบายของฉาก เส้นสีฟ้าแสดงการเลือก ข้อมูลนี้อธิบายบรรยากาศทั้งดาว ไม่ใช่พิกัดเมฆหรือสภาพอากาศปัจจุบัน',
    },
  ],
}

export const neptune: Planet = {
  id: 'neptune', name: 'Neptune', thaiName: 'ดาวเนปจูน',
  summary: 'ดาวเคราะห์ลำดับที่แปดและไกลที่สุดจากดวงอาทิตย์ เป็นดาวยักษ์น้ำแข็งที่มีลมแรง',
  scene: { center: [18, 15, -380], radius: 4, color: '#5f92c4' },
  orbit: { yaw: 0.55, pitch: 0.2, distance: 13, min: 5.4, max: 32 },
  source: { title: 'NASA — Neptune Facts', url: 'https://science.nasa.gov/neptune/neptune-facts/', verified: '2026-10-06' },
  hotspots: [
    {
      id: 'neptune-atmosphere', title: 'ชมบรรยากาศใกล้', kind: 'clouds',
      anchor: neptuneAtmosphereAnchor, focusDistance: 10,
      summary: 'Neptune มีบรรยากาศไฮโดรเจน ฮีเลียม และมีเทน พร้อมกระแสลมรุนแรง',
      details: ['บรรยากาศลึกลงไปค่อย ๆ รวมกับของไหลภายใน โดยไม่มีพื้นผิวแข็ง',
        'ภาพ Voyager บางชุดเคยปรับสีให้เมฆเด่นขึ้น; สีดาวจริงคล้าย Uranus มากกว่าภาพสีน้ำเงินเข้มที่คุ้นเคย'],
      illustrationNote: 'จุดนี้ยึดแถบสว่างในแผนที่ภาพที่ผู้สร้างปรับสีและเติมส่วนขาด เส้นสีฟ้าแสดงการเลือก ข้อมูลนี้อธิบายบรรยากาศทั้งดาว ไม่ใช่ชื่อพายุ พิกัดเมฆปัจจุบัน หรือการจำลองสีจริงอย่างแม่นยำ',
    },
    {
      id: 'neptune-route', title: 'เทียบเส้นทางที่เดินทางมา', kind: 'route',
      anchor: { yaw: 1, pitch: 0.5, height: 0.15 },
      view: { yaw: -0.3, pitch: 0.25 }, focusDistance: 26,
      summary: 'Neptune เป็นจุดแวะดาวเคราะห์สุดท้ายของการเดินทางนี้',
      details: ['มุมกว้างแสดง Neptune คู่กับภาพย่อเส้นทางจาก Earth ผ่านดาวทั้งเจ็ด',
        'เลือก “ชมบรรยากาศใกล้” เพื่อกลับไปชมดาว โดยการเดินทางยังพักที่ตำแหน่งเดิม'],
      illustrationNote: 'ภาพย่อมาจากเส้นทางในเว็บไซต์ ไม่ใช่วงโคจรหรือระยะห่างจริงของระบบสุริยะ',
    },
  ],
}

export const journeyPlanets: readonly Planet[] = [...innerPlanets, jupiter, saturn, uranus, neptune]
