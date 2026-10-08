// ============================================================
// DONOR PLATFORM — TASDIQLANGAN KATALOGLAR VA MA'LUMOTLAR NAZORATI
// Qoida: Tizim yoki AI o'zicha avtomatik ma'lumot qo'sha olmaydi.
// Faqat admin yoki vakolatli foydalanuvchi qo'lda kiritgan ma'lumotlar saqlanadi.
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

// 1. Rasmiy tasdiqlangan 8 ta biologik qon guruhi (Default Catalog)
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
// QON GURUHLARI BOSHQARUVI (Faqat Admin)
// ============================================================

export function getApprovedBloodGroups(): ApprovedBloodGroupItem[] {
  const saved = localStorage.getItem('donor_approved_blood_groups');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) { /* ignore */ }
  }
  return DEFAULT_APPROVED_BLOOD_GROUPS;
}

export function isValidBloodGroup(group: string): boolean {
  const list = getApprovedBloodGroups();
  return list.some(item => item.is_active && item.code === group);
}

export async function addBloodGroupAdmin(
  newGroup: { code: string; label: string; description: string },
  currentUser: Profile | null
): Promise<{ success: boolean; message: string }> {
  // Faqat admin ruxsatiga ega
  if (!currentUser || !currentUser.is_admin) {
    return {
      success: false,
      message: "Ruxsat etilmadi: Yangi qon guruhini faqat tizim admini qo'shishi mumkin!",
    };
  }

  const code = newGroup.code.trim().toUpperCase() as BloodGroup;
  const current = getApprovedBloodGroups();
  if (current.some(g => g.code === code)) {
    return { success: false, message: "Ushbu qon guruhi allaqachon mavjud!" };
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
    await supabase.from('approved_blood_groups').insert({
      code: newItem.code,
      label: newItem.label,
      description: newItem.description,
      created_by: currentUser.id,
    });
  }

  return { success: true, message: `✅ Yangi qon guruhi (${code}) tasdiqlandi va ro'yxatga kiritildi.` };
}

// ============================================================
// DORILAR KATALOGI BOSHQARUVI (Faqat Admin)
// ============================================================

export function getApprovedMedicationsCatalog(): ApprovedMedicationItem[] {
  const saved = localStorage.getItem('donor_approved_medications_catalog');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) { /* ignore */ }
  }
  return DEFAULT_APPROVED_MEDICATIONS;
}

export async function addMedicationAdmin(
  med: { name: string; category: string; standard_dosage: string; contraindications: string },
  currentUser: Profile | null
): Promise<{ success: boolean; message: string }> {
  // Faqat admin ruxsatiga ega
  if (!currentUser || !currentUser.is_admin) {
    return {
      success: false,
      message: "Ruxsat etilmadi: Rasmiy dorilar katalogiga faqat admin qo'lda dori qo'sha oladi!",
    };
  }

  const name = med.name.trim();
  if (!name) return { success: false, message: "Dori nomi bo'sh bo'lishi mumkin emas!" };

  const current = getApprovedMedicationsCatalog();
  if (current.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, message: "Ushbu dori katalogda allaqachon mavjud!" };
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
    await supabase.from('approved_medications').insert({
      name: newItem.name,
      category: newItem.category,
      standard_dosage: newItem.standard_dosage,
      contraindications: newItem.contraindications,
      created_by: currentUser.id,
    });
  }

  return { success: true, message: `✅ Dori (${name}) rasmiy katalogga kiritildi.` };
}

export function deleteMedicationAdmin(
  id: string,
  currentUser: Profile | null
): { success: boolean; message: string } {
  if (!currentUser || !currentUser.is_admin) {
    return { success: false, message: "Faqat admin dorini katalogdan o'chira oladi!" };
  }

  const current = getApprovedMedicationsCatalog();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem('donor_approved_medications_catalog', JSON.stringify(updated));
  return { success: true, message: "Dori katalogdan o'chirildi." };
}
