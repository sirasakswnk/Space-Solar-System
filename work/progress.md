# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S10d-1 — หน้าสำรองเมื่อไม่มี WebGL (S10d แบ่งเป็น d-1 fallback / d-2 keyboard)
- Status: complete
- Completed: S00–S04; S05a/S05b; S06; S07; S08; S09a–S09n; S10a–S10c; S10d-1; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 รอผู้ใช้ทบทวนภาพรวม; S10 เหลือ S10d-2; ยังไม่เริ่ม S11–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S10d-1: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s10d1-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10c (สรุป; หลักฐาน s09l-* ถึง s10c-*)
- S09l ดาวรอบกล้อง; S09m เบนตามเมาส์; S09n ยานเอียงเข้าโค้ง; S10a reduced motion ตัดภาพ + fade
- S10b แผง “ตั้งค่า”: ลดการเคลื่อนไหว + คุณภาพ เบา = dpr ×0.75; S10c สถานะโหลด x/9 + ลองใหม่เฉพาะไฟล์ล้มเหลว

## สิ่งที่ทำใน S10d-1
- ก่อนแก้ (s10d1-before-nowebgl.mjs): ไม่มี WebGL → R3F throw จาก <Canvas> → React unmount ทั้งแอป จอว่าง (root ว่าง)
- prop fallback ของ Canvas แสดงเฉพาะเบราว์เซอร์ที่ไม่มี <canvas> จึงไม่ช่วยกรณีนี้
- src/journey/webgl.ts: detectWebGL (webgl2 หรือ webgl; ข้อผิดพลาด = ไม่มี); App เลือก FallbackPage ก่อน mount ฉาก
- src/SceneBoundary.tsx: error boundary รอบ Canvas; context ล้มเหลวภายหลัง → สลับเป็นหน้าสำรอง
- src/FallbackPage.tsx: คำอธิบายสาเหตุ/วิธีแก้, ลิงก์จุดหมาย, ข้อความไม่ใช่มาตราส่วนจริง, Earth + 7 ดาว (สรุป, จุดข้อมูลทั้ง 14 รายละเอียด/หมายเหตุ, แหล่ง NASA), เครดิตภาพ
- src/data/planetImages.ts: ใช้แผนที่ภาพเดิมในเครื่องเป็นภาพนิ่ง พร้อม alt; loading=lazy
- ไม่แสดงแถบสถานะโหลด/ตั้งค่า/เมนู scroll ในหน้าสำรอง จึงไม่ค้าง “0/9”
- tests/fallback.test.mjs: detectWebGL 5 กรณี; ทุกดาวมีภาพ/alt และไฟล์อยู่ใน public

## ผลตรวจจริง S10d-1 (2026-10-16)
- s10d1-tests.txt: npm test ผ่าน 65/65 (เพิ่ม 2); s10d1-build.txt: ผ่าน exit 0, chunk 1,330.85 kB / gzip 377.02 kB
- s10d1-browser-check.mjs + results (จำลองด้วยการ override getContext):
- ไม่มี WebGL: หน้าสำรองครบ 8 หัวข้อ, 14 จุดข้อมูล, 7 ลิงก์ NASA, ภาพ 8 ไฟล์ decode ได้; Tab 3 ครั้งถึงลิงก์ Mars focus มองเห็น, Enter ไปหัวข้อ; errors=[]
- ตรวจผ่านแต่ฉากล้มเหลว: boundary สลับเป็นหน้าสำรองเดียวกัน; console มี error ของ THREE/React ที่คาดไว้จากการล้มเหลวนั้น
- มี WebGL: เส้นทางทำงานตามเดิม ไม่มีหน้าสำรอง; errors=[]
- ข้อสังเกต: ข้อความจุดข้อมูลบางข้อพูดถึงการโต้ตอบ 3D (เช่น Saturn “เลือก ชมวงแหวน”) ซึ่งไม่มีในหน้าสำรอง

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- S10d-2 ทบทวน keyboard ทั้งหน้า (focus มองเห็นและไม่ถูกบัง)
- ข้อความโหลดล้มเหลวสูงถึง y≈280 ถูกแผงภาพรวม (top 192) บังที่ท้ายเส้นทาง → ปรับใน S10d-2
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S10d-2 — ทบทวนการใช้คีย์บอร์ดทั้งหน้า และแก้ข้อความโหลดล้มเหลวที่ถูกแผงภาพรวมบัง
- เกณฑ์ S10d-2: คีย์บอร์ดล้วนครบ เดินทาง/เมนู/ตั้งค่า/สำรวจ/ภาพรวม/เริ่มใหม่; ลำดับ focus สมเหตุผล; focus มองเห็นและไม่ถูกบัง; tests/build/browser ผ่าน
