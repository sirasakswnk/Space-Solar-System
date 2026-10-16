# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S10b — แผงตั้งค่า: ลดการเคลื่อนไหว และคุณภาพภาพมาตรฐาน/เบา
- Status: complete
- Completed: S00–S04; S05a/S05b; S06; S07; S08; S09a–S09n; S10a–S10b; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 รอผู้ใช้ทบทวนภาพรวม; S10 เหลือ S10c–S10d; ยังไม่เริ่ม S11–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S10b: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s10b-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10a (สรุป; หลักฐาน s09l-* ถึง s10a-*)
- S09l starField.ts ดาวรอบกล้อง; S09m pointerLook.ts เบนตามเมาส์; S09n bank.ts ยานเอียงเข้าโค้ง
- S10a motion.ts: reduced → ไม่เบน, กระโดด ≥ 0.05/เข้าออกสำรวจ/hotspot ตัดภาพ + .motion-fade 0.4s

## สิ่งที่ทำใน S10b
- src/journey/useReducedMotion.ts: ค่าเริ่มจาก matchMedia; เมื่อผู้ใช้เลือกบนหน้า ค่านั้นชนะการเปลี่ยนของระบบ
- src/journey/quality.ts: มาตรฐาน dpr = clamp(devicePixelRatio, 1, 1.5) (เท่าเดิม); เบา = ×0.75 (~56% พิกเซล)
- ไม่มี post-processing/ระบบอนุภาคให้ลด จึงลดความละเอียดเรนเดอร์; R3F configure dpr ใหม่ทุก render จึงสลับได้ทันที
- src/SettingsControls.tsx: checkbox + radio แบบ native (คีย์บอร์ด/ผู้อ่านหน้าจอใช้ได้); state อยู่ใน App จึงเริ่มใหม่ไม่ล้าง
- App.tsx/styles.css: <details> “ตั้งค่า” แยก วางข้างเมนูจุดหมาย (left 360, top 170); snapshot DEV มี pixelRatio
- รอบแรกรวมไว้ในเมนูจุดหมาย → ที่ 1280×720 แผงสูงถึง y=594 บัง caption/ปุ่มสำรวจ; ลองวางใต้เมนู → เมนูเปิดบังปุ่มตั้งค่า
- จึงวางข้างกัน: เปิดพร้อมกันได้ ไม่ทับกัน และไม่ทับ caption/ภาพรวม
- tests/quality.test.mjs: ช่วง dpr มาตรฐาน, เบาลดพิกเซลทุกจอ, ค่า devicePixelRatio ผิดปกติ
- ค่าไม่ถูกบันทึกข้ามการปิดหน้า (แผนกำหนดเพียงคงค่าหลังเริ่มใหม่)

## ผลตรวจจริง S10b (2026-10-16)
- s10b-tests.txt: npm test ผ่าน 60/60 (เพิ่ม 3); s10b-build.txt: ผ่าน exit 0, chunk 1,323.28 kB / gzip 375.31 kB
- s10b-browser-check.mjs + results: ทุกข้อผ่าน, errors=[]
- ระบบ reduce → ติ๊กไว้; no-preference → ไม่ติ๊ก; คีย์บอร์ด Enter เปิดเมนู, Space สลับ, ลูกศรเลือก “เบา” มีผลทันที
- เลือกเองแล้วเปลี่ยนค่าระบบ ค่าที่เลือกคงอยู่; เบา: canvas 1265→948px, pixelRatio 0.75, progress/กล้อง/ยานไม่เปลี่ยน
- เบา: สำรวจ Mars แล้ว Escape คืน pose/focus; เริ่มใหม่ progress 0 แต่ค่าตั้งทั้งสองยังอยู่
- 1280×720: เมนูเปิดทั้งสองสิ้นสุด y=448/329 < caption 520, ไม่ทับกัน; ภาพรวมปุ่มตั้งค่าไม่ทับแผง/ป้ายชื่อ
- FPS (SwiftShader CPU บอกแนวโน้มเท่านั้น): เบา 21.7 / มาตรฐาน 16.8
- สคริปต์ตรวจมีพลาด 2 ครั้ง (ปิดเมนูก่อนคลิก, ลำดับ helper) แก้สคริปต์แล้วรันใหม่ผ่าน

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- S10c loading/retry ของ texture; S10d ทบทวน keyboard ทั้งหน้า + WebGL fallback ที่มีเนื้อหา
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S10c — สถานะโหลด texture จากงานจริง และปุ่มลองใหม่เมื่อโหลดไม่สำเร็จ (คงวัสดุสำรองและการนำทาง)
- เกณฑ์ S10c: ไม่แสดง % ที่แต่งขึ้น; จำลองโหลดล้มเหลวแล้วเห็นข้อความ + ลองใหม่ได้จริง; เดินทางต่อได้ระหว่างนั้น; tests/build/browser ผ่าน
