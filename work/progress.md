# BEYOND — checkpoint

- วันที่ตรวจ: 2026-10-15
- Current step: S10d-2 — ทบทวนคีย์บอร์ดทั้งหน้า (S10 ครบ: a–d)
- Status: complete
- Completed: S00–S04; S05a/S05b; S06; S07; S08; S09a–S09n; S10a–S10d; D01 (ปรับ checkpoint)
- S11: skipped — ผู้ใช้สั่งข้ามการวัดประสิทธิภาพบนเครื่อง (2026-10-16); ไม่มีผล FPS บนเครื่องอ้างอิง
- เว็บไซต์โดยรวม: in-progress; S09 รอผู้ใช้ทบทวนภาพรวม; ยังไม่เริ่ม S12

## ข้อกำหนดและสภาพแวดล้อม
- Root: /home/user/Space-Solar-System (git, branch claude/nifty-meitner-dwndw1); ใช้ AGENTS.md และ plan.md ที่ราก
- Desktop เท่านั้น ไม่มีเสียง/backend/mobile/deployment; ข้อกำหนดคงเดิม
- Linux, Node.js v22.22.0 / npm 10.9.4; tests import .ts โดยตรง ต้องใช้ Node ≥ 22.18
- S00–S09k ทำบน Windows (Node v24.20.0, npm.cmd); หลักฐานเดิมอ้างอิงเครื่องนั้น
- Browser ตรวจ S09l–S10d: playwright-core 1.56.1 ติดตั้งนอกโปรเจกต์ + Chromium /opt/pw-browsers (SwiftShader), 1280×720
- ไม่เพิ่ม dependency ในโปรเจกต์; รักษาไฟล์ว่าง ({id ที่รากไว้จนกว่าผู้ใช้ตัดสิน
- หลักฐาน work/verification/s02-* ถึง s10d2-*; ไฟล์ .png ถูก gitignore
- เส้นทาง 24,000px; บิน 0–94%; ภาพรวม 94–100%; path/camera/fade/ข้อมูลดาวคงเดิม

## S09l (สรุป)
- src/scene/starField.ts: ดาว 1,200 จุดบนทรงกลมรัศมี 800 เลื่อนตามกล้อง; มีดาวทุกช่วงหลังออกจากบรรยากาศ
- ตรวจแสงทุกจุดแวะแล้วสม่ำเสมอ ไม่แก้ไฟ; หลักฐาน s09l-* (tests 48 ผ่าน, build, browser passed)

## S09l–S10d-1 (สรุป; หลักฐาน s09l-* ถึง s10d1-*)
- S09l ดาวรอบกล้อง; S09m เบนตามเมาส์; S09n ยานเอียงเข้าโค้ง; S10a reduced motion ตัดภาพ + fade
- S10b แผงตั้งค่า (ลดการเคลื่อนไหว/คุณภาพเบา dpr ×0.75); S10c สถานะโหลด x/9 + ลองใหม่
- S10d-1 ไม่มี WebGL → FallbackPage (ตรวจก่อน + SceneBoundary) แทนจอว่าง

## สิ่งที่ทำใน S10d-2
- s10d2-audit.mjs: ไล่ Tab ทุกจุดที่ฐาน, Mars, เมนูเปิดทั้งสอง, dialog สำรวจ, ภาพรวม, ภาพรวมขณะโหลดล้มเหลว; ตรวจกรอบ focus + hit-test
- พบปัญหาจริง 1 ข้อ: ภาพรวมขณะโหลดล้มเหลว ปุ่ม “ลองโหลดใหม่” (bottom 275) ถูก .overview-panel (top 192) บัง
- แก้: App.tsx ResizeObserver บน .journey-meter ตั้ง --meter-bottom; .overview-panel top = max(192px, meter + 16px)
- ปกติ meter จบ y≈179 แผงจึงอยู่ 195 (เดิม 192, ต่าง 3px) ทั้ง 1280×720/1440×900/1920×1080
- ไม่ใช่ปัญหา: ลิงก์ CC BY ขึ้นสองบรรทัด (hit-test เดิมผิด → ใช้ line box แรก), ลำดับ Tab ใน dialog ตรงลำดับภาพ
- ไม่ใช่ปัญหา: กด End ทันทีหลังออกสำรวจ ยัง sync เพราะ smooth scroll ยาวกว่า cooldown 180ms (s10d2-end-after-exit-probe.mjs)
- ไม่ใช่ปัญหา: h1 หลังเริ่มใหม่ hit-test ว่าถูกบังเพราะ .intro pointer-events none; ภาพยืนยันกรอบ focus ชัด

## ผลตรวจจริง S10d-2 (2026-10-16)
- s10d2-tests.txt: npm test ผ่าน 65/65; s10d2-build.txt: ผ่าน exit 0, chunk 1,331.11 kB / gzip 377.11 kB
- s10d2-audit-results.txt (หลังแก้): ไม่มีจุดที่กรอบ focus หายหรือถูกบัง (“BODY” = focus ออกนอกหน้า)
- s10d2-browser-check.mjs + results: ภาพรวมล้มเหลว status bottom 281 / แผง top 297, ปุ่มลองใหม่และเริ่มใหม่ไม่ถูกบัง
- คีย์บอร์ดล้วน: Tab→เมนู→Mars→Enter (progress 0.3948, focus กลับเมนู)→สำรวจ→dialog focus ปุ่มกลับ→จุดข้อมูล 2→หมุนขวา→Escape (focus ปุ่มสำรวจ)→End (ภาพรวม)→เริ่มใหม่ (progress 0, focus BEYOND); errors=[]
- ข้อสังเกต: เลื่อนออกจากดาวขณะ focus อยู่ที่ปุ่มสำรวจ ปุ่มซ่อนและ focus กลับไปเริ่มที่ต้นหน้า (พฤติกรรมเบราว์เซอร์ปกติ)

## งานค้างจากแผนที่ยังไม่มีในโค้ด
- ข้าม S11 ตามผู้ใช้: ไม่วัด FPS บนเครื่องอ้างอิง; bundle 1.33 MB และ hotspot projection ทุกเฟรมทั้ง 7 ดวง ยังไม่ได้แก้ (ทำได้เมื่อผู้ใช้สั่ง)
- S12 ต้องรายงานเกณฑ์ “ผลประสิทธิภาพ” ตามจริงว่าไม่ได้วัดบนเครื่องอ้างอิง (มีเพียงแนวโน้ม SwiftShader ใน s10b)
- README รวมเป็นย่อหน้าเดียวและปนบันทึกขั้นงาน; package.json ไม่มี engines → รอผู้ใช้สั่ง

## ขั้นถัดไป
- Run: npm ci; npm run dev (http://127.0.0.1:5173); checks: npm test, npm run build
- Next: S12 — ตรวจรวมทั้งเว็บตามเกณฑ์ตรวจรับ plan ข้อ 13 และส่งมอบพร้อมผลจริง
- เกณฑ์ S12: ไล่ทุกข้อในเกณฑ์ตรวจรับพร้อมหลักฐาน, ระบุข้อที่ไม่ผ่าน/ไม่ได้ทดสอบตามจริง (รวม FPS และ GPU/Windows), tests/build ผ่าน
