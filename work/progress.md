# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S10c — สถานะโหลด texture จากงานจริง และปุ่มลองใหม่
- Status: complete
- Completed: S00–S04; S05a/S05b; S06; S07; S08; S09a–S09n; S10a–S10c; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 รอผู้ใช้ทบทวนภาพรวม; S10 เหลือ S10d; ยังไม่เริ่ม S11–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S10c: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s10c-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10b (สรุป; หลักฐาน s09l-* ถึง s10b-*)
- S09l ดาวรอบกล้อง; S09m เบนตามเมาส์; S09n ยานเอียงเข้าโค้ง; S10a reduced motion ตัดภาพ + fade
- S10b แผง “ตั้งค่า” ข้างเมนู: ลดการเคลื่อนไหว (ค่าเริ่มตามระบบ) + คุณภาพ เบา = dpr ×0.75; คงค่าหลังเริ่มใหม่

## สิ่งที่ทำใน S10c
- src/journey/assetStatus.ts: store 9 ไฟล์ (Earth ผิว/เมฆ + 7 ดาว) สถานะ loading/loaded/failed, attempts ต่อไฟล์, subscribe
- assetMessage: “กำลังโหลดภาพดาว x/9 ไฟล์” นับจากไฟล์ที่เสร็จจริง; ล้มเหลวบอกชื่อ + retry; ครบแล้วซ่อน
- src/journey/useAssetStatus.ts: useSyncExternalStore; loader รันใหม่เฉพาะเมื่อ attempt ของไฟล์ตัวเองเพิ่ม
- Mercury/Mars/Jupiter/Saturn/Uranus/Neptune/Venus: รายงานสถานะเข้า store; สีสำรองและ cleanup เดิม
- EarthScene.tsx: แยกผิว/เมฆเป็นสอง effect เพื่อ retry ไฟล์เดียวไม่โหลดอีกไฟล์ซ้ำ
- src/AssetStatusLine.tsx ใต้แถบความคืบหน้า: role=status; ปุ่ม “ลองโหลดใหม่” ย้าย focus ไปที่ข้อความก่อนปุ่มหาย
- styles.css: แก้ .journey-meter span → label span (ไม่ให้ข้อความลอยขวา); พื้นเข้มให้อ่านได้บนฟ้าสีฟ้าตอนปล่อยยาน
- tests/asset-status.test.mjs: นับจริงไม่มี %, ชื่อไฟล์ล้มเหลว, retry เฉพาะไฟล์ล้มเหลว/แจ้ง subscriber ครั้งเดียว

## ผลตรวจจริง S10c (2026-10-16)
- s10c-tests.txt: npm test ผ่าน 63/63 (เพิ่ม 3); s10c-build.txt: ผ่าน exit 0, chunk 1,326.16 kB / gzip 376.13 kB
- s10c-browser-check.mjs + results (Playwright route หน่วง/บล็อก request): ทุกข้อผ่าน, errors=[] (ไม่นับ resource error ของไฟล์ที่ตั้งใจบล็อก)
- โหลดปกติ: เห็นตัวนับ 0/9 → 8/9 แล้วซ่อน; สถานะทั้ง 9 loaded
- บล็อก Mars + เมฆ Earth: ข้อความ “โหลดภาพไม่สำเร็จ: เมฆ Earth, Mars — แสดงสีสำรองแทน” + ปุ่ม; Mars สีสำรอง; สำรวจ Mars เข้า/ออกปกติ
- ปลดบล็อกแล้วกด Enter ที่ปุ่ม: focus อยู่ที่ข้อความ; request ใหม่เฉพาะ clouds.jpg และ mars/surface.jpg อย่างละ 1; โหลดครบ ข้อความซ่อน
- ภาพ s10c-grid.png: ข้อความอ่านได้บนฟ้า, Mars สีสำรอง → แผนที่จริงหลังลองใหม่

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- S10d ทบทวน keyboard ทั้งหน้า + WebGL fallback ที่มีเนื้อหา (ตอนนี้ถ้าไม่มี WebGL ข้อความโหลดจะค้าง “0/9”)
- ข้อความโหลดล้มเหลวสูงถึง y≈280 ถูกแผงภาพรวม (top 192) บังที่ท้ายเส้นทาง → ปรับใน S10d หรือ S12
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S10d — ทบทวน keyboard ทั้งหน้า และหน้าสำรองเมื่อไม่มี WebGL (ภาพสำรอง รายชื่อดาว เนื้อหาอ่านได้)
- เกณฑ์ S10d: ใช้ได้ด้วยคีย์บอร์ดล้วนครบเส้นทาง/สำรวจ/ภาพรวม, focus มองเห็นไม่ถูกบัง; ปิด WebGL แล้วเห็นเนื้อหาดาวทั้งเจ็ด; tests/build/browser ผ่าน
