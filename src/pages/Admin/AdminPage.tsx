import React, { useState } from 'react';
import {
  Shield, Users, Droplets, AlertTriangle, BarChart3,
  Database, Trash2, CheckCircle2, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { DEMO_BLOOD_REQUESTS, DEMO_DONORS } from '../../data/demo';
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
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [deleteMedId, setDeleteMedId] = useState<string | null>(null);

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
        <h2 style={{ marginBottom: '8px', color: '#0F172A' }}>{t('admin.no_permission_title')}</h2>
        <p style={{ color: '#64748B' }}>{t('admin.no_permission_desc')}</p>
        <button
          className="btn btn-secondary"
          style={{ marginTop: '16px' }}
          onClick={() => navigate('/')}
        >
          {t('admin.back_home')}
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
    setDeleteMedId(id);
  };

  const handleConfirmDeleteMedication = () => {
    if (!deleteMedId) return;
    deleteMedicationAdmin(deleteMedId, user);
    setMedications(getApprovedMedicationsCatalog());
    setToastMsg(t('admin.deleted_med_success'));
    setDeleteMedId(null);
  };

  const tabs = [
    { id: 'stats', label: t('admin.tab_stats'), icon: <BarChart3 size={18} /> },
    { id: 'catalogs', label: t('admin.tab_catalogs'), icon: <Database size={18} /> },
    { id: 'users', label: t('admin.tab_users'), icon: <Users size={18} /> },
    { id: 'requests', label: t('admin.tab_requests'), icon: <Droplets size={18} /> },
    { id: 'reports', label: t('admin.tab_reports'), icon: <AlertTriangle size={18} /> },
  ] as const;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ background: '#0F172A', color: '#FFFFFF', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Shield size={24} color="#DC2626" />
          <div>
            <h1 style={{ fontSize: '1.35rem', marginBottom: '2px', color: '#FFFFFF' }}>{t('admin.page_title')}</h1>
            <p style={{ fontSize: '0.82rem', margin: 0, color: '#94A3B8' }}>
              {t('admin.no_permission_desc')}
            </p>
          </div>
          <span style={{ background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
            Admin
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

        {/* CATALOGS TAB */}
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
                <strong>{t('common.demo_banner')}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
              {/* 1. Qon guruhlari boshqaruvi */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets color="#DC2626" /> {t('admin.tab_catalogs')}
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
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>● {t('common.active')}</span>
                    </div>
                  ))}
                </div>

                {/* Yangi qon guruhi qo'shish formasi */}
                <form onSubmit={handleAddBloodGroup} style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    + {t('admin.add_blood_group')}:
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder={t('admin.blood_group_code')}
                      value={newBg.code}
                      onChange={(e) => setNewBg({ ...newBg, code: e.target.value })}
                      style={{ width: '110px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder={t('admin.blood_group_label')}
                      value={newBg.label}
                      onChange={(e) => setNewBg({ ...newBg, label: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ padding: '8px 14px', borderRadius: '6px', background: '#0F172A', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('admin.btn_add')}
                  </button>
                </form>
              </div>

              {/* 2. Tasdiqlangan dorilar katalogi */}
              <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database color="#0F172A" /> {t('medications.tab_catalog')}
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
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Yangi dori qo'shish formasi */}
                <form onSubmit={handleAddMedication} style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    + {t('admin.add_medication')}:
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder={t('admin.med_name')}
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                    <input
                      type="text"
                      placeholder={t('admin.med_category')}
                      value={newMed.category}
                      onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder={t('admin.med_dosage')}
                      value={newMed.standard_dosage}
                      onChange={(e) => setNewMed({ ...newMed, standard_dosage: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                    <input
                      type="text"
                      placeholder={t('admin.med_contraindications')}
                      value={newMed.contraindications}
                      onChange={(e) => setNewMed({ ...newMed, contraindications: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ padding: '8px 14px', borderRadius: '6px', background: '#DC2626', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('admin.btn_add')}
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
                { label: t('home.stat_total_donors'), value: '1,247', color: '#DC2626' },
                { label: t('home.stat_active_donors'), value: '89', color: '#059669' },
                { label: t('home.stat_active_requests'), value: '456', color: '#0F172A' },
                { label: t('home.stat_completed_helps'), value: '342', color: '#D97706' },
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
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{req.quantity_units} {t('common.units')} • {req.urgency}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
                  {t('common.active')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reports Tab */}
        {tab === 'reports' && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
            <AlertTriangle size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '8px', color: '#0F172A' }}>{t('common.active')}</h3>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteMedId}
        title={t('common.delete')}
        message={t('common.confirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmDeleteMedication}
        onCancel={() => setDeleteMedId(null)}
      />
    </div>
  );
}
