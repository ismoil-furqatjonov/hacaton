// ============================================================
// DONOR AI AGENT TOOLS & BACKEND INTEGRATION
// Xavfsiz backend funksiyalari va amallarni bajarish mexanizmi
// ============================================================

import { DEMO_DONORS, DEMO_BLOOD_REQUESTS } from '../../data/demo';
import { supabase, isSupabaseConfigured } from '../supabase';
import { isValidBloodGroup } from '../catalogs';
import type { BloodGroup, DonorStatus, UrgencyLevel, BloodRequest } from '../../types';

export interface BloodRequestPayload {
  blood_group: BloodGroup;
  region: string;
  hospital?: string;
  urgency?: UrgencyLevel;
  quantity_units?: number;
  contact_phone?: string;
}

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  message: string;
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationPayload?: BloodRequestPayload;
}

// 1. Donor qidirish (search_donors)
export async function toolSearchDonors(params: {
  blood_group?: BloodGroup | string;
  region?: string;
  status?: DonorStatus | string;
}): Promise<ToolExecutionResult> {
  try {
    let donors = DEMO_DONORS;

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('profiles').select('*').eq('is_donor', true);
      if (params.blood_group) query = query.eq('blood_group', params.blood_group);
      if (params.region) query = query.ilike('region', `%${params.region}%`);
      if (params.status) query = query.eq('donor_status', params.status);
      const { data, error } = await query.limit(10);
      if (!error && data && data.length > 0) {
        donors = data as any;
      }
    } else {
      // Local demo filtering
      donors = DEMO_DONORS.filter(d => {
        if (params.blood_group && d.blood_group !== params.blood_group) return false;
        if (params.region && !d.region.toLowerCase().includes(params.region.toLowerCase())) return false;
        if (params.status && d.status !== params.status) return false;
        return true;
      });
    }

    return {
      tool: 'search_donors',
      success: true,
      message: donors.length > 0
        ? `${donors.length} ta mos donor topildi.`
        : "Afsuski, ko'rsatilgan filtrlar bo'yicha donor topilmadi.",
      data: donors.slice(0, 5),
    };
  } catch (error: any) {
    return {
      tool: 'search_donors',
      success: false,
      message: `Donorlarni qidirishda xatolik: ${error.message || 'Noma\'lum'}`,
    };
  }
}

// 2. Qon so'rovlarini olish (get_blood_request)
export async function toolGetBloodRequests(params: {
  urgency?: UrgencyLevel | string;
  region?: string;
}): Promise<ToolExecutionResult> {
  try {
    let requests: BloodRequest[] = DEMO_BLOOD_REQUESTS;

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('blood_requests').select('*');
      if (params.urgency) query = query.eq('urgency', params.urgency);
      if (params.region) query = query.ilike('region', `%${params.region}%`);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(6);
      if (!error && data && data.length > 0) {
        requests = data as any;
      }
    } else {
      requests = DEMO_BLOOD_REQUESTS.filter((r: BloodRequest) => {
        if (params.urgency && r.urgency !== params.urgency) return false;
        if (params.region && !r.region.toLowerCase().includes(params.region.toLowerCase())) return false;
        return true;
      });
    }

    return {
      tool: 'get_blood_request',
      success: true,
      message: `${requests.length} ta faol so'rov mavjud.`,
      data: requests.slice(0, 5),
    };
  } catch (error: any) {
    return {
      tool: 'get_blood_request',
      success: false,
      message: `So'rovlarni olishda xatolik: ${error.message || 'Noma\'lum'}`,
    };
  }
}

// 3. Qon so'rovi yaratish (create_blood_request)
// MUHIM QOIDA: Foydalanuvchi tasdig'isiz bazaga kiritilmaydi!
export function prepareBloodRequestCreation(params: {
  blood_group: BloodGroup | string;
  region: string;
  hospital?: string;
  urgency: UrgencyLevel | string;
  quantity_units?: number;
  contact_phone?: string;
}): ToolExecutionResult {
  // Qoida: Faqat mavjud, tasdiqlangan qon guruhidan foydalanish
  if (!isValidBloodGroup(params.blood_group)) {
    return {
      tool: 'create_blood_request',
      success: false,
      message: `Rad etildi: "${params.blood_group}" tasdiqlangan qon guruhlari katalogida mavjud emas. AI o'zicha yangi qon guruhi yarata olmaydi.`,
    };
  }

  return {
    tool: 'create_blood_request',
    success: true,
    message: "Qon so'rovi shakllantirildi. Tasdiqlash uchun ko'rib chiqing.",
    requiresConfirmation: true,
    confirmationPayload: {
      blood_group: params.blood_group as BloodGroup,
      region: params.region,
      hospital: params.hospital || 'Markaziy shifoxona',
      urgency: (params.urgency || 'high') as UrgencyLevel,
      quantity_units: params.quantity_units || 2,
      contact_phone: params.contact_phone || "+998 90 123 45 67",
    },
  };
}

// 4. Tasdiqlangandan so'ng so'rovni kiritish
export async function executeConfirmedBloodRequest(
  payload: BloodRequestPayload,
  userId?: string
): Promise<ToolExecutionResult> {
  try {
    if (!isValidBloodGroup(payload.blood_group)) {
      return {
        tool: 'create_blood_request',
        success: false,
        message: `Xatolik: Ruxsat berilmagan qon guruhi. Faqat rasmiy tasdiqlangan qon guruhlari qabul qilinadi.`,
      };
    }

    const newRequest: BloodRequest = {
      id: `req-${Date.now()}`,
      requester_id: userId || 'demo-user-1',
      blood_group: payload.blood_group,
      quantity_units: payload.quantity_units || 1,
      region: payload.region,
      hospital: payload.hospital,
      urgency: payload.urgency || 'high',
      contact_phone: payload.contact_phone,
      status: 'searching',
      matched_donors: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && userId) {
      await supabase.from('blood_requests').insert({
        requester_id: userId,
        blood_group: payload.blood_group,
        quantity_units: payload.quantity_units,
        region: payload.region,
        hospital: payload.hospital,
        urgency: payload.urgency,
        contact_phone: payload.contact_phone,
        status: 'searching',
      });
    }

    return {
      tool: 'create_blood_request',
      success: true,
      message: `✅ So'rov muvaffaqiyatli e'lon qilindi! Mos donorlarga xabarnoma yuborilmoqda.`,
      data: newRequest,
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Noma'lum";
    return {
      tool: 'create_blood_request',
      success: false,
      message: `So'rovni yaratishda xatolik yuz berdi: ${errMessage}`,
    };
  }
}
