# 🩸 DONOR — AI-Powered Blood Donation Platform

> **Slogan:** *“Bir donor — bir hayot.”*  
> **Pitch:** *“Muammo donorlarning yo‘qligida emas. Muammo — kerakli donorni kerakli vaqtda topishda. DONOR esa shu ikki insonni AI yordamida tez va xavfsiz bog‘laydi.”*

---

## 📌 Loyiha Haqida

**DONOR** — qon kerak bo‘lgan bemorlar, ko‘ngilli donorlar va shifoxonalarni tezkor va xavfsiz tarzda bog‘lovchi milliy sog‘liqni saqlash ekotizimi.

Loyiha O‘zbekiston sog‘liqni saqlash tizimi talablari, JSST (WHO) protokollari va zamonaviy xavfsizlik standartlariga to‘liq mos holda ishlab chiqilgan.

---

## 🚀 Asosiy Modullar va Imkoniyatlar

1. **🗺️ Interaktiv Donor Xaritasi (`/map`):**
   - Leaflet asosidagi tezkor xarita (Toshkent va barcha viloyatlar).
   - Qon guruhi (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) va donorlik holati bo‘yicha filtrlash.
   - Yuqori unumdorlik: markerlar DOM keshlanishi, render kechikishlari bartaraf etilgan.
   - Maxfiylik: donorlarning aniq xonadon manzillari emas, umumiy koordinatalar radiusi ko‘rsatiladi.

2. **🚨 SOS Qon So‘rovlari (`/request`):**
   - Shoshilinch (SOS) va rejali qon so‘rovlarini joylashtirish.
   - Mos donorlar avtomatik bildirishnoma oladi va 1-klik bilan yordam berishga rozilik bildiradi.

3. **🤖 DONOR AI Healthcare Assistant (`/ai`):**
   - Oddiy chatbot emas — platformaning barcha funksiyalarini boshqara oluvchi intellektual yordamchi.
   - **Ko‘p tilli:** O‘zbek, Rus va Ingliz tillarini tushunadi va javob beradi.
   - **Tibbiy bilimlar bazasi:** Qon guruhlari moslik matritsasi, donorlikka tayyorgarlik (vazn >= 50 kg, 18-65 yosh, oraliq muddatlar, parhez).
   - **Backend Tool Calling:** `search_donors`, `get_blood_request`, `create_blood_request`, `get_platform_help`.
   - **Tasdiqlash mexanizmi:** SOS so'rovlari yoki muhim amallar foydalanuvchining alohida roziligisiz (`Confirmation Card`) yuborilmaydi.
   - **Tibbiy ogohlantirish:** AI tashxis qo‘ymaydi, yakuniy klinik xulosani shifokor beradi. Favqulodda vaziyatda **103** Tez tibbiy yordamga yo‘naltiradi.

4. **🏥 Shifoxona va Qon Banki Kabineti (`/hospital`):**
   - Shifoxonadagi real-vaqt qon zaxiralari monitoringi (Adequate, Low, Critical).
   - Reanimatsiya va operatsiya bo‘limlaridan tezkor talabnoma yuborish.

5. **💬 Xavfsiz Suhbat (`/chat`):**
   - Shaxsiy telefon raqamlarini ochiqlamasdan donor va murojaatchi o‘rtasida xavfsiz chat.
   - Faqat o‘zaro kelishuvdan so‘ng raqam almashish opsiyasi.

6. **💊 Dori Eslatmasi (`/medications`):**
   - Donorlikdan so‘ng quvvatlovchi yoki surunkali kasalliklar dori jadvallari, brauzer bildirishnomalari.

7. **👤 Shaxsiy Profil (`/profile`):**
   - Donorlik maqomini boshqarish (🟢 Tayyor, 🟡 Band, ⚪ Faol emas).
   - Qon topshirish tarixi va qutqarilgan hayotlar statistikasi.

8. **🛡️ Admin Paneli (`/admin`):**
   - So‘rovlar moderatsiyasi, foydalanuvchilar nazorati va audit loglari.

---

## 🛠️ Texnologiyalar Stoki

- **Frontend:** React 19, TypeScript, Vite 5.
- **Dizayn:** Clean Healthcare Startup UI (Deep Crimson `#DC2626`, Deep Navy `#0F172A`, Clean Slate `#F8FAFC`).
- **Icons:** Lucide React.
- **Xaritalar:** Leaflet & React-Leaflet.
- **Arxitektura:** Code-splitting (`React.lazy` + `Suspense`), Global `ErrorBoundary`, Responsive Layout.
- **Backend / Database:** Supabase PostgreSQL, Row Level Security (RLS), Realtime triggers.

---

## 🔒 Xavfsizlik (Security & Privacy)

1. **Admin huquqini oshirishdan himoya:** PostgreSQL triggeri (`prevent_unauthorized_admin_elevation`) orqali oddiy foydalanuvchi o‘zining `is_admin` maqomini oshira olmaydi.
2. **Row Level Security (RLS):** Har bir jadval (`profiles`, `blood_requests`, `messages`, `medications`) uchun qat'iy foydalanuvchi ID tekshiruvi.
3. **Maxfiylik:** Bemor va donorlarning telefon raqamlari ruxsatsiz uchinchi shaxslarga ko‘rinmaydi.
4. **Audit Log:** Adminlarning barcha muhim harakatlari `admin_audit_logs` jadvalida saqlanadi.

---

## ⚡ Qanday Ishga Tushirish Kerak?

### 1-usul: Bir klik bilan ishga tushirish (Windows)
Loyiha papkasidagi **`dev.bat`** faylini ikki marta bosing.

### 2-usul: Terminal orqali
```bash
# Kutubxonalarni o'rnatish (zarur bo'lsa)
npm install --legacy-peer-deps

# Dasturni ishga tushirish (port 3000)
npm run dev

# Ishlab chiqarish (Production) build tekshiruvi
npm run build
```

Brauzerda oching: **[http://localhost:3000](http://localhost:3000)**

---

## 🗄️ Supabase Ma'lumotlar Bazasini Sozlash (Ixtiyoriy)

Agar loyihani jonli Supabase bulut bazasiga ulamoqchi bo‘lsangiz:
1. [supabase.com](https://supabase.com) saytida yangi bepul loyiha oching.
2. **SQL Editor** bo‘limiga kiring va loyihadagi `supabase-schema.sql` fayli mazmunini nusxalab ishga tushiring (`Run`).
3. `.env` faylida o‘z kalitlaringizni kiriting:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
*(Ko'rsatilmasa, loyiha avtomatik tarzda to'liq offline Demo rejimida ishlayveradi).*

---

## 📋 Hackathon Hakamlari Uchun Eslatma

Loyiha taqdimot paytida internet yoki tashqi backend uzilishlaridan himoyalangan:
- Supabase kaliti bo‘lmasa ham, barcha sahifalar, xarita, donor qidiruvi, AI agent, dori eslatmasi va admin paneli **to‘liq interaktiv rejimda ishlaydi**.
- Qon guruhlari mosligi real biologik matritsa bo‘yicha ishlaydi.
- AI Agent tibbiy cheklovlarga qat'iy rioya qiladi va favqulodda hollarda **103** raqamiga yo‘naltiradi.
