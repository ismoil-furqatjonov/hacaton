import React, { useState } from 'react';
import {
  User, Droplets, MapPin, Phone, Mail, Edit, Check, X,
  LogOut, Shield, Heart, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BLOOD_GROUPS, REGIONS, DONOR_STATUS_LABELS, DONOR_STATUS_COLORS } from '../../data/demo';
import type { DonorStatus, BloodGroup } from '../../types';

export default function ProfilePage() {
  const { user, signOut, updateProfile, isDemo } = useAuth();
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
    navigate('/auth');
    return null;
  }

  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

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
      setSuccessMsg('Profil yangilandi!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleStatusChange = async (status: DonorStatus) => {
    await updateProfile({ donor_status: status });
    setSuccessMsg('Holat yangilandi!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const statusConfig = {
    available: { emoji: '🟢', label: DONOR_STATUS_LABELS.available, color: 'var(--color-success)' },
    busy: { emoji: '🟡', label: DONOR_STATUS_LABELS.busy, color: 'var(--color-warning)' },
    unavailable: { emoji: '⚪', label: DONOR_STATUS_LABELS.unavailable, color: 'var(--color-text-secondary)' },
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.25rem' }}>👤 Mening profilim</h1>
          {isDemo && <span className="badge badge-blue">Demo rejim</span>}
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
                      <label className="form-label">Ism va familiya</label>
                      <input className="form-input" type="text" value={editData.full_name}
                        onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Qon guruhi</label>
                        <select className="form-select" value={editData.blood_group}
                          onChange={e => setEditData(p => ({ ...p, blood_group: e.target.value as BloodGroup }))}>
                          <option value="">Tanlang</option>
                          {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Telefon</label>
                        <input className="form-input" type="tel" value={editData.phone}
                          onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hudud</label>
                      <select className="form-select" value={editData.region}
                        onChange={e => setEditData(p => ({ ...p, region: e.target.value }))}>
                        <option value="">Tanlang</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="btn-save-profile">
                        {saving ? 'Saqlanmoqda...' : <><Check size={16} /> Saqlash</>}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                        <X size={16} /> Bekor
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
                      <Edit size={16} /> Profilni tahrirlash
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
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Donorlik soni</div>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {user.helped_count}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Yordam berilgan</div>
          </div>
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-info)' }}>
              {user.blood_group || '—'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Qon guruhi</div>
          </div>
        </div>

        {/* Donor Status */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>🩸 Donor holati</h3>
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
            <p style={{ fontSize: '0.8125rem', marginTop: '10px', color: 'var(--color-text-secondary)' }}>
              Faqat "Tayyor" holatdagi donorlar qidiruvda ko'rsatiladi.
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '14px', fontSize: '1rem' }}>⚡ Tezkor harakatlar</h3>
            {[
              { icon: <AlertCircle size={18} />, label: 'Mening so\'rovlarim', to: '/request' },
              { icon: <Clock size={18} />, label: 'Dori eslatmalari', to: '/medications' },
              { icon: <Heart size={18} />, label: 'Donor xaritasi', to: '/map' },
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

            {user.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-info)',
                  fontFamily: 'inherit',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={18} />
                  Admin Panel
                </div>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Privacy note */}
        <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '0.8125rem' }}>
          <AlertCircle size={16} />
          <span>
            Siz telefon va email ma'lumotlaringiz faqat tegishli so'rovlar bilan bog'liq foydalanuvchilarga ko'rsatiladi.
            Ommaviy profilida shaxsiy ma'lumotlar yashiriladi.
          </span>
        </div>

        {/* Sign out */}
        <button
          className="btn btn-secondary btn-full"
          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
          onClick={handleSignOut}
          id="btn-signout"
        >
          <LogOut size={18} />
          Hisobdan chiqish
        </button>
      </div>
    </div>
  );
}
