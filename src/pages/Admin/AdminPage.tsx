import React, { useState } from 'react';
import {
  Shield, Users, Droplets, AlertTriangle, BarChart3,
  Search, Check, X, Ban, Eye, RefreshCw, Database, Plus, Trash2, CheckCircle2, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_BLOOD_REQUESTS, DEMO_DONORS, DEMO_STATS } from '../../data/demo';
import {
  getApprovedBloodGroups,
  addBloodGroupAdmin,
  getApprovedMedicationsCatalog,
  addMedicationAdmin,
  deleteMedicationAdmin,
  type ApprovedBloodGroupItem,
  type ApprovedMedicationItem
} from '../../lib/catalogs';

type Tab = 'stats' | 'users' | 'requests' | 'catalogs' | 'reports';

export default function AdminPage() {
  const { user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [search, setSearch] = useState('');

  // Catalogs state
  const [bloodGroups, setBloodGroups] = useState<ApprovedBloodGroupItem[]>(getApprovedBloodGroups());
  const [medications, setMedications] = useState<ApprovedMedicationItem[]>(getApprovedMedicationsCatalog());
  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState('');

  // Forms
  const [newBg, setNewBg] = useState({ code: '', label: '', description: '' });
  const [newMed, setNewMed] = useState({ name: '', category: '', standard_dosage: '', contraindications: '' });

  // Backend admin check
  if (!user) { navigate('/auth'); return null; }
  if (!user.is_admin) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Shield size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} color="#DC2626" />
        <h2 style={{ marginBottom: '8px', color: '#0F172A' }}>Ruxsat yo'q</h2>
        <p style={{ color: '#64748B' }}>Ushbu boshqaruv bo'limiga faqat rasmiy vakolatli adminlar kira oladi.</p>
        <button
          className="btn btn-secondary"
          style={{ marginTop: '16px' }}
          onClick={() => navigate('/')}
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const handleAddBloodGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg(''); setToastError('');
    const res = await addBloodGroupAdmin(newBg, user);
    if (res.success) {
      setToastMsg(res.message);
      setBloodGroups(getApprovedBloodGroups());
      setNewBg({ code: '', label: '', description: '' });
    } else {
      setToastError(res.message);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg(''); setToastError('');
    const res = await addMedicationAdmin(newMed, user);
    if (res.success) {
      setToastMsg(res.message);
      setMedications(getApprovedMedicationsCatalog());
      setNewMed({ name: '', category: '', standard_dosage: '', contraindications: '' });
    } else {
      setToastError(res.message);
    }
  };

  const handleDeleteMedication = (id: string) => {
    if (!window.confirm("Haqiqatan ham ushbu dorini katalogdan o'chirmoqchimisiz?")) return;
    deleteMedicationAdmin(id, user);
    setMedications(getApprovedMedicationsCatalog());
    setToastMsg("Dori rasmiy katalogdan o'chirildi.");
  };

  const tabs = [
    { id: 'stats', label: 'Statistika', icon: <BarChart3 size={18} /> },
    { id: 'catalogs', label: 'Qon guruhi va Dorilar katalogi', icon: <Database size={18} /> },
    { id: 'users', label: 'Foydalanuvchilar', icon: <Users size={18} /> },
    { id: 'requests', label: 'So\'rovlar', icon: <Droplets size={18} /> },
    { id: 'reports', label: 'Shikoyatlar', icon: <AlertTriangle size={18} /> },
  ] as const;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ background: '#0F172A', color: '#FFFFFF', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Shield size={24} color="#DC2626" />
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: '2px', color: '#FFFFFF' }}>Admin Boshqaruv Paneli</h1>
            <p style={{ fontSize: '0.82rem', margin: 0, color: '#94A3B8' }}>
              Qon guruhlari va dori vositalarini qat'iy nazorat qilish tizimi
            </p>
          </div>
          <span style={{ background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            Vakolatli Admin
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {tabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: tab === id ? '#DC2626' : 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container" style={{ padding: '24px 20px' }}>
        {toastMsg && (
          <div style={{ background: '#DCFCE7', color: '#15803D', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {toastMsg}
          </div>
        )}
        {toastError && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {toastError}
          </div>
        )}

        {/* ============================================================ */}
        {/* CATALOGS TAB: QON GURUHLARI VA TASDIQLANGAN DORILAR           */}
        {/* ============================================================ */}
        {tab === 'catalogs' && (
          <div>
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '24px',
              color: '#1E40AF',
              fontSize: '0.85rem',
              display: 'flex',
              gap: '10px',
            }}>
              <Lock size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Qat'iy xavfsizlik qoidasi:</strong> Tizim yoki AI-agent o'zicha avtomatik qon guruhi yoki dori yarata olmaydi. Faqat ushbu sahifada admin qo'lda kiritgan ma'lumotlar saqlanadi va butun platforma bo'ylab amal qiladi.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
              {/* 1. Qon guruhlari boshqaruvi */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets color="#DC2626" /> Rasmiy Tasdiqlangan Qon Guruhlari
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {bloodGroups.map((bg) => (
                    <div
                      key={bg.code}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {bg.code}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>{bg.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{bg.description}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>● Faol</span>
                    </div>
                  ))}
                </div>

                {/* Yangi qon guruhi qo'shish formasi */}
                <form onSubmit={handleAddBloodGroup} style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    + Yangi qon guruhi/subtipini qo'lda kiritish (Admin):
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Kodi (Masalan: hh)"
                      value={newBg.code}
                      onChange={(e) => setNewBg({ ...newBg, code: e.target.value })}
                      style={{ width: '110px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nomi (Masalan: Bombay Fenotipi)"
                      value={newBg.label}
                      onChange={(e) => setNewBg({ ...newBg, label: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Qisqacha tavsifi..."
                    value={newBg.description}
                    onChange={(e) => setNewBg({ ...newBg, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem', marginBottom: '8px' }}
                  />
                  <button
                    type="submit"
                    style={{ padding: '8px 14px', borderRadius: '6px', background: '#0F172A', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Qon guruhini tasdiqlab saqlash
                  </button>
                </form>
              </div>

              {/* 2. Tasdiqlangan dorilar katalogi */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database color="#0F172A" /> Rasmiy Dorilar Katalogi (Admin nazorati)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '340px', overflowY: 'auto' }}>
                  {medications.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{m.category} • {m.standard_dosage}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteMedication(m.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                        title="Katalogdan o'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Yangi dori qo'shish formasi */}
                <form onSubmit={handleAddMedication} style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    + Rasmiy katalogga yangi dori kiritish (Admin):
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Dori nomi..."
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Kategoriya..."
                      value={newMed.category}
                      onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Standart doza..."
                      value={newMed.standard_dosage}
                      onChange={(e) => setNewMed({ ...newMed, standard_dosage: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Qarshi ko'rsatmalar..."
                      value={newMed.contraindications}
                      onChange={(e) => setNewMed({ ...newMed, contraindications: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ padding: '8px 14px', borderRadius: '6px', background: '#DC2626', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Dorini rasmiy katalogga kiritish
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              {[
                { label: 'Jami donorlar', value: '1,247', color: '#DC2626' },
                { label: 'Faol donorlar', value: '89', color: '#059669' },
                { label: 'Jami so\'rovlar', value: '456', color: '#0F172A' },
                { label: 'Bajarilgan yordamlar', value: '342', color: '#D97706' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {DEMO_DONORS.map(donor => (
                <div key={donor.id} style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{donor.name}</div>
                    <span style={{ fontWeight: 800, color: '#DC2626' }}>{donor.blood_group}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>{donor.region}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DEMO_BLOOD_REQUESTS.map(req => (
              <div key={req.id} style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '6px 12px', borderRadius: '8px' }}>{req.blood_group}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{req.hospital || req.region}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{req.quantity_units} doza kerak • {req.urgency}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
                  Nazoratda
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reports Tab */}
        {tab === 'reports' && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
            <AlertTriangle size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '8px', color: '#0F172A' }}>Shikoyatlar yo'q</h3>
            <p>Hozircha ko'rib chiqish kerak bo'lgan shikoyatlar mavjud emas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
