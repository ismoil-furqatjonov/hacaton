import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Heart, AlertCircle, ChevronRight,
  MapPin, Clock, ArrowRight, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_STATS, DEMO_BLOOD_REQUESTS, URGENCY_LABELS, URGENCY_COLORS, STATUS_LABELS } from '../../data/demo';
import type { BloodRequest, PlatformStats } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const urgencyBadgeClass: Record<string, string> = {
  low: 'badge badge-green',
  medium: 'badge badge-yellow',
  high: 'badge badge-orange',
  critical: 'badge badge-red',
};

export default function HomePage() {
  const { user, isDemo, enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>(DEMO_STATS);
  const [requests, setRequests] = useState<BloodRequest[]>(DEMO_BLOOD_REQUESTS.slice(0, 4));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isDemo && isSupabaseConfigured && supabase) {
      loadData();
    }
  }, [isDemo]);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Stats
      const [donorsRes, requestsRes, completedRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_donor', true),
        supabase.from('blood_requests').select('id', { count: 'exact' }).not('status', 'in', '(completed,cancelled)'),
        supabase.from('blood_requests').select('id', { count: 'exact' }).eq('status', 'completed'),
      ]);

      setStats({
        total_donors: donorsRes.count || 0,
        active_donors: (donorsRes.count || 0),
        completed_helps: completedRes.count || 0,
        active_requests: requestsRes.count || 0,
      });

      // Recent requests
      const { data } = await supabase
        .from('blood_requests')
        .select('*, requester:profiles!requester_id(*)')
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data) setRequests(data as BloodRequest[]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        {/* Decorative blood cells */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="blood-cell"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              top: `${10 + i * 15}%`,
              right: `${5 + i * 8}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${5 + i}s`,
            }}
          />
        ))}

        <div className="page-container" style={{ padding: '0 24px' }}>
          <div className="hero-content">
            <div className="hero-badge">
              <span style={{ animation: 'heartbeat 2s infinite', display: 'inline-block' }}>🩸</span>
              Bir donor — bir hayot
            </div>

            <h1 className="hero-title">
              Kerakli <span>donorni</span><br />
              kerakli vaqtda toping
            </h1>

            <p className="hero-subtitle">
              Muammo donorlarning yo'qligida emas. Muammo — kerakli donorni<br />
              kerakli vaqtda topishda. DONOR shu ikki insonni AI yordamida bog'laydi.
            </p>

            <div className="hero-buttons">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => user ? navigate('/request') : navigate('/auth')}
                id="btn-need-blood"
              >
                🩸 Menga qon kerak
              </button>
              <button
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => user ? navigate('/profile') : navigate('/auth')}
                id="btn-be-donor"
              >
                🤝 Donor bo'laman
              </button>
              <button
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => navigate('/ai')}
                id="btn-ai-agent"
              >
                🤖 AI yordamchi
              </button>
              <button
                className="btn btn-lg"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => navigate('/map')}
                id="btn-view-map"
              >
                🗺️ Donor xaritasini ko'rish
              </button>
            </div>

            {!user && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}
                onClick={enterDemoMode}
              >
                Demo rejimda ko'rish →
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Stats */}
        <section style={{ margin: '-40px 0 32px' }}>
          {isDemo && (
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              <span>ℹ️</span>
              <span>Demo rejim: quyidagi statistika va so'rovlar sinov ma'lumotlari</span>
            </div>
          )}
          <div className="grid-4">
            <StatCard
              icon={<Users size={24} />}
              iconClass="red"
              label="Jami donorlar"
              value={stats.total_donors.toLocaleString()}
            />
            <StatCard
              icon={<Activity size={24} />}
              iconClass="green"
              label="Hozir faol"
              value={stats.active_donors.toString()}
              pulse
            />
            <StatCard
              icon={<Heart size={24} />}
              iconClass="blue"
              label="Bajarilgan yordamlar"
              value={stats.completed_helps.toLocaleString()}
            />
            <StatCard
              icon={<AlertCircle size={24} />}
              iconClass="orange"
              label="Faol shoshilinch so'rovlar"
              value={stats.active_requests.toString()}
            />
          </div>
        </section>

        {/* Recent Requests */}
        <section>
          <div className="flex items-center justify-between mb-16">
            <h2 style={{ fontSize: '1.25rem' }}>🩸 Oxirgi qon so'rovlari</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/request')}>
              Barchasini ko'rish <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card card-body">
                  <div className="skeleton" style={{ height: '120px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-2">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} onView={() => navigate('/request')} />
              ))}
            </div>
          )}

          {requests.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
              <Droplets size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>Hozircha faol so'rovlar yo'q</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section style={{
          marginTop: '40px',
          background: 'linear-gradient(135deg, var(--color-primary-bg), #fff)',
          border: '1px solid rgba(229, 57, 69, 0.15)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❤️</div>
            <h3 style={{ marginBottom: '8px' }}>Donor bo'lib hayot saqlang</h3>
            <p>Har 3 oyda bir marta qon berish — o'rtacha 3 kishini qutqaradi.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
            Hoziroq boshlang <ArrowRight size={18} />
          </button>
        </section>

        {/* Quick Actions */}
        <section style={{ marginTop: '32px', paddingBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>⚡ Tezkor harakatlar</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: '🗺️ Donor xaritasi', to: '/map' },
              { label: '🤖 AI yordamchi', to: '/ai' },
              { label: '💊 Dori eslatmasi', to: '/medications' },
              { label: '💬 Xabarlar', to: '/chat' },
            ].map(({ label, to }) => (
              <button
                key={to}
                className="btn btn-secondary"
                onClick={() => navigate(to)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ---- Sub components ----

function StatCard({ icon, iconClass, label, value, pulse }: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`} style={{ position: 'relative' }}>
        {icon}
        {pulse && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--color-success)',
            border: '2px solid white',
            animation: 'pulse-green 2s infinite',
          }} />
        )}
      </div>
      <div>
        <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text)' }}>{value}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{label}</div>
      </div>
    </div>
  );
}

function RequestCard({ request, onView }: { request: BloodRequest; onView: () => void }) {
  const urgencyClass = urgencyBadgeClass[request.urgency] || 'badge badge-gray';

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-12">
            <div className="blood-badge">{request.blood_group}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                {request.blood_group} qon kerak
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {request.quantity_units} dona
              </div>
            </div>
          </div>
          <span className={urgencyClass}>
            {URGENCY_LABELS[request.urgency]}
          </span>
        </div>

        <div className="flex gap-4" style={{ flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div className="flex items-center gap-8 text-sm text-secondary">
            <MapPin size={14} />
            <span className="truncate">{request.region}</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-secondary">
            <Clock size={14} />
            <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: uz })}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
          }}>
            {STATUS_LABELS[request.status]}
          </span>
          <button className="btn btn-primary btn-sm" onClick={onView}>
            Batafsil <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
