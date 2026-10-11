import React, { useState } from 'react';
import {
  MapPin, Phone, Mail, Edit, Check, X,
  LogOut, Shield, ChevronRight,
  Pill, HeartHandshake, Sparkles, Activity, Droplets, Clock, Heart, AlertCircle
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { BLOOD_GROUPS, REGIONS } from '../../data/demo';
import type { DonorStatus, BloodGroup, UserTrack } from '../../types';
import { BLOOD_COMPATIBILITY_TABLE } from '../../lib/bloodCompatibility';

export default function ProfilePage() {
  const { user, signOut, updateProfile, isDemo } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    blood_group: user?.blood_group || '' as BloodGroup | '',
    region: user?.region || '',
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DN';

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: editData.full_name,
      phone: editData.phone,
      blood_group: editData.blood_group as BloodGroup,
      region: editData.region,
    });
    setSaving(false);
    if (!error) {
      setEditing(false);
      setSuccessMsg(t('profile.profile_updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleStatusChange = async (status: DonorStatus) => {
    await updateProfile({ donor_status: status });
    setSuccessMsg(t('profile.status_updated'));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleTrackChange = async (track: UserTrack) => {
    const isDonor = track === 'donor';
    await updateProfile({ user_track: track, is_donor: isDonor });
    setSuccessMsg(t('profile.status_updated'));
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const statusConfig = {
    available: { emoji: '🟢', label: t('profile.status_available'), color: 'var(--color-success)' },
    busy: { emoji: '🟡', label: t('profile.status_busy'), color: 'var(--color-warning)' },
    unavailable: { emoji: '⚪', label: t('profile.status_unavailable'), color: 'var(--color-text-secondary)' },
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.25rem' }}>👤 {t('profile.page_title')}</h1>
          {isDemo && <span className="badge badge-blue">{t('profile.demo_badge')}</span>}
        </div>
      </div>

      <div className="page-container">
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <Check size={18} /> <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div className="avatar avatar-xl">{initials}</div>
                {user.blood_group && (
                  <div className="blood-badge blood-badge-sm" style={{
                    position: 'absolute', bottom: '-4px', right: '-4px',
                    border: '2px solid white',
                  }}>
                    {user.blood_group}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('profile.full_name')}</label>
                      <input className="form-input" type="text" value={editData.full_name}
                        onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">{t('common.blood_group')}</label>
                        <select className="form-select" value={editData.blood_group}
                          onChange={e => setEditData(p => ({ ...p, blood_group: e.target.value as BloodGroup }))}>
                          <option value="">{t('auth.select_blood_group')}</option>
                          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('profile.phone')}</label>
                        <input className="form-input" type="tel" value={editData.phone}
                          onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('profile.region')}</label>
                      <select className="form-select" value={editData.region}
                        onChange={e => setEditData(p => ({ ...p, region: e.target.value }))}>
                        <option value="">{t('auth.select_region')}</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="btn-save-profile">
                        {saving ? t('common.loading') : <><Check size={16} /> {t('profile.save_btn')}</>}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                        <X size={16} /> {t('profile.cancel_btn')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '1.375rem' }}>{user.full_name}</h2>
                      {user.is_admin && (
                        <span className="badge badge-blue">
                          <Shield size={12} style={{ marginRight: '4px' }} /> Admin
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} /> {user.email}
                      </span>
                      {user.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {user.phone}
                        </span>
                      )}
                      {user.region && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} /> {user.region}
                        </span>
                      )}
                    </div>

                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}
                      onClick={() => { setEditing(true); setEditData({ full_name: user.full_name, phone: user.phone || '', blood_group: user.blood_group || '', region: user.region || '' }); }}
                      id="btn-edit-profile">
                      <Edit size={16} /> {t('profile.edit_btn')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '16px' }}>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {user.donations_count}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('profile.donations_stat')}</div>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {user.helped_count}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('profile.helped_stat')}</div>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-info)' }}>
              {user.blood_group || '—'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('common.blood_group')}</div>
          </div>
        </div>

        {/* 1. Mening Yo'nalishim (3 Tracks Switcher) */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#DC2626" />
                {t('profile.track_title')}
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {/* Track: DORI */}
              <div
                onClick={() => handleTrackChange('medication')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: user.user_track === 'medication' ? '2px solid #059669' : '1px solid #E2E8F0',
                  background: user.user_track === 'medication' ? '#ECFDF5' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {user.user_track === 'medication' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#059669', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: '#D1FAE5', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Pill size={18} color="#059669" />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{t('profile.track_medication')}</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  {t('auth.track_medication_desc')}
                </p>
              </div>

              {/* Track: QON BERISH */}
              <div
                onClick={() => handleTrackChange('donor')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: user.user_track === 'donor' || (!user.user_track && user.is_donor) ? '2px solid #DC2626' : '1px solid #E2E8F0',
                  background: user.user_track === 'donor' || (!user.user_track && user.is_donor) ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {(user.user_track === 'donor' || (!user.user_track && user.is_donor)) && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#DC2626', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: '#FEE2E2', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <HeartHandshake size={18} color="#DC2626" />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{t('profile.track_donor')}</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  {t('auth.track_donor_desc')}
                </p>
              </div>

              {/* Track: QON OLISH */}
              <div
                onClick={() => handleTrackChange('recipient')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: user.user_track === 'recipient' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: user.user_track === 'recipient' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {user.user_track === 'recipient' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#2563EB', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ background: '#DBEAFE', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Droplets size={18} color="#2563EB" />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{t('profile.track_recipient')}</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  {t('auth.track_recipient_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tibbiy Qon Mosligi Kartasi */}
        {user.blood_group && BLOOD_COMPATIBILITY_TABLE[user.blood_group] && (() => {
          const compat = BLOOD_COMPATIBILITY_TABLE[user.blood_group];
          return (
            <div className="card" style={{ marginBottom: '16px', border: '1px solid #FECACA', background: '#FFFDFD' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Activity size={20} color="#DC2626" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#991B1B' }}>
                    {t('profile.compatibility_title')} — {user.blood_group}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                      🩸 {t('profile.can_donate_to')}:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {compat.canGiveTo.map(g => (
                        <span key={g} style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF', marginBottom: '6px' }}>
                      💉 {t('profile.can_receive_from')}:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {compat.canReceiveFrom.map(g => (
                        <span key={g} style={{ background: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Donor Status */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>🩸 {t('profile.donor_status_title')}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(Object.keys(statusConfig) as DonorStatus[]).map((s) => {
                const config = statusConfig[s];
                const isActive = user.donor_status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    style={{
                      padding: '10px 16px',
                      border: `2px solid ${isActive ? config.color : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? `${config.color}15` : 'transparent',
                      color: isActive ? config.color : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'all var(--transition)',
                      fontFamily: 'inherit',
                    }}
                    id={`btn-status-${s}`}
                  >
                    {config.emoji} {config.label}
                    {isActive && <Check size={14} style={{ marginLeft: '6px' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>⚡ {t('common.actions')}</h3>
            {[
              { icon: <AlertCircle size={18} />, label: t('nav.requests'), to: '/request' },
              { icon: <Clock size={18} />, label: t('nav.medications'), to: '/medications' },
              { icon: <Heart size={18} />, label: t('nav.map'), to: '/map' },
            ].map(({ icon, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  fontSize: '0.9375rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
                  {label}
                </div>
                <ChevronRight size={16} color="var(--color-text-secondary)" />
              </button>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          className="btn btn-secondary btn-full"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
          onClick={handleSignOut}
          id="btn-signout"
        >
          <LogOut size={18} />
          {t('nav.sign_out')}
        </button>
      </div>
    </div>
  );
}
