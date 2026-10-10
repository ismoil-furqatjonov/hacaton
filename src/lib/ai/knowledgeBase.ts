// ============================================================
// DONOR AI KNOWLEDGE BASE — Tibbiy va Platforma Bilimlar Bazasi
// Manba: O'zbekiston Respublikasi SSV standartlari va JSST (WHO) protokollari
// Versiya: 2.1.0 | Yangilangan sana: 2026-yil mart
// ============================================================

export interface KnowledgeMetadata {
  version: string;
  lastUpdated: string;
  source: string;
  complianceDisclaimer: string;
}

export const KNOWLEDGE_METADATA: KnowledgeMetadata = {
  version: '2.1.0',
  lastUpdated: '2026-03-15',
  source: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi & JSST (WHO) qon xizmati protokollari",
  complianceDisclaimer: "AI axborot berish maqsadida ishlaydi. Tibbiy tashxis qo'ymaydi va qonning klinik mosligini yakuniy tasdiqlamaydi. Yakuniy qarorni shifokor qabul qiladi.",
};

// 1. Qon guruhlari mosligi jadvali (Eritrotsitlar va Plazma)
export interface BloodCompatibility {
  group: string;
  canDonateTo: string[];
  canReceiveFrom: string[];
  isUniversalDonor?: boolean;
  isUniversalRecipient?: boolean;
  plasmaCanDonateTo: string[];
}

export const BLOOD_COMPATIBILITY_MATRIX: Record<string, BloodCompatibility> = {
  'O-': {
    group: 'O(I) Rh-',
    canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    isUniversalDonor: true,
    plasmaCanDonateTo: ['O-'],
  },
  'O+': {
    group: 'O(I) Rh+',
    canDonateTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+'],
    plasmaCanDonateTo: ['O-', 'O+'],
  },
  'A-': {
    group: 'A(II) Rh-',
    canDonateTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-'],
    plasmaCanDonateTo: ['A-', 'O-'],
  },
  'A+': {
    group: 'A(II) Rh+',
    canDonateTo: ['A+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
    plasmaCanDonateTo: ['A+', 'A-', 'O+', 'O-'],
  },
  'B-': {
    group: 'B(III) Rh-',
    canDonateTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'B-'],
    plasmaCanDonateTo: ['B-', 'O-'],
  },
  'B+': {
    group: 'B(III) Rh+',
    canDonateTo: ['B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
    plasmaCanDonateTo: ['B+', 'B-', 'O+', 'O-'],
  },
  'AB-': {
    group: 'AB(IV) Rh-',
    canDonateTo: ['AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    plasmaCanDonateTo: ['AB-', 'A-', 'B-', 'O-'],
  },
  'AB+': {
    group: 'AB(IV) Rh+',
    canDonateTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalRecipient: true,
    plasmaCanDonateTo: ['Barcha guruhlarga (Universal plazma donori)'],
  },
};

// 2. Donorlik mezonlari va tayyorgarlik talablari
export const DONOR_ELIGIBILITY = {
  basicCriteria: {
    ageRange: '18 yoshdan 65 yoshgacha',
    minWeight: 'Kamida 50 kg',
    bloodPressure: 'Sistolik: 100-140 mm sim. ust., diastolik: 60-90 mm sim. ust.',
    pulse: 'Daqiqasiga 60 dan 90 gacha ritmik',
    hemoglobin: 'Ayollarda kamida 120 g/l, Erkaklarda kamida 130 g/l',
  },
  donationIntervals: {
    wholeBloodMen: '60 kun (yiliga ko‘pi bilan 5 marta)',
    wholeBloodWomen: '90 kun (yiliga ko‘pi bilan 4 marta)',
    plasma: '14 kun (yiliga ko‘pi bilan 12 litr)',
    platelets: '14 kun',
  },
  preparationRules: [
    "Qon topshirishdan 48 soat oldin: alkogolli ichimliklar ichmaslik.",
    "24 soat oldin: yog'li, qovurilgan, achchiq, dudlangan taomlar, tuxum va sut mahsulotlaridan tiyilish.",
    "72 soat oldin: aspirin, analgin va qonni suyultiruvchi dorilarni qabul qilmaslik.",
    "1 soat oldin: tamaki chekmaslik.",
    "Topshirish kuni ertalab: yengil nonushta (shirin choy, pechenye, bo'tqa) va kamida 1-1.5 litr suv ichish.",
    "Pasport yoki ID-kartani o'zi bilan olib kelish shart.",
  ],
  contraindications: {
    absolute: [
      "OIV (OITS / HIV) infeksiyasi",
      "Gepatit B va C",
      "Sifilis, sil (tuberkulyoz)",
      "Xavfli o'smalar (onkologiya)",
      "Yurak-qon tomir tizimining og'ir kasalliklari",
      "Ruhiy kasalliklar va giyohvandlik",
    ],
    temporary: [
      "Gripp, O‘RVI, shamollash: tuzalgandan so‘ng 10 kun",
      "Antibiotiklar qabul qilingandan so‘ng: 14 kun",
      "Tatu, pirsing, akupunktura: 6 oydan 1 yilgacha",
      "Tish oldirish: 10 kun",
      "Homiladorlik va laktatsiya davri: tug'ruqdan keyin 1 yil, emizish to'xtagach 3 oy",
      "Vaksinalar (jonli): 1 oy",
    ],
  },
};

// 3. O'zbekiston Qon Quyish Markazlari (Bog'lanish ma'lumotlari)
export const UZBEKISTAN_BLOOD_CENTERS = [
  {
    name: "Respublika Qon Quyish Markazi",
    city: "Toshkent shahri",
    address: "Yakkasaroy tumani, Shota Rustaveli ko'chasi, 138-uy",
    phone: "+998 71 250-38-80",
    workHours: "Dush-Juma: 08:30 - 14:00",
    emergency: "24/7 qabul bo'limi",
  },
  {
    name: "Toshkent Shahar Qon Quyish Stansiyasi",
    city: "Toshkent shahri",
    address: "Chilonzor tumani, Bunyodkor shoh ko'chasi",
    phone: "+998 71 278-23-45",
    workHours: "Dush-Juma: 08:30 - 13:00",
  },
  {
    name: "Samarqand Viloyat Qon Quyish Markazi",
    city: "Samarqand",
    address: "Dahbed ko'chasi, 42-uy",
    phone: "+998 66 235-12-80",
    workHours: "Dush-Shanba: 08:30 - 14:00",
  },
  {
    name: "Farg'ona Viloyat Qon Quyish Markazi",
    city: "Farg'ona",
    address: "Al-Farg'oniy ko'chasi, 78-uy",
    phone: "+998 73 224-55-60",
    workHours: "Dush-Juma: 08:30 - 14:00",
  },
];

// 4. DONOR Platformasi Funksiyalari bo'yicha qo'llanma
export const PLATFORM_GUIDE = {
  about: "DONOR — O'zbekistonda qon donorlari, resipiyentlar va shifoxonalarni tezkor bog'lovchi milliy ijtimoiy platforma. Slogan: 'Bir donor — bir hayot.'",
  features: {
    map: "Interaktiv Xarita (/map) — hududingizdagi tayyor donorlarni qon guruhi va masofa bo'yicha filtrlab topish.",
    requests: "Qon So'rovlari (/request) — SOS shoshilinch yoki rejali qon so'rovlarini joylashtirish va donorlar javobini qabul qilish.",
    medications: "Dori Eslatmasi (/medications) — kunlik dori-darmonlar jadvali va brauzer orqali eslatmalar olish.",
    hospital: "Shifoxona Portali (/hospital) — klinika qon zaxiralarini boshqarish va tezkor talabnoma yuborish.",
    ai: "DONOR AI (/ai) — donorlik qoidalari, tibbiy ko'rsatmalar va platforma bo'yicha sun'iy intellekt konsultanti.",
    profile: "Profil (/profile) — donorlik maqomi (Tayyor, Band, Faol emas), qon guruhi va topshirish tarixini boshqarish.",
    admin: "Admin Paneli (/admin) — so'rovlarni moderatsiya qilish, xavfsizlik va audit nazorati.",
  },
  privacyRules: "Foydalanuvchilarning aniq yashash manzili hech qachon xaritada ko'rsatilmaydi (faqat umumiy tuman/koordinatalar radiusi). Shaxsiy telefon raqamlari faqat ikkala tomon hamkorlikka rozi bo'lganda ochiladi.",
};
