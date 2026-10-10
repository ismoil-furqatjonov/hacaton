// ============================================================
// DONOR AI AGENT ENGINE — Aqlli Yordamchi Tizimi
// Ko'p tilli (O'zbek, Rus, Ingliz), Kontekstni saqlovchi va Tool Calling
// ============================================================

import {
  BLOOD_COMPATIBILITY_MATRIX,
  DONOR_ELIGIBILITY,
  UZBEKISTAN_BLOOD_CENTERS,
  PLATFORM_GUIDE,
  KNOWLEDGE_METADATA,
} from './knowledgeBase';
import {
  toolSearchDonors,
  toolGetBloodRequests,
  prepareBloodRequestCreation,
} from './agentTools';
import type { ToolExecutionResult, BloodRequestPayload } from './agentTools';
import type { AIAction, Profile, BloodGroup } from '../../types';

export type DetectedLanguage = 'uz' | 'ru' | 'en';

export interface AgentContext {
  lastIntent?: string;
  selectedBloodGroup?: string;
  selectedRegion?: string;
  pendingConfirmation?: BloodRequestPayload | null;
}

export interface AgentResponse {
  language: DetectedLanguage;
  response: string;
  actions?: AIAction[];
  toolResult?: ToolExecutionResult;
  requiresConfirmation?: boolean;
  confirmationData?: BloodRequestPayload;
  disclaimer: string;
}

// 1. Tilni aniqlash (Uzbek, Russian, English)
export function detectLanguage(text: string): DetectedLanguage {
  const lower = text.toLowerCase();
  
  // Russian markers (Cyrillic or common Russian words)
  const cyrillicRegex = /[\u0400-\u04FF]/;
  if (cyrillicRegex.test(text) || /\b(nujna|krov|donor|pomosh|gde|kak|stat)\b/i.test(text)) {
    return 'ru';
  }

  // English markers
  const englishWords = ['blood', 'donor', 'need', 'help', 'search', 'how', 'where', 'eligible', 'find', 'urgent', 'hospital'];
  const words = lower.split(/\s+/);
  const enCount = words.filter(w => englishWords.includes(w)).length;
  if (enCount >= 1 && !lower.includes('kerak') && !lower.includes('qon') && !lower.includes('bormi')) {
    return 'en';
  }

  return 'uz'; // Default: Uzbek
}

// 2. Qon guruhini matndan aniqlash
export function extractBloodGroup(text: string): BloodGroup | null {
  const normalized = text.toUpperCase().replace(/\s+/g, '');
  if (normalized.includes('AB+')) return 'AB+';
  if (normalized.includes('AB-')) return 'AB-';
  if (normalized.includes('A+')) return 'A+';
  if (normalized.includes('A-')) return 'A-';
  if (normalized.includes('B+')) return 'B+';
  if (normalized.includes('B-')) return 'B-';
  if (normalized.includes('O+') || normalized.includes('0+')) return 'O+';
  if (normalized.includes('O-') || normalized.includes('0-')) return 'O-';
  
  // Rim raqamlari yoki 1, 2, 3, 4
  if (text.includes('1-guruh') || text.includes('1 guruh') || text.includes('birinchi')) return 'O+';
  if (text.includes('2-guruh') || text.includes('2 guruh') || text.includes('ikkinchi')) return 'A+';
  if (text.includes('3-guruh') || text.includes('3 guruh') || text.includes('uchinchi')) return 'B+';
  if (text.includes('4-guruh') || text.includes('4 guruh') || text.includes('to\'rtinchi')) return 'AB+';

  return null;
}

// 3. Hududni aniqlash
export function extractRegion(text: string): string | null {
  const lower = text.toLowerCase();
  const regions = [
    'toshkent', 'samarqand', 'samarkand', 'andijon', 'farg\'ona', 'fergana',
    'namangan', 'buxoro', 'bukhara', 'xorazm', 'navoiy', 'qashqadaryo',
    'surxondaryo', 'jizzax', 'sirdaryo', 'qoraqalpog\'iston'
  ];
  for (const r of regions) {
    if (lower.includes(r)) {
      return r.charAt(0).toUpperCase() + r.slice(1);
    }
  }
  return null;
}

// 4. Asosiy AI Agent protsessori
export async function processUserMessage(
  message: string,
  context: AgentContext,
  userProfile: Profile | null,
  signal?: AbortSignal
): Promise<AgentResponse> {
  if (signal?.aborted) {
    throw new Error('So\'rov bekor qilindi (Timeout)');
  }

  const lang = detectLanguage(message);
  const lower = message.toLowerCase();
  const disclaimer = KNOWLEDGE_METADATA.complianceDisclaimer;

  // ----------------------------------------------------
  // Favqulodda tibbiy holatlar (103 Tez Yordam)
  // ----------------------------------------------------
  const dangerKeywordsUz = ['hushsizlik', 'nafas olmayapti', 'yurak to\'xtadi', 'og\'ir qon ketish', 'jonlantirish', 'reanimatsiya'];
  const dangerKeywordsRu = ['без сознания', 'не дышит', 'остановка сердца', 'сильное кровотечение', 'реанимация', '103'];
  const dangerKeywordsEn = ['unconscious', 'not breathing', 'heart stopped', 'severe bleeding', 'emergency call'];

  if (
    dangerKeywordsUz.some(k => lower.includes(k)) ||
    dangerKeywordsRu.some(k => lower.includes(k)) ||
    dangerKeywordsEn.some(k => lower.includes(k))
  ) {
    if (lang === 'ru') {
      return {
        language: 'ru',
        response: `🚨 **ВНИМАНИЕ! КРИТИЧЕСКАЯ СИТУАЦИЯ!**\n\nНемедленно вызовите экстренные службы:\n📞 **103** — Скорая медицинская помощь Узбекистана\n📞 **112 / 101** — Служба спасения\n\nНе ждите ответа в чате, жизнь человека в опасности!`,
        actions: [{ label: '📞 Позвонить 103', action: 'call', data: { number: '103' } }],
        disclaimer,
      };
    } else if (lang === 'en') {
      return {
        language: 'en',
        response: `🚨 **EMERGENCY! CRITICAL CONDITION!**\n\nPlease call emergency services immediately:\n📞 **103** — Uzbekistan Ambulance\n📞 **112** — General Emergency\n\nDo not rely on AI for immediate life-threatening situations!`,
        actions: [{ label: '📞 Call 103 Ambulance', action: 'call', data: { number: '103' } }],
        disclaimer,
      };
    }
    return {
      language: 'uz',
      response: `🚨 **DIQQAT! SHOSHILINCH TIBBIY YORDAM KERAK!**\n\nHayot uchun xavfli holatda darhol tez yordamga qo'ng'iroq qiling:\n📞 **103** — Tez tibbiy yordam (bepul)\n📞 **112 / 101** — Qutqaruv xizmati\n\nAI bilan yozishishni to'xtatib, mutaxassisga murojaat qiling!`,
      actions: [{ label: '📞 103 Tez Yordamga qo\'ng\'iroq', action: 'call', data: { number: '103' } }],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Qon guruhlari mosligi (Compatibility)
  // ----------------------------------------------------
  const bgMatch = extractBloodGroup(message);
  const isCompatQuery =
    lower.includes('mos') || lower.includes('kimga ber') || lower.includes('kimdan ol') ||
    lower.includes('совместим') || lower.includes('кому под') ||
    lower.includes('compatib') || lower.includes('who can');

  if (isCompatQuery || (bgMatch && (lower.includes('guruh') || lower.includes('групп')))) {
    const targetGroup = bgMatch || context.selectedBloodGroup || (userProfile?.blood_group as BloodGroup) || 'O+';
    const compat = BLOOD_COMPATIBILITY_MATRIX[targetGroup];

    if (compat) {
      if (lang === 'ru') {
        return {
          language: 'ru',
          response: `🩸 **Совместимость группы крови ${compat.group}:**\n\n` +
            `✅ **Кому можно сдавать кровь:** ${compat.canDonateTo.join(', ')}\n` +
            `📥 **От кого можно принимать кровь:** ${compat.canReceiveFrom.join(', ')}\n\n` +
            (compat.isUniversalDonor ? '🌟 *Универсальный донор эритроцитов (подходит всем)!*\n' : '') +
            (compat.isUniversalRecipient ? '🌟 *Универсальный реципиент (может принимать от всех)!*\n' : '') +
            `\nХотите найти доноров или открыть карту?`,
          actions: [
            { label: '🗺️ Найти на карте', action: 'navigate', data: { path: '/map' } },
            { label: '🚨 Создать заявку', action: 'navigate', data: { path: '/request' } },
          ],
          disclaimer,
        };
      }

      return {
        language: 'uz',
        response: `🩸 **${compat.group} qon guruhi mosligi:**\n\n` +
          `✅ **Kimlarga qon bera oladi:** ${compat.canDonateTo.join(', ')}\n` +
          `📥 **Kimlardan qon qabul qila oladi:** ${compat.canReceiveFrom.join(', ')}\n\n` +
          (compat.isUniversalDonor ? '🌟 *O(I) Rh- universal donor hisoblanadi (barcha guruhlarga mos keladi)!*\n' : '') +
          (compat.isUniversalRecipient ? '🌟 *AB(IV) Rh+ universal resipiyent hisoblanadi (barcha guruhlardan qabul qila oladi)!*\n' : '') +
          `\nUshbu guruh bo'yicha donor qidirmoqchimisiz?`,
        actions: [
          { label: `🔍 ${targetGroup} donorlarni izlash`, action: 'search_donors', data: { blood_group: targetGroup } },
          { label: '🗺️ Xaritani ochish', action: 'navigate', data: { path: '/map' } },
        ],
        disclaimer,
      };
    }
  }

  // ----------------------------------------------------
  // Qon donorligi tayyorgarligi va talablari (Eligibility)
  // ----------------------------------------------------
  if (
    lower.includes('tayyor') || lower.includes('qoidalar') || lower.includes('kim donor') ||
    lower.includes('qanday topshir') || lower.includes('vazn') || lower.includes('yosh') ||
    lower.includes('подготовк') || lower.includes('требован') || lower.includes('правила') ||
    lower.includes('prepare') || lower.includes('eligib') || lower.includes('requirement')
  ) {
    if (lang === 'ru') {
      return {
        language: 'ru',
        response: `📋 **Основные требования к донорам в Узбекистане:**\n\n` +
          `• Возраст: от 18 до 65 лет\n` +
          `• Вес: не менее 50 кг\n` +
          `• Интервал: для мужчин — 60 дней, для женщин — 90 дней\n\n` +
          `☕ **Подготовка за 48 часов:**\n` +
          `• Исключить алкоголь за 48 ч, жирную пищу за 24 ч.\n` +
          `• Утром лёгкий завтрак (сладкий чай, каша) и паспорт с собой!`,
        actions: [
          { label: '👤 Стать донором (Профиль)', action: 'navigate', data: { path: '/profile' } },
          { label: '🏥 Центры переливания', action: 'show_centers' },
        ],
        disclaimer,
      };
    }

    return {
      language: 'uz',
      response: `📋 **Qon donorligiga tayyorgarlik va talablar (SSV mezonlari):**\n\n` +
        `• **Yosh:** 18 yoshdan 65 yoshgacha\n` +
        `• **Vazn:** Kamida 50 kg\n` +
        `• **Oraliq muddat:** Erkaklar har 60 kunda, Ayollar har 90 kunda topshirishi mumkin.\n\n` +
        `🥣 **Tayyorgarlik qoidalari:**\n` +
        `• 48 soat oldin: spirtli ichimliklar ichilmaydi.\n` +
        `• 24 soat oldin: yog'li, qovurilgan va sut mahsulotlaridan tiyiling.\n` +
        `• Topshirish kuni ertalab: shirin choy, yengil pishiriq yoki bo'tqa iste'mol qiling va pasport/ID-kartangizni unutmang!`,
      actions: [
        { label: '❤️ Donor bo\'lish (Profil)', action: 'navigate', data: { path: '/profile' } },
        { label: '🏥 Qon markazlari ro\'yxati', action: 'show_centers' },
      ],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Qon kerak / SOS so'rovi (Need Blood & Request Creation)
  // ----------------------------------------------------
  if (
    lower.includes('qon kerak') || lower.includes('donor kerak') || lower.includes('sos') ||
    lower.includes('нужна кровь') || lower.includes('ищу донора') ||
    lower.includes('need blood') || lower.includes('emergency blood')
  ) {
    const group = bgMatch || context.selectedBloodGroup || (userProfile?.blood_group as BloodGroup);
    const region = extractRegion(message) || context.selectedRegion || userProfile?.region || 'Toshkent shahri';

    if (!group) {
      // Aniqlashtiruvchi savol
      return {
        language: lang,
        response: lang === 'ru'
          ? `🩸 Какая группа крови требуется? (Например: A+, B+, O+, AB+)`
          : `🩸 Qaysi qon guruhi kerak? Aniqlashtirib bersangiz, darhol eng yaqin donorlarni topib beraman. (Masalan: O+, A+, B+, AB+)`,
        actions: [
          { label: 'O(I)+', action: 'select_blood_group', data: { group: 'O+' } },
          { label: 'A(II)+', action: 'select_blood_group', data: { group: 'A+' } },
          { label: 'B(III)+', action: 'select_blood_group', data: { group: 'B+' } },
          { label: 'AB(IV)+', action: 'select_blood_group', data: { group: 'AB+' } },
        ],
        disclaimer,
      };
    }

    // Donorlarni qidirish va so'rov tayyorlash
    const searchRes = await toolSearchDonors({ blood_group: group, region });
    const prepRes = prepareBloodRequestCreation({
      blood_group: group,
      region,
      urgency: 'critical',
      quantity_units: 2,
      contact_phone: userProfile?.phone || "+998 90 000 00 00",
    });

    const foundCount = Array.isArray(searchRes.data) ? searchRes.data.length : 0;

    return {
      language: lang,
      response: lang === 'ru'
        ? `🚨 **Запрос принят: Группа ${group}, регион ${region}**\n\n` +
          `🔍 Найдено потенциальных доноров: **${foundCount} человек**.\n` +
          `Хотите опубликовать экстренную SOS заявку для уведомления доноров?`
        : `🚨 **Shoshilinch so'rov: ${group} guruhi, ${region}**\n\n` +
          `🔍 Hududda topilgan mos donorlar: **${foundCount} nafar**.\n\n` +
          `Yaqin atrofdagi barcha donorlarga SMS/bildirishnoma jo'natish uchun quyidagi SOS so'rovni tasdiqlaysizmi?`,
      requiresConfirmation: true,
      confirmationData: prepRes.confirmationPayload,
      toolResult: searchRes,
      actions: [
        { label: '🗺️ Xaritada ko\'rish', action: 'navigate', data: { path: '/map' } },
        { label: '📋 Barcha so\'rovlar', action: 'navigate', data: { path: '/request' } },
      ],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Donorlarni xaritadan qidirish (Search Donors)
  // ----------------------------------------------------
  if (
    lower.includes('qidir') || lower.includes('topish') || lower.includes('donorlar') ||
    lower.includes('поиск') || lower.includes('найти') ||
    lower.includes('search') || lower.includes('find')
  ) {
    const group = bgMatch || context.selectedBloodGroup;
    const region = extractRegion(message) || context.selectedRegion;
    const searchRes = await toolSearchDonors({ blood_group: group, region, status: 'available' });
    const activeCount = Array.isArray(searchRes.data) ? searchRes.data.length : 0;

    return {
      language: lang,
      response: lang === 'ru'
        ? `🔍 **Результаты поиска доноров:**\n\n` +
          `Найдено активных доноров: **${activeCount}**\n` +
          `Вы можете отправить им запрос или посмотреть на карте.`
        : `🔍 **Donorlar qidiruvi natijasi:**\n\n` +
          `Faol donorlar soni: **${activeCount} nafar**.\n` +
          `Ularning joylashuvini xaritada ko'rishingiz yoki to'g'ridan-to'g'ri so'rov yuborishingiz mumkin.`,
      toolResult: searchRes,
      actions: [
        { label: '🗺️ Interaktiv xaritani ochish', action: 'navigate', data: { path: '/map' } },
        { label: '🚨 Qon so\'rovi yaratish', action: 'navigate', data: { path: '/request' } },
      ],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Qon markazlari va aloqa (Blood Centers)
  // ----------------------------------------------------
  if (
    lower.includes('markaz') || lower.includes('stansiya') || lower.includes('manzil') ||
    lower.includes('центр') || lower.includes('станци') || lower.includes('адрес') ||
    lower.includes('center') || lower.includes('clinic')
  ) {
    const list = UZBEKISTAN_BLOOD_CENTERS.map(c => `📍 **${c.name}**\n   Manzil: ${c.address}\n   Tel: ${c.phone}\n   Ish vaqti: ${c.workHours}`).join('\n\n');
    return {
      language: lang,
      response: `🏥 **O'zbekiston Qon Quyish Markazlari:**\n\n${list}\n\nFavqulodda vaziyatda har doim **103** raqamiga qo'ng'iroq qilishingiz mumkin.`,
      actions: [
        { label: '🏥 Shifoxona portaliga o\'tish', action: 'navigate', data: { path: '/hospital' } },
      ],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Dori eslatmalari va tasdiqlangan dorilar (Medications)
  // Qoida: AI o'zicha dori qo'sha olmaydi yoki retsept yoza olmaydi!
  // ----------------------------------------------------
  if (
    lower.includes('dori') || lower.includes('tabletka') || lower.includes('preparat') ||
    lower.includes('лекарств') || lower.includes('таблетк') || lower.includes('препарат') ||
    lower.includes('medicat') || lower.includes('pill')
  ) {
    return {
      language: lang,
      response: lang === 'ru'
        ? `💊 **Напоминания о лекарствах и каталог:**\n\n` +
          `⚠️ **Важное правило безопасности:** AI не назначает лечение и не может автоматически добавлять лекарства в базу данных.\n\n` +
          `Вы можете вручную составить личный график приёма назначенных врачом препаратов на странице **«Dori Eslatmasi»**.\n` +
          `Официальные препараты для доноров (железо, витамины) регулируются только врачом и администратором.`
        : `💊 **Dori vositalari va eslatmalar:**\n\n` +
          `⚠️ **Qat'iy xavfsizlik qoidasi:** AI mustaqil ravishda yangi dori yarata olmaydi, retsept yozmaydi va bazaga o'zicha dori saqlamaydi.\n\n` +
          `Shifokor tomonidan tayinlangan preparatlarni shaxsan o'zingiz **«Dori eslatmasi»** sahifasida qo'lda jadvalga kiritishingiz mumkin.\n` +
          `Rasmiy tasdiqlangan dorilar katalogi faqat mutaxassislar va adminlar tomonidan yuritiladi.`,
      actions: [
        { label: '💊 Dori eslatmasiga o\'tish', action: 'navigate', data: { path: '/medications' } },
        { label: '🛡️ Qoidalarni ko\'rish', action: 'ask_rules' },
      ],
      disclaimer,
    };
  }

  // ----------------------------------------------------
  // Platforma va sahifalar bo'yicha yordam (General Platform Help)
  // ----------------------------------------------------
  return {
    language: lang,
    response: lang === 'ru'
      ? `👋 Здравствуйте! Я интеллектуальный ассистент платформы **DONOR**.\n\n` +
        `Чем я могу вам помочь?\n` +
        `• Поиск доноров крови по вашей группе и региону\n` +
        `• Создание экстренной SOS заявки\n` +
        `• Проверка совместимости групп крови\n` +
        `• Консультация по подготовке к донорству (стандарты Минздрава)\n` +
        `• Работа с картой доноров, порталом больницы и напоминаниями о лекарствах.`
      : `👋 Assalomu alaykum! Men **DONOR** platformasining rasmiy intellektual yordamchisiman.\n\n` +
        `Sizga quyidagi amallarda yordam bera olaman:\n` +
        `• 🔍 Kerakli guruh va hudud bo'yicha **donorlarni topish**\n` +
        `• 🚨 **SOS qon so'rovini** shakllantirish va e'lon qilish\n` +
        `• 🩸 **Qon guruhlari mosligini** tekshirish\n` +
        `• 📋 **Donorlikka tayyorgarlik** va qoidalarni o'rganish\n` +
        `• 🏥 Shifoxona portali, dori eslatmalari va xaritadan foydalanish.`,
    actions: [
      { label: '🩸 Qon guruhim mosligi', action: 'ask_compat' },
      { label: '🔍 Donor qidirish', action: 'navigate', data: { path: '/map' } },
      { label: '🚨 SOS so\'rov yaratish', action: 'navigate', data: { path: '/request' } },
      { label: '💊 Dori eslatmasi', action: 'navigate', data: { path: '/medications' } },
    ],
    disclaimer,
  };
}
