## **CPE 334: Project Deliverable 1** 

**Engineering baseline and working Sprint 1** 

### **Topic 3: Event Registration and Attendance System** 

1. Kittithat Disthanakornkun 67070501004 

2. Thanatip Nitinantakul 67070501023 

**Repository URL:** 

**1. Part A: SRS and product scope** 

   - **1.1. A1 Stakeholder problem and product context** 

**Reg Me Up** เปนระบบลงทะเบียนเขารวมกิจกรรมอบรม และเวิรกช็อปภายในมหาวิทยาลัย ซึ่งแตละ กิจกรรมมีจำนวนที่นั่งจำกัด และมีวิทยากร หรือ ผูสอนที่ไดรับมอบหมาย ระบบรองรับผูใชงานหลัก 3 บทบาท ไดแก ผูจัดกิจกรรม (Organizer) ผูเขารวมกิจกรรม (Participant) และผูสอนหรือวิทยากร (Instructor) 

ปญหาที่ระบบมุงแกไขคือความยากในการติดตามขอมูลกิจกรรม จำนวนที่นั่ง และสถานะการลงทะเบียน เมื่อขอมูลเหลานี้ถูกจัดการแยกจากกัน ผูจัดตองทราบวามีผูลงทะเบียนกี่คน และยังเหลือที่นั่งหรือไม ผูเขารวมตอง คนหากิจกรรม และตรวจสอบผลการลงทะเบียนของตนได สวน Instructor ตองทราบวาตนไดรับมอบหมายใหสอน ในกิจกรรมใด รวมถึงวัน เวลา สถานที่ และรายละเอียดของกิจกรรมนั้น 

ระบบจึงรวบรวมการเผยแพรกิจกรรม การลงทะเบียน และขอมูลการมอบหมายผูสอนไวในระบบเดียว โดยบังคับกฎจำนวนที่นั่งและปองกันการลงทะเบียนซ้ำบนฝงเซิรฟเวอร พรอมจำกัดการเขาถึงขอมูลตามบทบาท และความเปนเจาของขอมูล เชน Participant ดูทะเบียนสวนตัวของตน Organizer จัดการกิจกรรมของตน และ Instructor ดูกิจกรรมที่ตนไดรับมอบหมาย 

ขอบเขตของผลิตภัณฑครอบคลุมการเผยแพร และจัดการกิจกรรม การลงทะเบียน และยกเลิกตามเงื่อนไข การมอบหมาย Instructor การบันทึกการเขารวม และการสรุปผลกิจกรรม โดย Sprint 1 เนนเสนทางหลักตั้งแตผู จัดเผยแพรกิจกรรม ผูเขารวมลงทะเบียน และเรียกดูผลที่บันทึกไว ไปจนถึงผูจัดตรวจสอบรายชื่อผูลงทะเบียน พรอมระบบยืนยันตัวตน และควบคุมสิทธิ์ สวนการมอบหมาย Instructor และการดูรายการกิจกรรมที่ตองสอนอยู ใน Sprint 2 

- **1.2. A2 Stakeholders and responsibilities** 

   - **1.2.1. Participant** 

Participant คือผูที่ตองการเขารวมกิจกรรมอบรม หรือ เวิรกช็อป สามารถดูรายการและราย ละเอียดกิจกรรม ลงทะเบียน ตรวจสอบทะเบียนของตน และยกเลิกตามเงื่อนไขที่ระบบกำหนด Participant ไมมีสิทธิ์เผยแพรหรือแกไขกิจกรรม มอบหมาย Instructor หรือเขาถึงขอมูลทะเบียนสวนตัว ของผูเขารวมคนอื่น 

### **1.2.2. Organizer** 

Organizer คือผูรับผิดชอบการจัดกิจกรรม สามารถเผยแพรและจัดการรายละเอียดกิจกรรม ของตน กำหนดจำนวนที่นั่งและเวลา ปดรับลงทะเบียน ดูรายชื่อผูลงทะเบียน มอบหมาย Instructor บันทึกการเขารวม และดูสรุปผลของกิจกรรมที่ตนเปนเจาของ การเปลี่ยนแปลงรายละเอียดหรือจำนวน ที่นั่งตองเปนไปตามกฎที่ทีมกำหนด และ Organizer ไมมีสิทธิ์จัดการกิจกรรมของผูจัดรายอื่นโดยอัตโนมัติ 

**1.2.3. Instructor** 

Instructor คือผูที่ไดรับมอบหมายจาก Organizer ใหสอนหรือดำเนินกิจกรรมอบรม สามารถดู รายการกิจกรรมที่ตนไดรับมอบหมายและรายละเอียดที่จำเปนตอการสอน ไดแก ชื่อกิจกรรม วัน เวลา สถานที่ และรายละเอียดเนื้อหา สำหรับขอบเขตเริ่มตน Instructor มีสิทธิ์ดูขอมูลดังกลาว แตไมมีสิทธิ์ เผยแพรหรือแกไขกิจกรรม เปลี่ยนจำนวนที่นั่ง มอบหมายผูสอน หรือเขาถึงขอมูลทะเบียนสวนตัวของผู เขารวม เวนแตทีมจะกำหนดสิทธิ์เพิ่มเติมไวอยางชัดเจน 

- **1.3. A3 Product scope and exclusions** 

   - **1.3.1. Overall Product Scope** 

Reg Me Up เปนระบบลงทะเบียนเขารวมกิจกรรมอบรมและเวิรกช็อป รองรับผูใชงานสาม บทบาท ไดแก Participant, Organizer และ Instructor โดยแตละบทบาทมีสิทธิ์เขาถึงขอมูลและดำเนิน การตามหนาที่ของตน ระบบครอบคลุมความสามารถดังตอไปนี้ 

   - 1.3.1.1. การยืนยันตัวตนและควบคุมสิทธิ์ ผูใชสามารถเขาสูระบบ ออกจากระบบ และตรวจ สอบตัวตนปจจุบันได ระบบตรวจสอบสิทธิ์ตามบทบาทและความเปนเจาของขอมูลบน ฝงเซิรฟเวอร 

   - 1.3.1.2. การจัดการกิจกรรม Organizer สามารถเผยแพรและจัดการกิจกรรมของตน กำหนด รายละเอียด วัน เวลา สถานที่ จำนวนที่นั่ง และเวลาปดรับลงทะเบียน 

   - 1.3.1.3. การลงทะเบียน Participant สามารถดูรายการและรายละเอียดกิจกรรม ลงทะเบียน ตรวจสอบทะเบียนของตน และยกเลิกตามเงื่อนไขที่กำหนด ระบบปองกันจำนวนลง ทะเบียนเกินที่นั่งและการมี active registration ซ้ำในกิจกรรมเดียวกัน 

   - 1.3.1.4. การมอบหมายผูสอน Organizer สามารถมอบหมาย Instructor ใหกิจกรรมของตน สวน Instructor สามารถดูรายการกิจกรรมที่ตนไดรับมอบหมาย พรอมรายละเอียดที่ จำเปนตอการสอน 

   - 1.3.1.5. การจัดการผูเขารวม Organizer สามารถดูรายชื่อผูลงทะเบียน บันทึกการเขารวม และดูสรุปผลของกิจกรรมที่ตนเปนเจาของ 

   - 1.3.1.6. การจัดเก็บขอมูล ระบบบันทึกขอมูลกิจกรรม การมอบหมายผูสอน การลงทะเบียน และการเขารวมในฐานขอมูลถาวร โดยเปดใหเรียกดูตามสิทธิ์ของผูใช 

- **1.3.2. Sprint 1 Scope** 

Sprint 1 เนนเสนทางหลักตั้งแต Organizer เขาสูระบบและเผยแพรกิจกรรมที่มีจำนวนที่นั่ง เปนจำนวนเต็มบวก จากนั้น Participant เขาสูระบบ ลงทะเบียน และเรียกดูทะเบียนที่บันทึกไวได สวน Organizer สามารถดูรายชื่อผูลงทะเบียนเฉพาะกิจกรรมของตน 

ระบบตองรองรับ login, logout และ current-user identity พรอมบังคับสิทธิ์ Participant และ Organizer บน backend ปองกันการเขาถึงทะเบียนสวนตัวของผูอื่นและการจัดการกิจกรรมขาม เจาของ รวมถึงควบคุมจำนวนที่นั่งและปองกัน active registration ซ้ำ แมมีคำขอลงทะเบียนพรอมกัน 

ความสามารถดาน Instructor เปนขอบเขตเพิ่มเติมของผลิตภัณฑ โดยทีมกำหนดใหพัฒนาการ มอบหมายผูสอนและการดูรายการกิจกรรมที่ตองสอนใน Sprint 2 สวนการยกเลิก เวลาปดรับลงทะเบียน check-in และรายงานจะพัฒนาตามแผนสาม Sprint ที่ทีมยืนยัน 

### **1.3.3. Sprint 1 Exclusions** 

Sprint 1 ใชบัญชีผูใชที่เตรียมผาน seed ได โดยยังไมรวม self-registration, password recovery, email verification และหนาจอจัดการบัญชีผูใชขั้นสูง ระบบสามารถรองรับบัญชี Instructor ไดโดยไมจำเปนตองมีบทบาท Admin 

ระบบไมจำเปนตองเชื่อมตอ payment gateway บริการสงขอความ หรือ external API จริง ตามขอกำหนดรายวิชา สำหรับขอบเขตเพิ่มเติม เชน waitlist การโอนสิทธิ์ลงทะเบียน และการจัด ตารางสอนอัตโนมัติ ทีมจะพิจารณาและบันทึกการตัดสินใจกอนนำเขาขอบเขตงาน 

### **1.4. A4 Functional requirements** 

|**ID**|**ขอกำหนดการทำงาน**|**Sprint**|
|---|---|---|
|FR-01|ผูใชเขาสูระบบ ออกจากระบบ และเรียกดูตัวตนปจจุบันได|Sprint 1|
|FR-02|Organizer เผยแพรกิจกรรมไดเมื่อขอมูลบังคับครบและผานกติกาตาม DEC-05<br>ไดแก ชื่อกิจกรรม วันและเวลาเริ่ม–สิ้นสุด สถานที่ และจำนวนที่นั่ง หากขอมูล<br>ขาดหรือไมถูกตอง ระบบจะแจงชองที่ตองแกและไมเผยแพร|Sprint 1|
|FR-03|ผูใชทั้งที่เขาสูระบบและยังไมเขาสูระบบสามารถดูรายการและรายละเอียดของ<br>กิจกรรมที่เผยแพรแลวไดตาม DEC-06|Sprint 1|
|FR-04|Participant ที่เขาสูระบบสามารถลงทะเบียนกิจกรรมในนามตนเองและเรียกดู<br>ทะเบียนของตนที่บันทึกในฐานขอมูลได สิทธิ์ลงทะเบียนเปนไปตาม DEC-07|Sprint 1|
|FR-05|Organizer ดูรายชื่อผูลงทะเบียนเฉพาะกิจกรรมของตนได|Sprint 1|
|FR-06|Participant ยกเลิกทะเบียนของตนตามกฎการยกเลิกได|Sprint 2|



|FR-07|Organizer กำหนด deadline และปรับรายละเอียดหรือ capacity ของ<br>กิจกรรมตนตามกฎได|Sprint 2|
|---|---|---|
|FR-10|Organizer มอบหมาย Instructor จากบัญชีที่มีอยูใหกิจกรรมของตน และเรียก<br>ดูการมอบหมายที่บันทึกไวได|Sprint 2|
|FR-11|Instructor ดูรายการกิจกรรมที่ตนไดรับมอบหมาย พรอมชื่อกิจกรรม วัน เวลา<br>สถานที่ และรายละเอียดการสอน|Sprint 2|
|FR-08|Organizer บันทึก check-in ของผูลงทะเบียนที่มีสิทธิ์ในกิจกรรมตนได|Sprint 3|
|FR-09|Organizer ดู attendance และสรุปจำนวนลงทะเบียน ยกเลิก และเขารวมของ<br>กิจกรรมตนได|Sprint 3|



### **1.5. A5 Business rules** 

|**ID**|**Business rules**|**Sprint**|
|---|---|---|
|BR-01|Capacity เมื่อเผยแพรตองเปนจำนวนเต็มบวก|Sprint 1|
|BR-02|จำนวน active registrations ตองไมเกิน capacity รวมถึงเมื่อหลายคำขอ<br>แขงขันแยงที่นั่งสุดทาย|Sprint 1|
|BR-03|Participant แตละคนมี active registration ไดไมเกินหนึ่งรายการตอกิจกรรม<br>แมสงคำขอพรอมกัน|Sprint 1|
|BR-04|Participant เขาถึงเฉพาะทะเบียนสวนตัวของตน และไมมีสิทธิ์เผยแพรหรือ<br>จัดการกิจกรรม|Sprint 1|
|BR-05|Organizer จัดการกิจกรรมและทะเบียนเฉพาะกิจกรรมที่ตนเปนเจาของ<br>เวนแตมีการระบุสิทธิ์กวางกวานี้อยางชัดเจน|Sprint 1|
|BR-06|คำขอลงทะเบียนหลัง deadline ตองถูกปฏิเสธ รายละเอียดเวลา timezone<br>และเงื่อนไขตรง deadline รอยืนยัน|Sprint 2|
|BR-07|การยกเลิกตองเปลี่ยนสถานะอยางสอดคลองและคืนจำนวนที่นั่งตามกฎ รอ<br>ยืนยันเวลาที่อนุญาต การลงใหม และการเก็บประวัติ|Sprint 2|



|BR-08|การลด capacity ตองไมทำให active registrations มากกวา capacity ใหม|Sprint 2|
|---|---|---|
|BR-11|เฉพาะ Organizer เจาของกิจกรรมเทานั้นที่มอบหมาย Instructor ใหกิจกรรม<br>นั้นได|Sprint 2|
|BR-12|ผูถูกมอบหมายตองเปนบัญชีที่มีอยูจริงและมีบทบาท Instructor จำนวนผูสอน|Sprint 2|
||ตอกิจกรรมและเงื่อนไขเปลี่ยนผูสอนรอยืนยัน Q-07||



|**ID**|**Business rules**|**Sprint**|
|---|---|---|
|BR-13|Instructor ดูเฉพาะรายการงานสอนที่ไดรับมอบหมาย ไมมีสิทธิ์แกกิจกรรม|Sprint 2|
||เปลี่ยน capacity มอบหมายผูสอน หรือดูทะเบียนสวนตัวของ Participant||
|BR-09|Check-in ตองอางอิงทะเบียนที่มีสิทธิ์และไมบันทึก attendance ซ้ำ|Sprint 3|
|BR-10|รายงานตองใชขอมูลทะเบียนและ attendance ที่บันทึกจริง พรอมนิยามวิธีนับ|Sprint 3|
||และจัดการทะเบียนยกเลิก||



**1.6. A6 Non functional requirements** 

|**ID**|**เปาหมาย วิธีตรวจสอบ และ Sprint**|
|---|---|
|NFR-01|Security ทุก protected operation ที่ทดสอบดวย anonymous forbidden role หรือผิด ownership<br>ตองถูกปฏิเสธโดย backend และไมคืน private data วิธีตรวจ API integration tests ตาม permission<br>matrix Sprint 1 และ regression ในทุก sprint|
|NFR-02|Persistence ผลลงทะเบียนที่สำเร็จตองยังเรียกดูไดหลัง application restart วิธีตรวจ integration test และ<br>restart demonstration Sprint 1; ตรวจซ้ำหลัง redeployment ใน Lab 5 และ final|
|NFR-03|Data integrity ในกรณี capacity เหลือหนึ่งและสงคำขอลงทะเบียนพรอมกันสองราย ตองสำเร็จเพียงหนึ่งราย<br>และคง invariant BR-02 รวมถึงทดสอบ duplicate concurrent requests ตาม BR-03 Sprint 1|
|NFR-04|Credential protection หากระบบจัดการรหัสผานเอง ตองไมเก็บ plaintext และตองทดสอบ<br>session/token expiry กับ logout ตามแบบที่เลือก Sprint 1|
|NFR-05|Reproducibility ผูทดสอบตองตั้งคาระบบ ฐานขอมูล migration seed build และ test ไดตาม README<br>โดยใช synthetic data และไมตองใช production secrets วิธีตรวจ fresh local setup Sprint 1; Docker<br>CI/CD GCP ใน Lab 5|
|NFR-06|Usability ทุกหนาหลักตองมี loading empty validation และ error state ที่เกี่ยวของ วิธีตรวจ selected<br>UI tests และ manual checklist Sprint 1–3 ตาม feature; ยังตองกำหนดชุดกรณีจริง|
|NFR-07|Instructor access and persistence: backend ตองปฏิเสธ anonymous ผูใชผิด role และ Instructor ที่<br>ไมไดรับมอบหมาย โดยไมคืน private assignment data การมอบหมายที่บันทึกตองเรียกดูไดหลัง restart<br>ตรวจดวย API/database integration tests และ restart check ใน Sprint 2 พรอม regression ในรุนถัดไป|



**1.7. A7 Assumptions decisions and open questions** 

|**ID**|**ประเด็นและขอสรุป**|**Related Sprint**|**สถานะ**|
|---|---|---|---|
|DEC-01|ใช Participant และ Organizer เปนสองบทบาทหลักตามโจทย ไม<br>มีขอกำหนดบังคับใหเพิ่ม Admin|Sprint 1|บันทึกตามราง|
|DEC-02|ทีมจัดการยกเลิกและเวลาปดรับลงทะเบียนไวใน Sprint 2 สวน<br>check-in และรายงานอยูใน Sprint 3 ตามแผนของทีม|Sprint 2–3|ยืนยันแลว|
|DEC-03|เพิ่ม Instructor สำหรับกิจกรรมอบรม/เวิรกช็อป ผูจัดเจาของ<br>กิจกรรมมอบหมายผูสอน และ Instructor ดูเฉพาะงานสอนที่ไดรับ<br>มอบหมาย|Sprint 2|ตามบริบทที่ทีมเลือก|
|DEC-04|ทีมจัด F-09 การมอบหมาย Instructor และรายการกิจกรรมที่ตอง<br>สอนไวใน Sprint 2 รายละเอียดกฎการมอบหมายอางอิง Q-07<br>และ Q-08|Sprint 2|ยืนยัน Sprint แลว|
|DEC-05|ใน Sprint 1 Organizer ตองกรอกชื่อกิจกรรม วันและเวลาเริ่ม วัน<br>และเวลาสิ้นสุด สถานที่ และจำนวนที่นั่งกอนเผยแพร ชื่อกิจกรรม<br>ตองมีขอความ เวลาสิ้นสุดตองอยูหลังเวลาเริ่ม และจำนวนที่นั่งตอง<br>เปนจำนวนเต็มมากกวา 0 รายละเอียดกิจกรรมเวนวางได หาก<br>ขอมูลบังคับขาดหรือไมผานกติกา ระบบจะแจงชองที่ตองแกและไม<br>เผยแพรกิจกรรม|Sprint 1|ยืนยันแลว|
|DEC-06|ผูที่ยังไมเขาสูระบบสามารถดูรายการและรายละเอียดของกิจกรรมที่<br>เผยแพรแลวได การลงทะเบียนตองเขาสูระบบกอนและผานการ<br>ตรวจสิทธิ์บน backend|Sprint 1|ยืนยันแลว|
|DEC-07|ใน Sprint 1 เฉพาะบัญชี Participant ที่เขาสูระบบเทานั้นที่ลง<br>ทะเบียนกิจกรรมในนามตนเองได Backend ตองปฏิเสธคำขอลง<br>ทะเบียนจากบัญชี Organizer และไมสรางรายการลงทะเบียน|Sprint 1|ยืนยันแลว|
|Q-01|กอนเผยแพรกิจกรรม Organizer ตองกรอกชองใดบาง เชน ชื่อ<br>กิจกรรม วันและเวลา สถานที่ และจำนวนที่นั่ง ชองใดเวนวางได<br>และเมื่อกรอกชองบังคับไมครบ ระบบตองแจงอะไร|Sprint 1|สรุปแลว · ดู DEC-05|



|Q-02|ผูที่ยังไมเขาสูระบบสามารถดูรายการและรายละเอียดกิจกรรมที่<br>เผยแพรแลวไดหรือไม|Sprint 1|สรุปแลว · ดู DEC-06|
|---|---|---|---|
|Q-03|บัญชีที่มีบทบาท Organizer สามารถลงทะเบียนเขารวมกิจกรรมใน<br>ฐานะ Participant ไดหรือไม|Sprint 1|สรุปแลว · ดู DEC-07|
|Q-04|เวลาปดรับลงทะเบียนใชเขตเวลาใด ถาคำขอมาถึงตรงเวลาปดรับ<br>พอดี ระบบจะรับหรือปฏิเสธการลงทะเบียน|Sprint 2|รอยืนยัน|
|Q-05|Participant ยกเลิกไดถึงเมื่อไร เมื่อยกเลิกแลวระบบคืนที่นั่งเมื่อไร<br>ผูใชคนเดิมลงทะเบียนใหมไดไหม และระบบจะเก็บประวัติหรือ<br>จัดการบันทึกการเขารวมเดิมอยางไร|Sprint 2|รอยืนยัน|
|Q-06|เมื่อมีผูลงทะเบียนแลว Organizer ยังแกขอมูลกิจกรรมชองใดได<br>บาง และลดจำนวนที่นั่งไดถึงเทาไร หากจำนวนใหมต่ำกวาจำนวนผู<br>ลงทะเบียนที่ยังมีสถานะ active ระบบตองทำอยางไร|Sprint 2|รอยืนยัน|
|Q-07|หนึ่งกิจกรรมมอบหมาย Instructor ไดกี่คน Organizer เปลี่ยนหรือ<br>ถอนการมอบหมายไดถึงเมื่อไร และตองเก็บประวัติการมอบหมาย<br>เดิมไวไหม|Sprint 2|รอยืนยัน|
|Q-08|บัญชี Instructor ใชเปน Participant หรือ Organizer ดวยไดไหม<br>ถาผูสอนคนเดียวกันถูกมอบหมายใหสอนสองกิจกรรมที่เวลาทับกัน<br>ระบบควรอนุญาต แจงเตือน หรือปฏิเสธ|Sprint 2|รอยืนยัน|
|Q-09|Organizer เปดให check-in ไดชวงเวลาใด และแกบันทึกที่ผิดได<br>อยางไร รายงานนับผูลงทะเบียน ผูยกเลิก และผูเขารวมจากสถานะ<br>ใดบาง|Sprint 3|รอยืนยัน|



**2. Part B Feature inventory and traceability** 

   - **2.1. B1 Feature inventory** 

ตารางนี้ระบุฟเจอร requirements ที่เกี่ยวของ dependencies และ Sprint ที่วางแผนทำ รายละเอียด 

FR BR และ NFR ใหอาง Part A 

|**ID**|**responsibility**|**Requirements**|**Dependencies**|**Sprint**|
|---|---|---|---|---|
|**F-01**|Identity and access<br>Login logout และ current<br>identity|FR-01<br>BR-04 BR-05<br>NFR-01 NFR-04|ไมมี dependency ดาน<br>domain|1|
|**F-02**|Event publication and<br>discovery<br>เผยแพรและดูกิจกรรม|FR-02 FR-03<br>BR-01 BR-05<br>NFR-06|F-01 สำหรับเผยแพร|1|
|**F-03**|Registration and own retrieval<br>ลงทะเบียนและดูทะเบียนตน|FR-04<br>BR-02 BR-03 BR-04<br>NFR-02 NFR-03<br>NFR-06|F-01 F-02|1|
|**F-04**|Organizer registration list<br>ผูจัดดูทะเบียนกิจกรรมตน|FR-05<br>BR-05<br>NFR-01 NFR-06|F-01 F-02 F-03|1|
|**F-05**|Cancellation<br>ยกเลิกทะเบียน|FR-06 BR-07<br>NFR-01 NFR-02<br>NFR-06|F-03 และ Q-05|2|
|**F-06**|Event management and<br>deadlines<br>จัดการกิจกรรมและเวลาปดรับ|FR-07 BR-06 BR-08<br>NFR-01 NFR-03<br>NFR-06|F-02 F-03<br>Q-04 Q-06|2|
|**F-07**|Check-in and attendance<br>บันทึกการเขารวม|FR-08 BR-09<br>NFR-01 NFR-02<br>NFR-06|F-03 F-05<br>Q-09|3|



|**F-08**|Attendance summary<br>สรุปผลการเขารวม|FR-09 BR-10<br>NFR-01 NFR-06|F-07|3|
|---|---|---|---|---|
|**SYS-01**|Setup and delivery<br>การตั้งคาและสงมอบระบบ|NFR-05|Local setup→Lab 5<br>deployment→final|1–3<br>Lab 5|
|F-09|Instructor assignment and<br>teaching list<br>มอบหมายผูสอนและดูงานสอน|FR-10 FR-11<br>BR-11 BR-12 BR-13<br>NFR-07|F-01 F-02<br>Q-07 Q-08|2|



### **2.2. B2 Requirements traceability** 

ตารางนี้เชื่อมแตละ requirement ไปยังฟเจอร Sprint และแผนตรวจสอบ AC/TEST ที่อางเปนรางใน 

Part E สถานะการรันทั้งหมดคือ NOT RUN จนกวาจะมีหลักฐานจริง 

|**Requirement**<br>**FR-01**|**Feature**<br>F-01|**Sprint**<br>1|**AC และแผนตรวจสอบ**<br>AC-01 AC-02→TEST-01 TEST-02|
|---|---|---|---|
|**FR-02**|F-02|1|AC-03→TEST-03|
|**FR-03**|F-02|1|ยังตองเพิ่ม AC/TEST สำหรับรายการและรายละเอียดกิจกรรม|
|**FR-04**|F-03|1|AC-04→TEST-04|
|**FR-05**|F-04|1|AC-08→TEST-08|
|**FR-06**|F-05|2|รอ contract cancellation และขอสรุป Q-05|
|**FR-07**|F-06|2|รอ contract deadline/capacity และ Q-04 Q-06|
|**FR-08**|F-07|3|รอ contract check-in และ Q-09|
|**FR-09**|F-08|3|รอนิยามวิธีนับและ contract summary|
|**BR-01**|F-02|1|AC-03→TEST-03|
|**BR-02**|F-03|1|AC-05 AC-07→TEST-05 TEST-07|
|**BR-03**|F-03|1|AC-06→TEST-06 รวม concurrent duplicate|
|**BR-04**|F-01 F-03|1|AC-09→TEST-09|
|**BR-05**|F-01 F-02<br>F-04|1|AC-08 AC-09→TEST-08 TEST-09; เติมกรณีจัดการ event ขาม<br>เจาของใหครบ|
|**BR-06**|F-06|2|รอ deadline boundary tests ตาม Q-04|
|**BR-07**|F-05|2|รอ cancellation/state/seat-return tests ตาม Q-05|



|**BR-08**|F-06|2|รอ capacity-change tests ตาม Q-06|
|---|---|---|---|
|**BR-09**|F-07|3|รอ eligible registration และ duplicate check-in tests|
|**BR-10**|F-08|3|รอ tests เทียบรายงานกับขอมูลจริงและสูตรที่ยืนยัน|
|**NFR-01**|F-01 F-04 ถึง<br>F-08|1–3|Sprint 1: AC-08 AC-09→TEST-08 TEST-09; เพิ่ม access<br>regression สำหรับทุก endpoint ที่เพิ่มใน Sprint 2–3|
|**NFR-02**|F-03 F-05<br>F-07|1–3|Sprint 1: AC-10→TEST-10; ตรวจ restart และตรวจ<br>redeployment ซ้ำใน Lab 5/final|
|**NFR-03**|F-03 F-06|1–2|Sprint 1: AC-06 AC-07→TEST-06 TEST-07; Sprint 2 เพิ่ม<br>capacity-change verification|
|**NFR-04**|F-01|1|AC-02→TEST-02 สำหรับ lifecycle; ยังตองเติม AC/TEST<br>ตรวจ password hashing และ plaintext storage|
|**NFR-05**|SYS-01|1–3|Fresh local setup ใน Sprint 1; Docker CI/CD GCP ใน Lab 5;<br>ตรวจซ้ำ final ยังตองกำหนด verification IDs|
|**NFR-06**|F-02 ถึง F-08|1–3|Loading empty validation error states ตามหนาที่สงในแตละ<br>sprint; ยังตองเพิ่ม AC/TEST และ manual checklist|
|FR-10|F-09|2|รอ contract: owner มอบหมายและเรียกดูได; invalid account และ<br>wrong role/owner ถูกปฏิเสธ|
|FR-11|F-09|2|รอ contract: Instructor ดูเฉพาะงานตนพรอมรายละเอียดและ empty<br>state|
|BR-11|F-09|2|รอ API ownership tests ของ Organizer สองคน|
|BR-12|F-09|2|รอ account/role validation tests และขอสรุป Q-07|
|BR-13|F-09|2|รอ assigned/unassigned Instructor และ forbidden operation tests|
|NFR-07|F-09|2|รอ API/database integration tests และ restart check; NOT RUN|



### **2.3. B3 Coverage gaps and baseline changes** 

ทุก baseline FR BR และ NFR มี feature หรือ system responsibility และ Sprint รองรับแลว รายการที่ระบุวายังตองเพิ่ม AC/TEST เปนชองวางดาน verification ที่ตองเติม โดยเฉพาะ FR-03, event ownership ใน BR-05, password hashing ใน NFR-04 และ UI states ใน NFR-06 

Sprint 2–3 ยังตองจัดทำ contracts AC และ STS ตามแผนกอน implementation ทีมยืนยันการจัดสรรฟเจอรแลว สวนรายละเอียดใน Q-04 ถึง Q-09 ยัง ตองยืนยันกอนลงรายละเอียด contract 

Approved changes [ยังไมมีรายการที่ไดรับการยืนยันในเอกสาร] ใหบันทึก Change ID เหตุผล ผูอนุมัติ วันที่ requirements ที่กระทบ และ version โดยไม ลบ requirements เพื่อซอนงานที่ยังไมเสร็จ 

### **3. Part C System-Level SDS** 

### **3.1. C1 Architecture and stack** 

[เติม stack จริงและเหตุผลที่เลือก] อธิบาย UI → API/application → persistent database พรอม component responsibilities รูปแบบการสื่อสาร และจุดบังคับ business rules บน server 

[เพิ่ม architecture diagram เมื่อชวยอธิบาย] ระบุ transaction หรือ concurrency strategy ที่ปองกัน capacity เกินและ duplicate registration ตอง พิสูจนพฤติกรรมดวย tests ไมถือวาตรวจจำนวนใน UI เพียงอยางเดียวเพียงพอ 

### **3.2. C2 Data model** 

โครงแนวคิดที่เสนอ User มี id และ role; Event มี id organizerId capacity และรายละเอียด; Registration เชื่อม participantId กับ eventId และสถานะ; Attendance อางอิง registration และขอมูล check-in 

[เติม ER diagram และ data dictionary] ระบุชนิดขอมูล required fields relationships ownership foreign keys unique constraints indexes และ การเก็บประวัติ โดยเฉพาะ invariant ของ active registrations 

[เติม] migration/setup procedure reproducible seed และกลยุทธ durable storage ขอมูลขางตนเปนแนวคิดราง ยังไมใช schema ที่ยืนยัน 

### **3.3. C3 Screens API and permissions** 

หนาหลักที่เสนอ Login รายการและรายละเอียดกิจกรรม My registrations Organizer event management และ Event registrations; สวน 

cancellation check-in และ reports เพิ่มตาม sprint 

[เติม] navigation validation loading empty และ error states ของแตละหนาที่เกี่ยวของ 

[เติม] API conventions methods/paths request response validation safe error format และ HTTP status ที่เลือก รายละเอียด endpoint อยูใน 

feature contracts 

Permission matrix ราง 

Login และ current identity → ตาม session/token design 

Publish และแกกิจกรรม → Organizer เฉพาะกิจกรรมตนเอง 

Register → เฉพาะ Participant ที่เขาสูระบบและลงทะเบียนในนามตนเอง Backend ปฏิเสธคำขอจาก Organizer ตาม DEC-07 

View private registration และ cancel → Participant เฉพาะของตน 

View event registrations check-in และ report → Organizer เฉพาะกิจกรรมตน 

Anonymous → ดูรายการและรายละเอียดกิจกรรมที่เผยแพรแลวไดตาม DEC-06 ตองเขาสูระบบกอนลงทะเบียน สวน protected operations อื่นให ปฏิเสธ 

[เติมตารางจริง] Operation | Anonymous | Participant | Organizer | Ownership condition | Verification ID 

### **3.4. C4 Authentication configuration and delivery** 

[เติม] credential handling hashing library session/token creation storage expiry current-user retrieval logout และเหตุผลที่เลือก ตองทดสอบ 

valid/invalid login anonymous access forbidden role และ cross-user/event ownership 

[เติม] environment-variable names database configuration secret handling และ planned GCP components พรอมการบรรจุ Docker และ persistent storage 

Docker CI/CD และ GCP deployment ครบถวนสงใน Lab 5 วันที่ 15 พฤศจิกายน 2026 ไมไดบังคับใหเสร็จใน Deliverable 1 แตตองเตรียมสถาปตยกรรม รองรับ 

### **4. Part D Three-sprint plan** 

**4.1. D1 Sprint 1** 

เปาหมาย ทำเสนทางลงทะเบียนครบจาก UI ผาน API ถึงฐานขอมูล พรอม login logout identity roles และ ownership 

Features F-01 F-02 F-03 F-04 และ SYS-01 local setup 

Dependencies ยืนยัน context ขอมูล event และ authentication design กอนลงรายละเอียด contract 

ผลสำเร็จที่ตองแสดง เผยแพรกิจกรรม capacity บวก ลงทะเบียนและเปดดูขอมูลที่บันทึก ผูจัดดูทะเบียนกิจกรรมตน ปฏิเสธเต็ม/ซ้ำ/สิทธิ์ไมถูกตอง รวม 

concurrent last-place requests มีผลทดสอบและ reviewed release บน main 

Checkpoint Deliverable 1 วันที่ 8 พฤศจิกายน 2026 เวลา 23:59 

### **4.2. D2 Sprint 2** 

เปาหมาย ขยายการจัดการทะเบียนและกิจกรรมดวย F-05 F-06 พรอม regression ของ Sprint 1 รวม F-09 การมอบหมาย Instructor และดูรายการงาน สอนใน Sprint 2 โดยพึ่ง F-01 F-02 และขอสรุป Q-07/Q-08 

Dependencies Sprint 1 ที่ยอมรับแลว และขอสรุป deadline cancellation capacity changes 

ผลสำเร็จ Cancellation คืนที่นั่งตามกฎ deadline ถูกบังคับและ capacity changes ไมทำลาย invariant มี contracts AC STS tests review และ 

integration ครบ 

Checkpoint Deliverable 2 วันที่ 29 พฤศจิกายน 2026 ตองเสร็จ Sprint 2 และแสดง Sprint 3 progress จริงบน integrated candidate ที่ deploy บน GCP 

### **4.3. D3 Sprint 3** 

เปาหมาย ทำ F-07 F-08 ปด baseline และ harden ผลิตภัณฑ 

Dependencies Registration lifecycle และ event ownership จาก Sprint 1–2 รวมถึงนิยาม attendance/report 

ภายใน 29 พฤศจิกายน 2026 ตองมี contracts ครบสำหรับงานที่เหลือและอยางนอยหนึ่ง meaningful Sprint 3 workflow หรือ rule ที่ implement และ ทดสอบแลว 

ผลสำเร็จครบภายใน 13 ธันวาคม 2026 ระบบ check-in attendance reports และ integration ทำงานครบ พรอม final regression UAT/re-test defect status deployment และ handoff 

Lab 6 สง 22 พฤศจิกายน และ Lab 7 สง 29 พฤศจิกายน ใชแอปเดียวกันตอเนื่อง ตองจัดเวลา UAT และ maintenance รวมกับ sprint โดยไมใช baseline feature แทน approved maintenance change 

**5. Part E Sprint 1 engineering contracts** 

   - **5.1. E1 Contract template** 

ใชโครงตอไปนี้แยกสำหรับ F-01 F-02 F-03 และ F-04 

Feature ID และชื่อ [เติม] 

Contract version วันที่ ผูเขียน ผู review และ linked Issue [เติม] 

Linked FR BR NFR และ dependencies [อาง Part B] 

Workflow preconditions validation permissions negative และ boundary cases [เติม] 

Feature SDS และการเปลี่ยน UI API data [เติม หาก layer ใดไมเปลี่ยนใหระบุชัดเจน] 

UI states และ navigation [เติม] 

API method/path authentication request response/error shapes [เติม] 

Data fields constraints migrations และ transaction behavior [เติม] 

Acceptance criteria [AC IDs และ observable outcomes] 

STS [TEST ID linked AC level precondition/input action expected result] 

Definition of Done completion evidence links และ revision history [เติม] 

- **5.2. E2 Initial acceptance criteria and planned verification** 

|รหัส|เกณฑการยอมรับ|แผนตรวจสอบ|
|---|---|---|
|AC-01|F-01 valid login คืน identity ที่ถูกตอง; invalid login ถูกปฏิเสธและไมสราง<br>authenticated access|TEST-01 API integration|



|AC-02|F-01 logout และ session/token expiry เปนไปตาม design ที่ยืนยัน|TEST-02 API integration|
|---|---|---|
|AC-03|F-02: เมื่อ Organizer กรอกขอมูลบังคับถูกตองตาม DEC-05 ระบบเผยแพรกิจกรรม<br>และเรียกดูขอมูลที่บันทึกได แมเวนรายละเอียดกิจกรรมไว หากขาดชองบังคับ เวลา<br>สิ้นสุดไมอยูหลังเวลาเริ่ม หรือจำนวนที่นั่งไมใชจำนวนเต็มบวก ระบบแจงชองที่ผิดและ<br>ไมเผยแพรกิจกรรม|TEST-03 unit และ API/database<br>integration: ขอมูลถูกตอง, เวนราย<br>ละเอียด, ขาดชองบังคับ, ชวงเวลาไมถูก<br>ตอง และ capacity ไมถูกตอง|
|AC-04|F-03 Participant ลงทะเบียนกิจกรรมที่มีที่วางและเปดดูทะเบียนตนที่ persist แลว<br>ได|TEST-04 API/database integration<br>และ selected UI journey|
|AC-05|F-03 กิจกรรมเต็มตองปฏิเสธคำขอใหมและไมเพิ่ม active registration|TEST-05 API/database integration|
|AC-06|F-03 ลงทะเบียนซ้ำ participant/event เดิมตองไมสราง active registration ที่สอง<br>รวม concurrent duplicate requests|TEST-06 API/database integration|
|AC-07|F-03 เมื่อเหลือหนึ่งที่นั่งและมีสอง participant สงพรอมกัน สำเร็จหนึ่งรายการและ<br>จำนวนไมเกิน capacity|TEST-07 concurrent API/database<br>integration|
|AC-08|F-04 Organizer เปดรายชื่อกิจกรรมตนได แตเปดของ Organizer อื่นไมได|TEST-08 API/database integration|
|AC-09|F-01 ถึง F-04: ผูที่ยังไมเขาสูระบบดูรายการและรายละเอียดกิจกรรมที่เผยแพรแลวได<br>ตาม DEC-06 แตสงคำขอลงทะเบียนหรือใช protected operation ไมได<br>Participant เผยแพรกิจกรรมหรืออานทะเบียนสวนตัวของผูอื่นไมได ตาม DEC-07<br>เมื่อ Organizer สงคำขอลงทะเบียน Backend ตองปฏิเสธและไมสรางรายการลง<br>ทะเบียน|TEST-09 API integration แบบ<br>parameterized ตาม permission<br>matrix รวมกรณี Organizer เรียก API ลง<br>ทะเบียนโดยตรง|
|AC-10|F-03 เปดทะเบียนเดิมไดหลัง restart application|TEST-10 restart/persistence check<br>ระบุสวน automated/manual ใหชัด|



TEST แตละรายการยังตองเติม seed/input steps expected response และ assertions ที่เจาะจงตาม API/data design โดยเชื่อม AC ทุกขอกอนเริ่ม implementation 

### **E3 Product Definition of Done** 

[เตรียมชองสถานะและ evidence] Required behavior implemented; AC ทั้งหมดมี verification ที่เหมาะสมและไดรันจริง; meaningful tests passing; failed/skipped tests และงานคางเปดเผย; teammate review และ staging integration เสร็จ; reviewed release อยูบน main พรอม tag/commit; setup seed และ documents ตรง release 

สำหรับ meaningful rule work ตองเก็บ TDD red/green evidence วา intended behavior test ลมเหลวกอนแกและผานภายหลัง พรอม versions และ เหตุผลของการแก ไมใชเพียงคำยืนยันจาก AI เปนหลักฐาน 

# **Part F Working Sprint 1 and verification** 

### **F1 Program demonstrations** 

[เติม screenshots หรือ screen dumps จากระบบจริง] 

Demo 1 normal journey และ persisted retrieval อาง F-01 ถึง F-04 AC-01 AC-03 AC-04 AC-08 

Demo 2 business-rule rejection อาง AC-05 AC-06 และ concurrency evidence AC-07 

Demo 3 login/logout และ forbidden role/ownership อาง AC-01 AC-02 AC-08 AC-09 พรอม backend/API evidence 

ทุก scenario เติม role preconditions steps expected result actual result และ release commit; UI screenshot อยางเดียวไมพิสูจน backend authorization หรือ persistence 

### **F2 Build tests and TDD evidence** 

[เติม] build/test commands tested commit date และ output ที่อานไดพรอม pass fail skipped counts 

[เติมผลหนึ่งแถวตอ AC] AC ID | Planned TEST ID | Actual file/test name | Automated หรือ manual | Result | Commit | Evidence page 

[แทรก excerpt จาก automated tests จริงสองสวน] domain rule หนึ่งสวนและ role/ownership restriction หนึ่งสวน พรอม setup assertion และผล รัน 

[เติม] TDD red/green test output และ version ของแตละชวง สถานะปจจุบันของทุก planned test คือ NOT RUN ยังไมมีหลักฐานการรันในเอกสารนี้ 

### **F3 Git workflow contribution and AI use** 

[เติมหลักฐานสอง completed Issues และ PRs] Issue ID | Feature/contract | Branch | Author | Reviewer | Review finding/approval reason | Staging merge | Main release 

[เติม] board status release reference และ history sequence ของ contract/test design กอน implementation พรอม commit IDs และ dates 

[เติม contribution table] สมาชิก | Requirements/design | Tests | Implementation | Review/integration | Evidence อธิบาย pair work ตามจริง ไมจำเปนตองมีจำนวน commits เทากัน 

AI-use declaration ราง ใช AI ชวยอานขอกำหนดและจัดโครงเอกสาร ทีมตองตรวจความถูกตอง ยืนยันกฎและการออกแบบ และรับผิดชอบผลงานที่สง [ปรับ ตามการใชงานจริง] 

### **F4 Reproduction limitations and submission** 

[เติม] dependencies environment-variable examples database migration/seed run/build/test commands และ safe local demo-account procedure หามใส production secrets 

[เติม known limitations] ID | Feature/AC | ปญหาหรืองานที่ยังไมเสร็จ | ผลกระทบ | Owner | Next action 

กอนสง ตรวจวา PDF มีเนื้อหาวิศวกรรม A–E ครบและ selected evidence F ภายในไฟลเดียว พรอมสารบัญเลขหนาจริง navigation table repo URL 

และ immutable release เอกสารนี้ยังเปนโครงราง ไมพรอมสงจนกวาจะเติม design contracts และหลักฐานจริง 

Deliverable 1 ไมตองสง demo video GCP URL หรือ Docker/CI/CD ที่เสร็จแลว แยกขอกำหนดเหลานี้ตาม Lab 5 และ final checkpoint 

# **เอกสารอางอิง** 

group_work_specs_v1.pdf โดยเฉพาะ common requirements หัวขอ 3 Event Registration and Attendance System และแนวทาง engineering/delivery 

project_deliverable_1_v1.pdf ใชกำหนดโครง Parts A–F คะแนน deadline และหลักฐานที่ตองสง 

project_deliverable_2_v1.pdf ใชตรวจ checkpoint Sprint 2 complete และ Sprint 3 tested progress วันที่ 29 พฤศจิกายน 

project_final_delivery_v1.pdf ใชตรวจเปาหมาย complete product วันที่ 13 ธันวาคม เอกสารนี้มีขอความระบุความยาววิดีโอทั้ง 10 นาทีและ 4 นาทีใน คนละสวน ใหถาม Instructor/TA กอนเตรียม final video 

