# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: D01 — ปรับ checkpoint ให้ตรงสภาพแวดล้อมจริงและบันทึกงานค้างจากแผน
- Status: complete (แก้เอกสารเท่านั้น ไม่แก้โค้ด)
- Completed: S00–S04; S05a/S05b (S05 ครบ); S06; S07; S08; S09a–S09k; D01
- เว็บไซต์โดยรวม: in-progress; S09 ยังไม่ครบ; ยังไม่เริ่ม S09l/S10–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git repo, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก; ไม่มี outputs/plan.md
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- ตรวจ 2026-10-15: Linux, Node.js v22.22.0 / npm 10.9.4; ใช้คำสั่ง npm ปกติ
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd, ไม่มี .git); หลักฐานเดิมอ้างอิงเครื่องนั้น
- tests import ไฟล์ .ts โดยตรง ต้องใช้ Node ที่รองรับ type stripping (≥ 22.18)
- รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s09k-*; ไฟล์ .png ถูก gitignore จึงไม่อยู่ใน repo
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## สรุปงานที่เสร็จ (หลักฐานใน work/verification)
- S01–S04: app shell, เส้นทาง scroll ไป/กลับ, ฉากปล่อยยาน, โหมดสำรวจต้นแบบ
- S05–S07: ข้อมูล/hotspot และฉากดาวทั้งเจ็ดพร้อมลูกเล่นเฉพาะดาว
- S08: เมนูจุดหมาย, ภาพรวมท้ายเส้นทาง, เริ่มใหม่
- S09a–S09k: ยาน/ฐาน, texture Earth และดาวทั้งเจ็ด, fade ดาว, ลายวงแหวน Saturn
- S09k ล่าสุด: tests 46 ผ่าน, build ผ่าน, browser native/fallback passed=true (บน Windows)

## สิ่งที่ทำใน D01
- work/progress.md: แทนรายละเอียดสภาพแวดล้อม Windows ด้วยสภาพจริง และย่อรายละเอียด S09k
- บันทึกข้อกำหนดในแผนที่ยังไม่มีในโค้ด (ด้านล่าง); plan.md/AGENTS.md/README/โค้ดไม่แก้

## ผลตรวจจริง (2026-10-15, Linux)
- npm ci ผ่าน (46 packages); npm test ผ่าน 46/46; npm run build ผ่าน exit 0
- Build เตือน chunk 1,319.69 kB / gzip 374.03 kB (ตรงกับ S09k)
- ยังไม่ได้เปิด browser ตรวจในสภาพแวดล้อมนี้
- D01: ตรวจเส้นทางไฟล์และข้อความเทียบกับโค้ด/แผนแล้ว

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ดาวพื้นหลัง 350 จุดอยู่ช่วง z −120..15 แต่เส้นทางถึง z −380; คำนวณได้ว่าตั้งแต่ Mars ไม่มีดาวด้านหน้ากล้อง (ยังไม่ยืนยันด้วยภาพ) → S09l
- กล้องเบนตามเมาส์ระหว่างเดินทาง (plan ข้อ 2, 13) ยังไม่มี; ต้องผ่าน rig เดียวใน JourneyScene → ขั้นเพิ่มใน S09
- ยานเอียงตัวเล็กน้อยในโค้ง (plan ข้อ 5) ยังไม่มี → ขั้นเพิ่มใน S09
- ตั้งค่าคุณภาพภาพมาตรฐาน/เบา (plan ข้อ 8, 13) ยังไม่มี → S10 ร่วมกับลด motion
- Loading/retry UI, reduced motion, keyboard และ WebGL fallback ครบชุด → S10
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S09l — ตรวจความสม่ำเสมอของแสงตลอดเส้นทาง แก้ดาวพื้นหลังให้ครอบคลุมทั้งเส้นทาง และปรับเฉพาะปัญหาที่พบ
- เกณฑ์ S09l: ยาน/ดาวอ่านชัดใน launch/travel/สำรวจทั้งเจ็ดดาว; มีดาวพื้นหลังทุกช่วง; ไม่มีแสงกะพริบ; ย้อน/เข้าออก/ภาพรวมถูกต้อง; build/browser ผ่าน
