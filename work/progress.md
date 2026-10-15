# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S09m — กล้องเบนตามเมาส์เล็กน้อยระหว่างเดินทาง
- Status: complete
- Completed: S00–S04; S05a/S05b (S05 ครบ); S06; S07; S08; S09a–S09m; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 เหลือยานเอียงในโค้ง (S09n); ยังไม่เริ่ม S10–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l/S09m: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s09m-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## สิ่งที่ทำใน S09m
- src/journey/pointerLook.ts: แปลงตำแหน่งเมาส์เป็น −1..1, ease แบบไม่ขึ้นกับ frame rate (จำกัด delta 0.05), หมุนกล้อง yaw ≤ 0.03 / pitch ≤ 0.02 rad
- src/scene/JourneyScene.tsx: ฟัง pointermove/pointerout/blur บน window; rig เดินทางเดิมเป็นผู้หมุนหลัง lookAt (ไม่มีผู้เขียนกล้องใหม่)
- ค่าเบน ease เฉพาะ phase travel จึงหยุดค้างระหว่างเข้า/สำรวจ/ออก แล้วค่อยตามเมาส์ต่อ
- src/App.tsx: เพิ่ม pointerLook ใน journeySnapshot (DEV เท่านั้น)
- tests/pointer-look.test.mjs: ช่วงค่า, การ ease/จำกัดเฟรมยาว, หมุนอย่างเดียวและทิศถูก
- README.md: บรรทัดสถานะ S09m

## ผลตรวจจริง S09m (2026-10-15)
- s09m-tests.txt: npm test ผ่าน 51/51 (เพิ่ม 3), exit 0
- s09m-build.txt: typecheck + build ผ่าน exit 0; chunk 1,320.82 kB / gzip 374.46 kB
- s09m-browser-check.mjs + s09m-browser-results.txt: ทุกข้อ true, errors=[]
- ที่ Jupiter เมาส์มุมขวาบน: กล้องหมุน 0.036 rad (≤ ขีดจำกัด) ตำแหน่งกล้อง/ยาน/ทิศยานไม่เปลี่ยน; หยุดแล้วไม่ไหล
- ถือเมาส์ค้าง เดินหน้า/ย้อน Mars–Neptune pose เดิม; pointerout ออกนอกหน้าต่างคืนกึ่งกลางเท่า pose ไม่เบน
- เปิดสำรวจ Neptune ด้วยคีย์บอร์ด ลากในฉาก: ค่าเบนคงที่; Escape แล้วกล้องต่อเนื่อง (ต่างจากก่อนเปิด 5e-8 rad), scroll/focus เดิม
- วางเมาส์ที่เดิมแล้ว pose เท่าก่อนเปิดสำรวจ; ภาพรวมป้ายชื่อตรงดาวขณะเบน (s09m-grid.png)
- รอบแรกข้อ frozenDuringExplore false เพราะสคริปต์ใช้ tolerance 0 กับ `<`; แก้สคริปต์ ไม่ใช่โค้ด แล้วรันใหม่ผ่าน
- ยังไม่ได้ตรวจบน GPU จริง/Windows; ลด parallax ตาม prefers-reduced-motion รอ S10

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ยานเอียงตัวเล็กน้อยในโค้ง (plan ข้อ 5) → S09n
- ตั้งค่าคุณภาพภาพมาตรฐาน/เบา (plan ข้อ 8, 13) → S10 ร่วมกับลด motion
- Loading/retry UI, reduced motion (รวมลด/ปิดการเบนตามเมาส์), keyboard และ WebGL fallback ครบชุด → S10
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S09n — ยานเอียงตัวเล็กน้อยในโค้งตามความโค้งของเส้นทาง
- เกณฑ์ S09n: เอียงนุ่ม ไม่กระตุกที่รอยต่อช่วง; คำนวณจาก progress จึงย้อนได้ภาพเดิม; ไม่เปลี่ยนตำแหน่งยาน/กล้อง; tests/build/browser ผ่าน
