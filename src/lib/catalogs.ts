// ============================================================
// DONOR PLATFORM — TASDIQLANGAN KATALOGLAR VA MA'LUMOTLAR NAZORATI
// Qoida: Tizim yoki AI o'zicha avtomatik ma'lumot qo'sha olmaydi.
// Faqat admin yoki vakolatli foydalanuvchi qo'lda kiritgan ma'lumotlar saqlanadi.
// Supabase real-time DB sinxronlash + Offline kesh
// ============================================================

import type { BloodGroup, Profile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export interface ApprovedBloodGroupItem {
  code: BloodGroup;
  label: string;
  description: string;
  is_active: boolean;
  added_by: string;
  added_at: string;
}

export interface ApprovedMedicationItem {
  id: string;
  name: string;
  category: string;
  standard_dosage: string;
  contraindications: string;
  is_approved: boolean;
  added_by: string;
  added_at: string;
}

// 1. Rasmiy tasdiqlangan biologik qon guruhlari (Default Catalog)
export const DEFAULT_APPROVED_BLOOD_GROUPS: ApprovedBloodGroupItem[] = [
  { code: 'O-', label: 'O(I) Rh-', description: 'Universal donor (barcha guruhlarga beradi)', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'O+', label: 'O(I) Rh+', description: 'Musbat birinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'A-', label: 'A(II) Rh-', description: 'Manfiy ikkinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'A+', label: 'A(II) Rh+', description: 'Musbat ikkinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'B-', label: 'B(III) Rh-', description: 'Manfiy uchinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'B+', label: 'B(III) Rh+', description: 'Musbat uchinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'AB-', label: 'AB(IV) Rh-', description: 'Manfiy to\'rtinchi guruh', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
  { code: 'AB+', label: 'AB(IV) Rh+', description: 'Universal resipiyent (barchadan oladi)', is_active: true, added_by: 'Tizim standarti (SSV)', added_at: '2026-01-01' },
];

// 2. Rasmiy tasdiqlangan dorilar katalogi (Faqat admin qo'sha oladi)
export const DEFAULT_APPROVED_MEDICATIONS: ApprovedMedicationItem[] = [
  { id: 'med-1', name: 'Fersinol', category: 'Temir preparati (Gemoglobin uchun)', standard_dosage: '1 kapsula kuniga 1 mahal', contraindications: 'Gemoxromatoz, o\'tkir qon ketishlar', is_approved: true, added_by: 'Bosh mutaxassis', added_at: '2026-02-10' },
  { id: 'med-2', name: 'Sorbifer Durules', category: 'Anemiyaga qarshi temir kompleksi', standard_dosage: '1 tabletka kuniga 2 mahal ovqatdan oldin', contraindications: 'Qizilo\'ngach torayishi', is_approved: true, added_by: 'Bosh mutaxassis', added_at: '2026-02-10' },
  { id: 'med-3', name: 'Foliy kislotasi (B9)', category: 'Qon hosil bo\'lishini yaxshilovchi vitamin', standard_dosage: '1 mg kuniga 1 mahal', contraindications: 'Malignant anemiya', is_approved: true, added_by: 'Bosh mutaxassis', added_at: '2026-02-15' },
  { id: 'med-4', name: 'Vitamin D3 (Akvadetrim)', category: 'Immunitet va kalsiy almashinuvi', standard_dosage: '2000 XB kuniga 1 mahal', contraindications: 'Giperkalsiemiya', is_approved: true, added_by: 'Bosh mutaxassis', added_at: '2026-02-15' },
];

// ============================================================
// QON GURUHLARI BOSHQARUVI
// ============================================================

export function getApprovedBloodGroups(): ApprovedBloodGroupItem[] {
  const saved = localStorage.getItem('donor_approved_blood_groups');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
  }
  return DEFAULT_APPROVED_BLOOD_GROUPS;
}

export async function fetchApprovedBloodGroups(): Promise<ApprovedBloodGroupItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('approved_blood_groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted: ApprovedBloodGroupItem[] = data.map((d: { code: string; label: string; description?: string; is_active?: boolean; created_at?: string }) => ({
          code: d.code as BloodGroup,
          label: d.label,
          description: d.description || '',
          is_active: d.is_active ?? true,
          added_by: 'Admin / SSV',
          added_at: d.created_at ? d.created_at.split('T')[0] : '2026-01-01',
        }));
        localStorage.setItem('donor_approved_blood_groups', JSON.stringify(formatted));
        return formatted;
      }
    } catch {
      // Offline fallback
    }
  }
  return getApprovedBloodGroups();
}

export function isValidBloodGroup(group: string): boolean {
  const list = getApprovedBloodGroups();
  return list.some(item => item.is_active && item.code === group);
}

export async function addBloodGroupAdmin(
  newGroup: { code: string; label: string; description: string },
  currentUser: Profile | null,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): Promise<{ success: boolean; message: string }> {
  if (!currentUser || !currentUser.is_admin) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Доступ запрещен: Только системный администратор может добавлять группы крови!"
        : lang === 'en'
        ? "Permission denied: Only system administrators can add blood groups!"
        : "Ruxsat etilmadi: Yangi qon guruhini faqat tizim admini qo'shishi mumkin!",
    };
  }

  const code = newGroup.code.trim().toUpperCase() as BloodGroup;
  const current = getApprovedBloodGroups();
  if (current.some(g => g.code === code)) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Эта группа крови уже существует в каталоге!"
        : lang === 'en'
        ? "This blood group already exists in the catalog!"
        : "Ushbu qon guruhi allaqachon mavjud!",
    };
  }

  const newItem: ApprovedBloodGroupItem = {
    code,
    label: newGroup.label.trim(),
    description: newGroup.description.trim(),
    is_active: true,
    added_by: currentUser.full_name || 'Admin',
    added_at: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newItem];
  localStorage.setItem('donor_approved_blood_groups', JSON.stringify(updated));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('approved_blood_groups').insert({
        code: newItem.code,
        label: newItem.label,
        description: newItem.description,
        created_by: currentUser.id,
      });
    } catch {
      // Localda allaqachon saqlandi
    }
  }

  return {
    success: true,
    message: lang === 'ru'
      ? `✅ Новая группа крови (${code}) успешно подтверждена и добавлена.`
      : lang === 'en'
      ? `✅ New blood group (${code}) has been approved and added.`
      : `✅ Yangi qon guruhi (${code}) tasdiqlandi va ro'yxatga kiritildi.`,
  };
}

// ============================================================
// DORILAR KATALOGI BOSHQARUVI
// ============================================================

export function getApprovedMedicationsCatalog(): ApprovedMedicationItem[] {
  const saved = localStorage.getItem('donor_approved_medications_catalog');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* ignore */ }
  }
  return DEFAULT_APPROVED_MEDICATIONS;
}

export async function fetchApprovedMedicationsCatalog(): Promise<ApprovedMedicationItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('approved_medications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: ApprovedMedicationItem[] = data.map((d: { id: string; name: string; category: string; standard_dosage?: string; contraindications?: string; is_approved?: boolean; created_at?: string }) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          standard_dosage: d.standard_dosage || '',
          contraindications: d.contraindications || '',
          is_approved: d.is_approved ?? true,
          added_by: 'Bosh mutaxassis',
          added_at: d.created_at ? d.created_at.split('T')[0] : '2026-02-10',
        }));
        localStorage.setItem('donor_approved_medications_catalog', JSON.stringify(formatted));
        return formatted;
      }
    } catch {
      // Offline fallback
    }
  }
  return getApprovedMedicationsCatalog();
}

export async function addMedicationAdmin(
  med: { name: string; category: string; standard_dosage: string; contraindications: string },
  currentUser: Profile | null,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): Promise<{ success: boolean; message: string }> {
  if (!currentUser || !currentUser.is_admin) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Доступ запрещен: Только администратор может добавлять препараты в каталог!"
        : lang === 'en'
        ? "Permission denied: Only administrators can add medications to the official catalog!"
        : "Ruxsat etilmadi: Rasmiy dorilar katalogiga faqat admin qo'lda dori qo'sha oladi!",
    };
  }

  const name = med.name.trim();
  if (!name) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Название лекарства не может быть пустым!"
        : lang === 'en'
        ? "Medication name cannot be empty!"
        : "Dori nomi bo'sh bo'lishi mumkin emas!",
    };
  }

  const current = getApprovedMedicationsCatalog();
  if (current.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Этот препарат уже присутствует в каталоге!"
        : lang === 'en'
        ? "This medication already exists in the catalog!"
        : "Ushbu dori katalogda allaqachon mavjud!",
    };
  }

  const newItem: ApprovedMedicationItem = {
    id: `med-${Date.now()}`,
    name,
    category: med.category.trim(),
    standard_dosage: med.standard_dosage.trim(),
    contraindications: med.contraindications.trim(),
    is_approved: true,
    added_by: currentUser.full_name || 'Admin',
    added_at: new Date().toISOString().split('T')[0],
  };

  const updated = [newItem, ...current];
  localStorage.setItem('donor_approved_medications_catalog', JSON.stringify(updated));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('approved_medications').insert({
        name: newItem.name,
        category: newItem.category,
        standard_dosage: newItem.standard_dosage,
        contraindications: newItem.contraindications,
        created_by: currentUser.id,
      });
    } catch {
      // Localda allaqachon saqlandi
    }
  }

  return {
    success: true,
    message: lang === 'ru'
      ? `✅ Новый препарат (${name}) успешно внесен в официальный каталог.`
      : lang === 'en'
      ? `✅ Medication (${name}) has been officially added to catalog.`
      : `✅ Dori (${name}) rasmiy katalogga kiritildi.`,
  };
}

export async function deleteMedicationAdmin(
  id: string,
  currentUser: Profile | null,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): Promise<{ success: boolean; message: string }> {
  if (!currentUser || !currentUser.is_admin) {
    return {
      success: false,
      message: lang === 'ru'
        ? "Только администратор может удалять препараты из каталога!"
        : lang === 'en'
        ? "Only administrators can remove medications from the catalog!"
        : "Faqat admin dorini katalogdan o'chira oladi!",
    };
  }

  const current = getApprovedMedicationsCatalog();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem('donor_approved_medications_catalog', JSON.stringify(updated));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('approved_medications').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: lang === 'ru'
      ? "Препарат успешно удален из каталога."
      : lang === 'en'
      ? "Medication removed from catalog."
      : "Dori katalogdan o'chirildi.",
  };
}
