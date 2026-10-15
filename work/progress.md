# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S10a — ลดการเคลื่อนไหวตาม prefers-reduced-motion
- Status: complete
- Completed: S00–S04; S05a/S05b; S06; S07; S08; S09a–S09n; S10a; D01 (ปรับ checkpoint)
- เว็บไซต์โดยรวม: in-progress; S09 รอผู้ใช้ทบทวนภาพรวม; S10 เหลือ S10b–S10d; ยังไม่เริ่ม S11–S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S10a: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s10a-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S09n (สรุป; หลักฐาน s09l-*/s09m-*/s09n-*)
- S09l starField.ts ดาวรอบกล้องทั้งเส้นทาง; S09m pointerLook.ts กล้องเบนตามเมาส์ ≤ 0.03/0.02 rad
- S09n bank.ts ยานเอียงเข้าโค้ง ≤ 0.2 rad จาก progress; launch ตั้งตรง, จุดแวะ < 0.05 rad

## สิ่งที่ทำใน S10a
- ไม่มีแอนิเมชันตามเวลาอื่นในโค้ด; สิ่งที่เคลื่อนเองมี 4 อย่าง: เบนตามเมาส์, กระโดดไกล, เข้า/ออกสำรวจ, เลือก hotspot
- src/journey/motion.ts: largeJump 0.05 (1,200px), fade 0.4s, shouldCut/fadeAfter
- src/journey/useReducedMotion.ts: อ่าน matchMedia และติดตามการเปลี่ยนขณะเปิดหน้า; App.tsx สร้าง motion object
- JourneyScene.tsx (rig เดิม): reduced → เบนกลับกึ่งกลาง; ช่องว่าง progress ≥ 0.05 ตัดทันที; transition/focus t=1; ตั้ง fade=1
- App.tsx/styles.css: .motion-fade ทับเฉพาะฉาก 3D, pointer-events none; UI/dialog อยู่บน; snapshot DEV มี motion
- tests/motion.test.mjs: เงื่อนไขตัดภาพ, ทุกคู่จุดหมาย/ฐาน/ภาพรวมเป็น largeJump, PageDown 650px ไม่ตัด, fade จบใน 0.4s
- รอบแรก test หนึ่งข้อล้มเพราะค่าทศนิยมใน input ของ test (0.3+0.05−0.3); แก้ test เป็นค่าขอบที่ตรง

## ผลตรวจจริง S10a (2026-10-15)
- s10a-tests.txt: npm test ผ่าน 57/57 (เพิ่ม 3); s10a-build.txt: ผ่าน exit 0, chunk 1,322.05 kB / gzip 374.93 kB
- s10a-browser-check.mjs + results (emulateMedia reduce/no-preference): ทุกข้อผ่าน, errors=[]
- reduce: เบน 0; เมนู Mercury→Neptune ไม่มีเฟรมระหว่างทาง, overlay จาง 1→0 ใน 8 เฟรม; เข้า/ออกสำรวจ 0 เฟรม transition; hotspot ไม่มีเฟรมระหว่างทาง
- reduce: scroll 650px ยัง ease ไม่มี fade; Escape คืน pose/focus; replay กลับ 0; เปลี่ยนค่าระบบขณะเปิดแล้วตามทันที
- no-preference: เบน ~0.99, เมนูบินผ่าน 9 เฟรม, เข้า 27/ออก 45 เฟรม, hotspot 24 เฟรม, fade 0 ตลอด (เท่าเดิม)
- สคริปต์ตรวจรอบแรกรอ scroll ไม่ครบ/เทียบ rotation ขณะเบน; แก้สคริปต์ ไม่ใช่โค้ด แล้วรันใหม่ผ่าน

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- S10b ปุ่มตั้งค่าบนหน้า (ลดการเคลื่อนไหว + คุณภาพภาพมาตรฐาน/เบา) คงค่าหลังเริ่มใหม่; S10c loading/retry; S10d keyboard/WebGL fallback
- Bundle ใหญ่, hotspot projection ทุกเฟรมทั้ง 7 ดวง, FPS เครื่องอ้างอิง → S11; ตรวจรวม → S12
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S10b — แผงตั้งค่าบนหน้า: ลดการเคลื่อนไหว (ค่าเริ่มจากระบบ) และคุณภาพภาพมาตรฐาน/เบา
- เกณฑ์ S10b: สลับได้ด้วยเมาส์/คีย์บอร์ด มีผลทันที, เริ่มใหม่ไม่ล้างค่า, โหมดเบาลด dpr/รายละเอียดจริง; tests/build/browser ผ่าน
