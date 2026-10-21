# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: F01 — ดาวหมุนรอบตัวเองตามเวลา (ลูกเล่นเพิ่มตามคำขอผู้ใช้ 2026-10-21)
- Status: complete
- Completed: S00–S10; S12a; F01; D01 (ปรับ checkpoint). S11 skipped ตามผู้ใช้
- คิวลูกเล่นที่ผู้ใช้อนุมัติ: F01 ดาวหมุน ✓ → F02 แถบดาวเคราะห์น้อย Mars–Jupiter → F03 เส้นดาวยืดตามความเร็ว → F04 ฉากเปิดตัวดาว → F05 แถบความคืบหน้าแบบแผนที่ย่อ
- S12b (README ส่งมอบ) เลื่อนไปหลังคิวลูกเล่น; หลังเพิ่มฟีเจอร์ควรตรวจรวมซ้ำบางส่วน

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–F01: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s12-* (S12 ใน work/verification/s12/); ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10d (สรุป; หลักฐาน s09l-* ถึง s10d2-*)
- S09l–n ดาวรอบกล้อง/เบนตามเมาส์/ยานเอียงเข้าโค้ง; S10a reduced motion; S10b แผงตั้งค่า; S10c สถานะโหลด+ลองใหม่
- S10d-1 หน้าสำรองเมื่อไม่มี WebGL; S10d-2 ตรวจคีย์บอร์ดทั้งหน้า, แผงภาพรวมไม่บังปุ่มลองใหม่

## S12a (สรุป)
- รายงาน work/verification/s12-acceptance.md: เกณฑ์ 19/20 ผ่าน (ข้อ 20 ไม่ได้วัด FPS); แก้ resync scroll หลังช่วงพักออกสำรวจ

## สิ่งที่ทำใน F01
- เดิมฉากไม่มีอะไรเคลื่อนตามเวลาเลย ขัดแผนข้อ 2 (“หยุดเลื่อนแล้วการหมุนดาว…ยังทำงาน”)
- src/journey/spin.ts: ความเร็วหมุน rad/s (Jupiter 0.1 เร็วสุด, Venus −0.015 กลับทาง, Uranus หมุนรอบแกนเอียง 97.77°); meshSpin/worldSpin
- explore.spin.time เดินเฉพาะ phase travel และไม่ลดการเคลื่อนไหว (JourneyScene.tsx); หยุดค้างในโหมดสำรวจ
- PlanetScene/VenusClouds: หมุน mesh; Earth ไม่หมุนผิว (ฐานปล่อยอยู่บนผิว) แต่เมฆไหล 0.004 rad/s
- PlanetHotspots: เส้นเน้น/วงแหวนอยู่ใน group ที่หมุนด้วย worldSpin; ตำแหน่งปุ่มจุดข้อมูลคำนวณจากทิศที่หมุนแล้ว; เส้นแนวตั้งอ้างอิงของ Uranus ไม่หมุน
- explore.ts hotspotOrbit(planet, hotspot, spinTime): กล้องหันไปยังจุดที่หมุนไปแล้ว (spinTime 0 = ผลเดิม)
- tests/spin.test.mjs: ไม่มีการหมุนที่เวลา 0, ผิว texture กับจุดข้อมูลตรงกันทุกเวลา, แกน Uranus คงที่, กล้องหันหาจุดที่หมุนแล้ว

## ผลตรวจจริง F01 (2026-10-21)
- f01-tests.txt: npm test ผ่าน 69/69 (เพิ่ม 4); f01-build.txt: build exit 0, chunk 1,332 kB / gzip 378 kB
- f01-browser-check.mjs + results: ทุกข้อผ่าน, errors=[], request ล้มเหลว 0
- Jupiter หยุดเลื่อน: mesh หมุน 1.616 rad ตรงค่าคาด (เวลา spin 16.16s ใน 20s จริง เพราะเฟรมช้าจำกัด delta 0.05); ยาน/กล้องไม่ขยับ
- สำรวจหลังหมุน: spin หยุดค้าง, กล้องหัน Great Red Spot dot=1.0, เส้นเน้น+ปุ่มจุดข้อมูลอยู่บนจุดแดง (f01-grid.png)
- Uranus: แกนเอียงคงที่ เส้นอ้างอิงแนวตั้งตั้งตรง; เปิดลดการเคลื่อนไหวแล้ว spin และเมฆ Earth หยุด
- เมฆ Earth ไหล 0.0053 rad ใน 3 วินาทีที่ฐานปล่อย

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ไม่ได้ตรวจ: FPS เครื่องอ้างอิง, Windows/Chrome/Edge จริง, GPU จริง, ฟอนต์ Leelawadee UI จริง; bundle และ hotspot projection ยังไม่ปรับ
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: F02 — แถบดาวเคราะห์น้อยระหว่าง Mars กับ Jupiter (instanced, ผูกกับ progress, ลดจำนวนในโหมดเบา)
- เกณฑ์ F02: ยานบินผ่านโดยไม่บังดาว/ข้อความ; เดินหน้า/ย้อนได้ภาพเดิม; โหมดเบาจำนวนน้อยลง; ไม่มีในหน้าสำรอง; tests/build/browser ผ่าน
