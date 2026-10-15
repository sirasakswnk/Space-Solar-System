# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S09l — ดาวพื้นหลังครอบคลุมทั้งเส้นทาง และตรวจแสงตลอดเส้นทาง
- Status: complete
- Completed: S00–S04; S05a/S05b (S05 ครบ); S06; S07; S08; S09a–S09l; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 เหลือกล้องเบนตามเมาส์และยานเอียงในโค้ง; ยังไม่เริ่ม S10–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s09l-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## สิ่งที่ทำใน S09l
- ภาพก่อนแก้ (s09l-before-grid.png): ตั้งแต่ Mars ถึง Neptune ไม่มีดาวพื้นหลัง เพราะดาวเดิมอยู่ช่วง z −120..15
- src/scene/starField.ts: สร้างดาว 1,200 จุดแบบคงที่ กระจายสม่ำเสมอบนทรงกลมรัศมี 800 (< far 1000)
- src/scene/JourneyScene.tsx: ใช้ starField; ย้ายกลุ่มดาวตามตำแหน่งกล้องทุกเฟรมหลัง rig เขียนกล้อง (อ่านกล้องเท่านั้น)
- วัสดุดาว: ขนาด 2px ไม่ลดตามระยะ, fog ปิด, opacity ยังใช้ spaceBlend เดิม (ฐานปล่อยไม่มีดาว)
- tests/star-field.test.mjs: ตรวจรัศมี < far plane, ครอบคลุมทั้ง 8 ทิศ, ผลคงที่
- ตรวจแสง: ทุกจุดแวะแสงมาจากขวาบนสม่ำเสมอ ยาน/ดาวอ่านชัด จึงไม่แก้ไฟ
- README.md: บรรทัดสถานะ S09l

## ผลตรวจจริง (2026-10-15)
- s09l-tests.txt: npm test ผ่าน 48/48 (เพิ่ม 2), exit 0
- s09l-build.txt: typecheck + build ผ่าน exit 0; chunk 1,319.90 kB / gzip 374.14 kB
- s09l-shots.mjs: ภาพ 13 จุด (ฐาน→Neptune→ภาพรวม) ก่อน/หลัง; ไม่มี console/page error
- s09l-after-grid.png: มีดาวทุกช่วงหลังออกจากบรรยากาศ; s09l-after-detail.png: ดาวถูกดาวเคราะห์บังถูกต้อง, มีดาวในโหมดสำรวจ
- s09l-browser-check.mjs + s09l-browser-results.txt: ดาวตามกล้องและ opacity 1 ที่ Mars–Neptune/ภาพรวม/สำรวจ
- เดินหน้า/ย้อน 5 จุดแวะ pose เดิม; กลับฐาน pose เดิมและดาว opacity 0
- สำรวจ Neptune แล้ว Escape คืน pose/scroll และ focus explore-planet; geometry ดาวไม่สร้างใหม่; errors=[]
- ยังไม่ได้ตรวจบน GPU จริงหรือ Chrome/Edge บน Windows

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- กล้องเบนตามเมาส์ระหว่างเดินทาง (plan ข้อ 2, 13); ต้องผ่าน rig เดียวใน JourneyScene → S09m
- ยานเอียงตัวเล็กน้อยในโค้ง (plan ข้อ 5) → S09n
- ตั้งค่าคุณภาพภาพมาตรฐาน/เบา (plan ข้อ 8, 13) → S10 ร่วมกับลด motion
- Loading/retry UI, reduced motion, keyboard และ WebGL fallback ครบชุด → S10
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S09m — กล้องเบนตามเมาส์เล็กน้อยระหว่างเดินทาง โดยไม่เปลี่ยนเส้นทางยาน
- เกณฑ์ S09m: offset เล็กและนุ่ม; ปิดในโหมดสำรวจ/เปลี่ยนมุม; ย้อน/หยุด/ภาพรวมไม่เพี้ยน; ship pose ไม่เปลี่ยน; tests/build/browser ผ่าน
