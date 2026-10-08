import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin, Filter, Navigation, RefreshCw, User,
  Clock, AlertCircle, Search, Droplets, CheckCircle, Shield
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { DEMO_DONORS, BLOOD_GROUPS, DONOR_STATUS_LABELS, DONOR_STATUS_COLORS, REGIONS } from '../../data/demo';
import type { BloodGroup, DonorStatus, DemoMarker } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Cache Leaflet icons to eliminate DOM creation overhead & memory churn
const iconCache = new Map<string, L.DivIcon>();

function getCachedDonorIcon(status: DonorStatus, bloodGroup: string): L.DivIcon {
  const key = `${status}-${bloodGroup}`;
  if (iconCache.has(key)) {
    return iconCache.get(key)!;
  }

  const colors: Record<DonorStatus, string> = {
    available: '#059669',
    busy: '#D97706',
    unavailable: '#64748B',
  };
  const color = colors[status] || '#64748B';

  const icon = L.divIcon({
    html: `
      <div style="
        width: 38px; height: 38px;
        background: #FFFFFF;
        border-radius: 50%;
        border: 3px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
        color: #DC2626;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
        font-family: Inter, sans-serif;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">${bloodGroup}</div>
    `,
    className: 'donor-map-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });

  iconCache.set(key, icon);
  return icon;
}

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 13 });
    map.once('locationfound', () => setLocating(false));
    map.once('locationerror', () => {
      setLocating(false);
      alert("Joylashuvni aniqlab bo'lmadi. GPS ruxsatini tekshiring.");
    });
  };

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}>
      <button
        onClick={locate}
        style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#0F172A',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
        }}
        disabled={locating}
      >
        <Navigation size={14} className={locating ? 'animate-spin' : ''} color="#DC2626" />
        {locating ? 'Aniqlanmoqda...' : 'Mening joylashuvim'}
      </button>
    </div>
  );
}

export default function MapPage() {
  const { isDemo } = useAuth();
  const [donors, setDonors] = useState<DemoMarker[]>(DEMO_DONORS);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<DonorStatus | ''>('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<DemoMarker | null>(null);

  // Markaz: Toshkent
  const center: [number, number] = [41.2995, 69.2401];

  useEffect(() => {
    let isMounted = true;
    if (!isDemo && isSupabaseConfigured && supabase) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('id, full_name, blood_group, donor_status, region, latitude, longitude')
        .eq('is_donor', true)
        .not('latitude', 'is', null)
        .then(({ data, error }) => {
          if (isMounted && !error && data && data.length > 0) {
            const mapped = data.map((d: any) => ({
              id: d.id,
              name: d.full_name,
              blood_group: d.blood_group,
              status: d.donor_status,
              region: d.region || '',
              latitude: d.latitude,
              longitude: d.longitude,
            }));
            setDonors(mapped);
          }
          if (isMounted) setLoading(false);
        });
    }

    return () => { isMounted = false; };
  }, [isDemo]);

  // Memoized filtered donors (prevents unneeded re-filtering and extra renders)
  const filtered = useMemo(() => {
    let result = donors;
    if (selectedGroup) {
      result = result.filter(d => d.blood_group === selectedGroup);
    }
    if (selectedStatus) {
      result = result.filter(d => d.status === selectedStatus);
    }
    if (selectedRegion) {
      result = result.filter(d => d.region.toLowerCase().includes(selectedRegion.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q));
    }
    return result;
  }, [donors, selectedGroup, selectedStatus, selectedRegion, searchQuery]);

  const resetFilters = useCallback(() => {
    setSelectedGroup('');
    setSelectedStatus('');
    setSelectedRegion('');
    setSearchQuery('');
  }, []);

  const counts = useMemo(() => {
    return {
      total: donors.length,
      available: donors.filter(d => d.status === 'available').length,
      busy: donors.filter(d => d.status === 'busy').length,
    };
  }, [donors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Top Filter Bar */}
      <div style={{
        padding: '12px 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick search input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Donor yoki tuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px 7px 30px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none',
                width: '180px',
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '9px', top: '9px', color: '#94A3B8' }} />
          </div>

          {/* Blood group filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as BloodGroup | '')}
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#0F172A',
            }}
          >
            <option value="">Barcha qon guruhlari</option>
            {BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as DonorStatus | '')}
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#0F172A',
            }}
          >
            <option value="">Barcha holatlar</option>
            <option value="available">🟢 Tayyor ({counts.available})</option>
            <option value="busy">🟡 Band ({counts.busy})</option>
            <option value="unavailable">⚪ Faol emas</option>
          </select>

          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.82rem',
              background: '#FFFFFF',
              color: '#0F172A',
            }}
          >
            <option value="">Barcha hududlar</option>
            {REGIONS.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>

          {(selectedGroup || selectedStatus || selectedRegion || searchQuery) && (
            <button
              onClick={resetFilters}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Filtrni tozalash
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{filtered.length}</span> donor ko'rsatilmoqda
        </div>
      </div>

      {/* Map & Sidebar container */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Leaflet Map */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <LocationButton />

            {filtered.map((donor) => (
              <Marker
                key={donor.id}
                position={[donor.latitude, donor.longitude]}
                icon={getCachedDonorIcon(donor.status, donor.blood_group)}
                eventHandlers={{
                  click: () => setSelectedDonor(donor),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#DC2626', color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem'
                      }}>
                        {donor.blood_group}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{donor.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{donor.region}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: donor.status === 'available' ? '#059669' : '#D97706',
                      fontWeight: 600,
                      marginBottom: '8px',
                    }}>
                      {donor.status === 'available' ? '● Qon topshirishga tayyor' : '● Hozirda band'}
                    </div>
                    <button
                      onClick={() => setSelectedDonor(donor)}
                      style={{
                        width: '100%', padding: '6px', borderRadius: '6px',
                        background: '#0F172A', color: 'white', border: 'none',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Batafsil ko'rish
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Donor Drawer / Detail Card */}
        {selectedDonor && (
          <div style={{
            width: '320px',
            background: '#FFFFFF',
            borderLeft: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 16px rgba(15, 23, 42, 0.05)',
            zIndex: 10,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}>
                {selectedDonor.blood_group}
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              {selectedDonor.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {selectedDonor.region}
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>Donorlik holati</div>
              <div style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: selectedDonor.status === 'available' ? '#059669' : '#D97706'
              }}>
                {DONOR_STATUS_LABELS[selectedDonor.status]}
              </div>
            </div>

            <div style={{
              background: '#EFF6FF',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #BFDBFE',
              marginBottom: '20px',
              fontSize: '0.78rem',
              color: '#1E40AF',
              display: 'flex',
              gap: '8px',
            }}>
              <Shield size={16} style={{ flexShrink: 0 }} />
              <div>
                Xavfsizlik: Donorning aniq uy manzili ko'rsatilmaydi. Bog'lanish platforma orqali amalga oshiriladi.
              </div>
            </div>

            <button
              onClick={() => {
                alert(`${selectedDonor.name} bilan xavfsiz suhbat oynasi ochilmoqda.`);
                window.location.href = '/chat';
              }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#DC2626',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Donorga xabar yozish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
