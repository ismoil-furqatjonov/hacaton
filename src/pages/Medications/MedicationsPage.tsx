import React, { useState, useEffect } from 'react';
import {
  Pill, Plus, Trash2, Edit, Clock, AlertCircle, Bell, CheckCircle2,
  Search, BookOpen, ShieldCheck, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApprovedMedicationsCatalog, fetchApprovedMedicationsCatalog, type ApprovedMedicationItem } from '../../lib/catalogs';
import type { MedicationReminder } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import ConfirmModal from '../../components/common/ConfirmModal';

const DAY_NAMES = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export default function MedicationsPage() {
  const { user, isDemo } = useAuth();
  const storageKey = `donor_user_medications_${user?.id || 'guest'}`;

  // Tabs: reminders yoki catalog
  const [activeTab, setActiveTab] = useState<'reminders' | 'catalog'>('reminders');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sahifa yangilanganda ham qo'lda kiritilgan ma'lumotlar saqlanadi
  const [reminders, setReminders] = useState<MedicationReminder[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return []; // Tizim o'zicha avtomatik dori qo'shmaydi!
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [approvedCatalog, setApprovedCatalog] = useState<ApprovedMedicationItem[]>(getApprovedMedicationsCatalog());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [form, setForm] = useState({
    medication_name: '',
    start_time: '08:00',
    repeat_count: 1,
    repeat_interval_minutes: 480,
    days_of_week: [1, 2, 3, 4, 5] as number[],
    is_active: true,
  });

  // Approved catalog'ni backenddan yangilash
  useEffect(() => {
    fetchApprovedMedicationsCatalog().then(setApprovedCatalog);
  }, []);

  // Brauzer eslatmasi ruxsatini so'rash
  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setErrorMsg("Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        setSuccessMsg("Brauzer dori eslatmalari faollashtirildi!");
        new Notification("DONOR Platformasi", {
          body: "Dori qabul qilish vaqti kelganda sizga eslatib turamiz.",
          icon: "/favicon.ico",
        });
      }
    } catch {
      setErrorMsg("Bildirishnoma ruxsatini olishda xatolik yuz berdi.");
    }
  };

  // LocalStorage ga avtomatik saqlash
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(reminders));
  }, [reminders, storageKey]);

  // Supabase dan yuklash (agar ulangan bo'lsa)
  useEffect(() => {
    if (!isDemo && isSupabaseConfigured && supabase && user) {
      loadRemindersFromSupabase();
    }
  }, [isDemo, user]);

  const loadRemindersFromSupabase = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReminders(data as MedicationReminder[]);
    }
    setLoading(false);
  };

  const handleSelectFromCatalog = (medName: string) => {
    setForm(prev => ({ ...prev, medication_name: medName }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Faqat vakolatli (tizimga kirgan) foydalanuvchi qo'shishi mumkin
    if (!user) {
      setErrorMsg("Dori eslatmasini qo'shish uchun avval tizimga kiring!");
      return;
    }

    if (!form.medication_name.trim()) {
      setErrorMsg("Dori nomini kiriting yoki rasmiy katalogdan tanlang!");
      return;
    }

    setLoading(true);

    if (editingId) {
      // Tahrirlash
      setReminders(prev => prev.map(r => {
        if (r.id === editingId) {
          return {
            ...r,
            ...form,
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      }));

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('medication_reminders')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editingId)
          .eq('user_id', user.id);
      }
      setSuccessMsg("Eslatma muvaffaqiyatli yangilandi!");
    } else {
      // Qo'lda yangi qo'shish
      const newReminder: MedicationReminder = {
        id: `med-${Date.now()}`,
        user_id: user.id,
        medication_name: form.medication_name.trim(),
        start_time: form.start_time,
        repeat_count: form.repeat_count,
        repeat_interval_minutes: form.repeat_interval_minutes,
        days_of_week: form.days_of_week,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setReminders(prev => [newReminder, ...prev]);

      if (isSupabaseConfigured && supabase) {
        await supabase.from('medication_reminders').insert({
          user_id: user.id,
          medication_name: newReminder.medication_name,
          start_time: newReminder.start_time,
          repeat_count: newReminder.repeat_count,
          repeat_interval_minutes: newReminder.repeat_interval_minutes,
          days_of_week: newReminder.days_of_week,
          is_active: true,
        });
      }
      setSuccessMsg("Dori qo'lda muvaffaqiyatli qo'shildi va saqlandi!");
    }

    setLoading(false);
    setShowForm(false);
    setEditingId(null);
    setForm({
      medication_name: '',
      start_time: '08:00',
      repeat_count: 1,
      repeat_interval_minutes: 480,
      days_of_week: [1, 2, 3, 4, 5],
      is_active: true,
    });
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setReminders(prev => prev.filter(r => r.id !== id));

    if (isSupabaseConfigured && supabase && user) {
      await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }
    setSuccessMsg("Dori eslatmasi o'chirildi.");
    setDeleteId(null);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pill size={24} color="#DC2626" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
              Dori Eslatmasi
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Qo'lda kiritilgan shaxsiy dori jadvallari (tizim o'zicha dori qo'shmaydi)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {notifPermission !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Brauzer eslatmalarini yoqish"
            >
              <Bell size={16} color="#DC2626" /> Bildirishnomalarni yoqish
            </button>
          )}

          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
          }}
        >
          <Plus size={18} /> Yangi dori qo'shish
        </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '8px',
      }}>
        <button
          onClick={() => setActiveTab('reminders')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'reminders' ? '#0F172A' : '#F1F5F9',
            color: activeTab === 'reminders' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} /> Mening Eslatmalarim ({reminders.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'catalog' ? '#0F172A' : '#F1F5F9',
            color: activeTab === 'catalog' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookOpen size={16} /> Rasmiy Dorilar Katalogi ({approvedCatalog.length})
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: '#DCFCE7',
          color: '#15803D',
          border: '1px solid #86EFAC',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
        }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Manual Input Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                {editingId ? 'Dorini tahrirlash' : 'Yangi dori jadvalini qo\'lda kiritish'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Quick picker from Admin-approved catalog */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Tasdiqlangan katalogdan tanlash (Ixtiyoriy):
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectFromCatalog(e.target.value);
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="">-- Katalogdan tanlash yoki o'zingiz yozing --</option>
                  {approvedCatalog.map(item => (
                    <option key={item.id} value={item.name}>{item.name} ({item.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Dori nomi (Retsept bo'yicha): *
                </label>
                <input
                  type="text"
                  value={form.medication_name}
                  onChange={(e) => setForm({ ...form, medication_name: e.target.value })}
                  placeholder="Masalan: Fersinol, Vitamin D, yoki shifokor yozgan dori..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Birinchi qabul vaqti:
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Kunlik martasi:
                  </label>
                  <select
                    value={form.repeat_count}
                    onChange={(e) => setForm({ ...form, repeat_count: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    <option value={1}>1 mahal</option>
                    <option value={2}>2 mahal (12 soatda bir)</option>
                    <option value={3}>3 mahal (8 soatda bir)</option>
                  </select>
                </div>
              </div>

              {/* Hafta kunlari */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Qabul kunlari:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {DAY_NAMES.map((name, idx) => {
                    const isSelected = form.days_of_week.includes(idx);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #DC2626' : '1px solid #CBD5E1',
                          background: isSelected ? '#FEF2F2' : '#FFFFFF',
                          color: isSelected ? '#DC2626' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminders Tab Content */}
      {activeTab === 'reminders' && (
        <>
          {reminders.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F8FAFC',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Pill size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                Hozircha dori eslatmalari kiritilmagan
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 20px' }}>
                Tizim qon guruhlari yoki dorilarni o'zicha avtomatik qo'shmaydi. Shifokor tavsiya qilgan dori vositalarini yuqoridagi <strong>“Yangi dori qo'shish”</strong> tugmasi orqali qo'lda kiriting.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Dori jadvalini yaratish
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          {reminder.medication_name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Kuniga {reminder.repeat_count} mahal
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setEditingId(reminder.id);
                          setForm({
                            medication_name: reminder.medication_name,
                            start_time: reminder.start_time,
                            repeat_count: reminder.repeat_count,
                            repeat_interval_minutes: reminder.repeat_interval_minutes,
                            days_of_week: reminder.days_of_week,
                            is_active: reminder.is_active,
                          });
                          setShowForm(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                        title="Tahrirlash"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(reminder.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}>
                    <Clock size={16} color="#DC2626" />
                    <span>Birinchi qabul: <strong>{reminder.start_time}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {DAY_NAMES.map((name, idx) => {
                      const isDay = reminder.days_of_week.includes(idx);
                      return (
                        <span
                          key={idx}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 0',
                            borderRadius: '4px',
                            background: isDay ? '#0F172A' : '#F1F5F9',
                            color: isDay ? '#FFFFFF' : '#94A3B8',
                          }}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Catalog Tab Content */}
      {activeTab === 'catalog' && (
        <div>
          {/* Medical Disclaimer Banner */}
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '0.84rem',
            color: '#92400E',
            lineHeight: 1.45,
          }}>
            <ShieldCheck size={22} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Rasmiy Tibbiy Ogohlantirish:</strong> Ushbu katalogdagi ma'lumotlar faqat axborot berish maqsadida taqdim etiladi. Bu shifokor ko'rigi yoki tibbiy tashxis hisoblanmaydi. Katalogga faqat vakolatli ma'murlar va mutaxassislar dori qo'sha oladi. Dori qabul qilishdan oldin davolovchi shifokor bilan maslahatlashing.
            </div>
          </div>

          {/* Search & Filter */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Dorini nomi yoki kategoriyasi bo'yicha qidirish..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Barchasi', 'Temir', 'Vitamin', 'Anemiya'].map(cat => {
                const isSelected = cat === 'Barchasi' ? !selectedCategory : selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === 'Barchasi' ? '' : cat)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: isSelected ? '#0F172A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Items */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {approvedCatalog
              .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  item.category.toLowerCase().includes(catalogSearch.toLowerCase());
                const matchesCategory = selectedCategory
                  ? item.category.toLowerCase().includes(selectedCategory.toLowerCase())
                  : true;
                return matchesSearch && matchesCategory;
              })
              .map(item => (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        {item.name}
                      </h4>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}>
                        {item.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '8px', lineHeight: 1.4 }}>
                      <strong>Standart doza:</strong> {item.standard_dosage}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#991B1B', background: '#FEF2F2', padding: '8px 10px', borderRadius: '8px', marginBottom: '14px', lineHeight: 1.35 }}>
                      <strong>Qarshi ko'rsatma:</strong> {item.contraindications}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingId(null);
                      setForm(prev => ({ ...prev, medication_name: item.name }));
                      setShowForm(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Clock size={15} color="#DC2626" /> Eslatma jadvaliga qo'shish
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Professional Tasdiqlash Modali */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Dori eslatmasini o'chirish"
        message="Haqiqatan ham ushbu dori qabul qilish jadvalini o'chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
