import React, { useState } from 'react';
import {
  Building2, Droplets, AlertTriangle, CheckCircle2, Plus,
  Phone, MapPin, Clock, Search, Shield, Filter, FileText
} from 'lucide-react';
import { BLOOD_GROUPS, REGIONS, DEMO_BLOOD_REQUESTS } from '../../data/demo';
import type { BloodRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface BloodReserve {
  group: string;
  unitsAvailable: number;
  criticalThreshold: number;
  status: 'adequate' | 'low' | 'critical';
}

const INITIAL_RESERVES: BloodReserve[] = [
  { group: 'O+', unitsAvailable: 14, criticalThreshold: 10, status: 'adequate' },
  { group: 'O-', unitsAvailable: 2, criticalThreshold: 5, status: 'critical' },
  { group: 'A+', unitsAvailable: 18, criticalThreshold: 10, status: 'adequate' },
  { group: 'A-', unitsAvailable: 4, criticalThreshold: 6, status: 'low' },
  { group: 'B+', unitsAvailable: 12, criticalThreshold: 8, status: 'adequate' },
  { group: 'B-', unitsAvailable: 3, criticalThreshold: 5, status: 'low' },
  { group: 'AB+', unitsAvailable: 8, criticalThreshold: 4, status: 'adequate' },
  { group: 'AB-', unitsAvailable: 1, criticalThreshold: 3, status: 'critical' },
];

export default function HospitalPage() {
  const { user } = useAuth();
  const [reserves, setReserves] = useState<BloodReserve[]>(INITIAL_RESERVES);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [form, setForm] = useState({
    blood_group: 'O-',
    units: 3,
    urgency: 'critical',
    department: 'Reanimatsiya va Shoshilinch jarrohlik',
    patient_diagnosis: 'O\'tkir qon yo\'qotish, operatsiyadan oldingi holat',
  });

  const handleCreateHospitalOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEmergencyModal(false);
    setSuccessToast(`Shifoxona nomidan ${form.blood_group} guruhi bo'yicha shoshilinch talabnoma e'lon qilindi!`);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Building2 size={26} color="#DC2626" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
              Shifoxona va Qon Banki Kabineti
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Klinika qon zaxiralari monitoringi va favqulodda talabnomalar tizimi
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEmergencyModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
          }}
        >
          <Plus size={18} /> Favqulodda talabnoma yaratish
        </button>
      </div>

      {successToast && (
        <div style={{
          background: '#DCFCE7',
          color: '#15803D',
          border: '1px solid #86EFAC',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={20} />
          {successToast}
        </div>
      )}

      {/* Blood Bank Reserves Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplets size={20} color="#DC2626" /> Qon Zaxiralari Holati (Real-vaqt)
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {reserves.map((res) => {
            const isCritical = res.status === 'critical';
            const isLow = res.status === 'low';
            return (
              <div
                key={res.group}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: `1px solid ${isCritical ? '#FCA5A5' : isLow ? '#FDE68A' : '#E2E8F0'}`,
                  padding: '18px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#DC2626',
                    background: '#FEF2F2',
                    padding: '4px 12px',
                    borderRadius: '8px',
                  }}>
                    {res.group}
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isCritical ? '#FEE2E2' : isLow ? '#FEF3C7' : '#E0F2FE',
                    color: isCritical ? '#DC2626' : isLow ? '#B45309' : '#0284C7',
                  }}>
                    {isCritical ? 'Tanqis (Kritik)' : isLow ? 'Kam zaxira' : 'Yetarli'}
                  </span>
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  {res.unitsAvailable} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>doza mavjud</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Xavfsiz chegara: {res.criticalThreshold} doza
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Active Emergency Orders */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="#0F172A" /> Faol Klinika So'rovlari
        </h2>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}>
          {DEMO_BLOOD_REQUESTS.filter((r: BloodRequest) => r.urgency === 'critical').slice(0, 4).map((req: BloodRequest, i: number) => (
            <div
              key={req.id}
              style={{
                padding: '16px 20px',
                borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 900,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {req.blood_group}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                    {req.hospital || "Respublika Shoshilinch Tibbiy Yordam Markazi"}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>📍 {req.region}</span>
                    <span>•</span>
                    <span>🩸 {req.quantity_units} doza kerak</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: '#FEE2E2',
                  color: '#DC2626',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  🚨 SOS SHOSHILINCH
                </span>
                <button
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => alert(`Koordinatordan tasdiqlandi: ${req.hospital}`)}
                >
                  Donorlarni bog'lash
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Order Modal */}
      {showEmergencyModal && (
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
            maxWidth: '540px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="#DC2626" /> Shifoxona Favqulodda Talabnomasi
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '18px' }}>
              Ushbu so'rov eng yuqori prioritet bilan atrof-muhitdagi mos qon guruhli barcha donorlarga uzatiladi.
            </p>

            <form onSubmit={handleCreateHospitalOrder}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Kerakli qon guruhi:
                </label>
                <select
                  value={form.blood_group}
                  onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Bo'lim yoki Shoshilinch xona:
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Doza miqdori (birlik):
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.units}
                  onChange={(e) => setForm({ ...form, units: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
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
                  Darhol e'lon qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
