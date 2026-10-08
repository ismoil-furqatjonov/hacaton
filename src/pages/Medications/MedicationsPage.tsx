import React, { useState, useEffect } from 'react';
import {
  Pill, Plus, Trash2, Edit, Check, Clock, X, AlertCircle, Bell, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApprovedMedicationsCatalog } from '../../lib/catalogs';
import type { MedicationReminder } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const DAY_NAMES = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export default function MedicationsPage() {
  const { user, isDemo } = useAuth();
  const storageKey = `donor_user_medications_${user?.id || 'guest'}`;

  // Sahifa yangilanganda ham qo'lda kiritilgan ma'lumotlar saqlanadi
  const [reminders, setReminders] = useState<MedicationReminder[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return []; // Tizim o'zicha avtomatik dori qo'shmaydi!
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Rasmiy tasdiqlangan dorilar ro'yxati
  const approvedCatalog = getApprovedMedicationsCatalog();

  const [form, setForm] = useState({
    medication_name: '',
    start_time: '08:00',
    repeat_count: 1,
    repeat_interval_minutes: 480,
    days_of_week: [1, 2, 3, 4, 5] as number[],
    is_active: true,
  });

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Haqiqatan ham ushbu dorini o'chirmoqchimisiz?")) return;
    setReminders(prev => prev.filter(r => r.id !== id));

    if (isSupabaseConfigured && supabase && user) {
      await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }
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

      {/* Reminders List */}
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
                    onClick={() => handleDelete(reminder.id)}
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
    </div>
  );
}
