# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S09n — ยานเอียงตัวเล็กน้อยในโค้ง
- Status: complete
- Completed: S00–S04; S05a/S05b (S05 ครบ); S06; S07; S08; S09a–S09n; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; งานที่ระบุใน S09 ครบแล้ว รอผู้ใช้ทบทวนภาพรวม S09; ยังไม่เริ่ม S10–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S09n: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s09n-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09m (สรุป)
- src/journey/pointerLook.ts: กล้องเดินทางหมุนตามเมาส์ yaw ≤ 0.03 / pitch ≤ 0.02 rad หลัง lookAt ใน rig เดิม
- ค่าเบนหยุดค้างนอก phase travel; pointerout/blur คืนกึ่งกลาง; หลักฐาน s09m-* (tests 51, build, browser ผ่าน)

## สิ่งที่ทำใน S09n
- src/journey/bank.ts: sampleBank(progress) จากอัตราเปลี่ยนทิศแนวราบ (central difference ±0.002) → −0.2·tanh(rate/60)
- ปิดช่วงปล่อยยาน (เปิดค่อย ๆ ที่ launch local 0.45–0.6) และลดตามความชันของเส้นทาง
- src/scene/JourneyScene.tsx: หมุนยานรอบแกน tangent หลัง setFromUnitVectors; ตำแหน่งยาน/กล้องไม่เปลี่ยน
- tests/bank.test.mjs: launch ตั้งตรง, จุดแวะ < 0.05 rad, ไม่เกิน 0.2 และเปลี่ยนต่อ 1.2px < 0.01 rad, เอียงเข้าด้านในโค้ง
- จุดแวะไม่ได้ 0 พอดี (วัดได้ 0.002–0.042 rad) เพราะช่วงสุ่มคร่อมจุดแวะ และ Neptune อยู่ก่อนปลายช่วง; ปรับ test ให้ตรงค่าจริง
- README.md: บรรทัดสถานะ S09n

## ผลตรวจจริง S09n (2026-10-15)
- s09n-tests.txt: npm test ผ่าน 54/54 (เพิ่ม 3), exit 0
- s09n-build.txt: typecheck + build ผ่าน exit 0; chunk 1,321.23 kB / gzip 374.64 kB
- s09n-browser-check.mjs + s09n-browser-results.txt: ทุกข้อ true, errors=[]
- ช่วงปล่อยยาน 4 จุด ทิศยานเท่าแบบไม่เอียง; จุดเอียงสูงสุด 6 ช่วงตรงค่าที่คำนวณ (0.16–0.196 rad)
- เดินหน้า/ย้อน 6 จุด pose เดิม; สำรวจ Mars แล้ว Escape คืน pose และ focus explore-planet
- s09n-grid.png: เห็นยานเอียงตามโค้งเล็กน้อย; ยังไม่ได้ตรวจบน GPU จริง/Windows

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ตั้งค่าคุณภาพภาพมาตรฐาน/เบา (plan ข้อ 8, 13) → S10 ร่วมกับลด motion
- Loading/retry UI, reduced motion (รวมลด/ปิดการเบนตามเมาส์), keyboard และ WebGL fallback ครบชุด → S10
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: ผู้ใช้ทบทวนภาพรวม S09 (ภาพ/การเคลื่อนไหว) แล้วเริ่ม S10a — ลด motion ตาม prefers-reduced-motion (รวมปิดการเบนตามเมาส์)
- เกณฑ์ S10a: เมื่อเปิดลด motion กล้องนิ่งขึ้น ไม่มีการเบนตามเมาส์ เปลี่ยนฉากนุ่ม เนื้อหา/จุดหมายครบ; tests/build/browser ผ่าน
