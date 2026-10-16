# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S12a — ตรวจรวมตามเกณฑ์ตรวจรับ plan ข้อ 13 (S12 แบ่ง a ตรวจ+รายงาน / b README ส่งมอบ)
- Status: complete
- Completed: S00–S10 (S10a–S10d); S12a; D01 (ปรับ checkpoint)
- S11: skipped — ผู้ใช้สั่งข้ามการวัดประสิทธิภาพบนเครื่อง (2026-10-16)
- เว็บไซต์โดยรวม: in-progress — เกณฑ์ 19/20 ผ่านในสภาพแวดล้อมนี้, ข้อ 20 บันทึกตามจริงว่าไม่ได้วัด FPS; เหลือ S12b

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S12a: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s12-* (S12 ใน work/verification/s12/); ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10d (สรุป; หลักฐาน s09l-* ถึง s10d2-*)
- S09l–n ดาวรอบกล้อง/เบนตามเมาส์/ยานเอียงเข้าโค้ง; S10a reduced motion; S10b แผงตั้งค่า; S10c สถานะโหลด+ลองใหม่
- S10d-1 หน้าสำรองเมื่อไม่มี WebGL; S10d-2 ตรวจคีย์บอร์ดทั้งหน้า, แผงภาพรวมไม่บังปุ่มลองใหม่

## สิ่งที่ทำใน S12a
- รายงาน work/verification/s12-acceptance.md: เกณฑ์ 20 ข้อ พร้อมผล/หลักฐาน/สิ่งที่ไม่ได้ทดสอบ
- กลุ่มตรวจ s12a (ปล่อยยาน/หยุด/ย้อน/ลำดับ/เลือกจุดหมายเร็ว/ภาพรวม), s12b (สำรวจ+จุดข้อมูล 14 จุด), s12c (resize/3 ขนาดจอ), s12e (production preview)
- ตรวจซ้ำสคริปต์ S09l–S10d-2 ทั้งหมด (*-regression.json, audit-regression.txt)
- พบและแก้ 1 ข้อ: src/journey/useJourneyScroll.ts อ่าน scroll ใหม่เมื่อช่วงพัก 180ms หลังออกสำรวจจบ (เดิม scroll ทันทีในช่วงนั้นทำให้ยานไม่ตาม)

## ผลตรวจจริง S12a (2026-10-16)
- s12-tests.txt: npm test ผ่าน 65/65; s12-build.txt: build exit 0, chunk 1,331 kB / gzip 377 kB
- Chromium 141 headless/SwiftShader, Linux 4 คอร์ 15 GB; dev และ production preview
- ทุกกลุ่ม errors=[] และ request ล้มเหลว 0 (ยกเว้น error ที่ตั้งใจจำลองใน s10d1 “late”)
- ผลที่ไม่ผ่านครั้งแรกทั้งหมดมาจากสคริปต์ (การเบนตามเมาส์, รอ hotspot ไม่พอ, กรอบ <p> เต็มแถว, S09l ก่อนมี S09m) แก้สคริปต์แล้วผ่าน
- production: dev diagnostics ไม่อยู่ใน bundle; asset ทั้งหมดตอบ 200; เดินทาง/สำรวจ/ภาพรวม/เริ่มใหม่/หน้าสำรองทำงาน

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ไม่ได้ตรวจ: FPS เครื่องอ้างอิง, Windows/Chrome/Edge จริง, GPU จริง, ฟอนต์ Leelawadee UI จริง; bundle และ hotspot projection ยังไม่ปรับ
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S12b — จัด README สำหรับส่งมอบ (วิธีรัน, วิธีใช้, เครดิต, ลิงก์รายงานตรวจรับ) แยกบันทึกขั้นงานออก
- เกณฑ์ S12b: README อ่านเป็นหัวข้อชัด ไม่เป็นย่อหน้าเดียว ข้อมูลตรงกับโค้ดจริง; ตรวจลิงก์/คำสั่ง; ไม่แก้โค้ด
