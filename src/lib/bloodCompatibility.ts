// ============================================================
// DONOR PLATFORM — TIBBIY QON MOSLIGI TIZIMI (ABO & Rh tizimi)
// Manba: SSV qon quyish standartlari va JSST (WHO) protokoli
// ============================================================

import type { BloodGroup } from '../types';

export interface CompatibilityInfo {
  group: BloodGroup;
  title: string;
  canGiveTo: BloodGroup[];
  canReceiveFrom: BloodGroup[];
  isUniversalDonor: boolean;
  isUniversalRecipient: boolean;
  description: string;
}

/**
 * Biologik eritrotsitlar mosligi matritsasi
 */
export const BLOOD_COMPATIBILITY_TABLE: Record<BloodGroup, CompatibilityInfo> = {
  'O-': {
    group: 'O-',
    title: 'O(I) Rh- manfiy',
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    isUniversalDonor: true,
    isUniversalRecipient: false,
    description: "Universal donor — eritrotsitlari barcha 8 ta guruhdagi bemorlarga to'g'ri keladi. Faqat O- guruhidan qon qabul qila oladi.",
  },
  'O+': {
    group: 'O+',
    title: 'O(I) Rh+ musbat',
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "Barcha musbat qon guruhlariga (O+, A+, B+, AB+) bera oladi. O- va O+ guruhlaridan qon qabul qiladi.",
  },
  'A-': {
    group: 'A-',
    title: 'A(II) Rh- manfiy',
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "A va AB guruhlariga (manfiy va musbat) bera oladi. O- va A- guruhlaridan qabul qila oladi.",
  },
  'A+': {
    group: 'A+',
    title: 'A(II) Rh+ musbat',
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "A+ va AB+ guruhlariga bera oladi. O-, O+, A-, A+ guruhlaridan qon qabul qila oladi.",
  },
  'B-': {
    group: 'B-',
    title: 'B(III) Rh- manfiy',
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-', 'B-'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "B va AB guruhlariga (manfiy va musbat) bera oladi. O- va B- guruhlaridan qon qabul qila oladi.",
  },
  'B+': {
    group: 'B+',
    title: 'B(III) Rh+ musbat',
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['O-', 'O+', 'B-', 'B+'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "B+ va AB+ guruhlariga bera oladi. O-, O+, B-, B+ guruhlaridan qon qabul qila oladi.",
  },
  'AB-': {
    group: 'AB-',
    title: 'AB(IV) Rh- manfiy',
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'],
    isUniversalDonor: false,
    isUniversalRecipient: false,
    description: "AB- va AB+ guruhlariga bera oladi. Barcha Rh- manfiy guruhlardan (O-, A-, B-, AB-) qabul qiladi.",
  },
  'AB+': {
    group: 'AB+',
    title: 'AB(IV) Rh+ musbat',
    canGiveTo: ['AB+'],
    canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalDonor: false,
    isUniversalRecipient: true,
    description: "Universal resipiyent — barcha 8 ta guruhdan qon qabul qila oladi. Faqat AB+ guruhiga bera oladi.",
  },
};

/**
 * Donor qoni resipiyentga mos keladimi?
 */
export function canDonateBlood(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const info = BLOOD_COMPATIBILITY_TABLE[donorGroup];
  return info ? info.canGiveTo.includes(recipientGroup) : false;
}

/**
 * Ushbu resipiyentga qaysi qon guruhlari donorlik qila oladi?
 */
export function getCompatibleDonorsForRecipient(recipientGroup: BloodGroup): BloodGroup[] {
  const info = BLOOD_COMPATIBILITY_TABLE[recipientGroup];
  return info ? info.canReceiveFrom : [recipientGroup];
}

/**
 * Ushbu donor qaysi guruhdagi bemorlarga yordam bera oladi?
 */
export function getCompatibleRecipientsForDonor(donorGroup: BloodGroup): BloodGroup[] {
  const info = BLOOD_COMPATIBILITY_TABLE[donorGroup];
  return info ? info.canGiveTo : [donorGroup];
}
