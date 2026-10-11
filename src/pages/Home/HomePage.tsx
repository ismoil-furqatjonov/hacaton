import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Users, Heart, AlertCircle, ChevronRight,
  MapPin, Clock, ArrowRight, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEMO_STATS, DEMO_BLOOD_REQUESTS } from '../../data/demo';
import type { BloodRequest, PlatformStats } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { uz as uzLocale } from 'date-fns/locale/uz';
import { ru as ruLocale } from 'date-fns/locale/ru';
import { enUS as enLocale } from 'date-fns/locale/en-US';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const urgencyBadgeClass: Record<string, string> = {
  low: 'badge badge-green',
  medium: 'badge badge-yellow',
  high: 'badge badge-orange',
  critical: 'badge badge-red',
};

export default function HomePage() {
  const { user, isDemo, enterDemoMode } = useAuth();
  const { t, language } = useLanguage();
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
      const [donorsRes, activeDonorsRes, requestsRes, completedRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_donor', true),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_donor', true).eq('donor_status', 'available'),
        supabase.from('blood_requests').select('id', { count: 'exact' }).not('status', 'in', '(completed,cancelled)'),
        supabase.from('blood_requests').select('id', { count: 'exact' }).eq('status', 'completed'),
      ]);

      setStats({
        total_donors: donorsRes.count || 0,
        active_donors: activeDonorsRes.count || 0,
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

  const getDateLocale = () => {
    if (language === 'ru') return ruLocale;
    if (language === 'en') return enLocale;
    return uzLocale;
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
              {t('home.badge')}
            </div>

            <h1 className="hero-title">
              {t('home.hero_title')}
            </h1>

            <p className="hero-subtitle">
              {t('home.hero_subtitle')}
            </p>

            <div className="hero-buttons">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => user ? navigate('/request') : navigate('/auth')}
                id="btn-need-blood"
              >
                {t('home.btn_need_blood')}
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
                {t('home.btn_become_donor')}
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
                🤖 {t('nav.ai')}
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
                {t('home.btn_explore_map')}
              </button>
            </div>

            {!user && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}
                onClick={enterDemoMode}
              >
                {t('common.demo_mode')} →
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
              <span>{t('common.demo_banner')}</span>
            </div>
          )}
          <div className="grid-4">
            <StatCard
              icon={<Users size={24} />}
              iconClass="red"
              label={t('home.stat_total_donors')}
              value={stats.total_donors.toLocaleString()}
            />
            <StatCard
              icon={<Activity size={24} />}
              iconClass="green"
              label={t('home.stat_active_donors')}
              value={stats.active_donors.toString()}
              pulse
            />
            <StatCard
              icon={<Heart size={24} />}
              iconClass="blue"
              label={t('home.stat_completed_helps')}
              value={stats.completed_helps.toLocaleString()}
            />
            <StatCard
              icon={<AlertCircle size={24} />}
              iconClass="orange"
              label={t('home.stat_active_requests')}
              value={stats.active_requests.toString()}
            />
          </div>
        </section>

        {/* 3 ASOSIY YO'NALISH PLATFORMA KARTALARI */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{
              display: 'inline-block',
              background: '#FEE2E2',
              color: '#DC2626',
              fontWeight: 800,
              fontSize: '0.78rem',
              padding: '4px 12px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              {t('auth.choose_track_title')}
            </span>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A' }}>
              {t('home.features_title')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* 1. DORI */}
            <div
              onClick={() => user ? navigate('/medications') : navigate('/auth')}
              style={{
                background: user?.user_track === 'medication' ? 'linear-gradient(180deg, #FFFFFF, #F0FDF4)' : '#FFFFFF',
                borderRadius: '16px',
                border: user?.user_track === 'medication' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {user?.user_track === 'medication' && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#DCFCE7', color: '#16A34A', fontSize: '0.7rem',
                  fontWeight: 800, padding: '3px 8px', borderRadius: '12px'
                }}>
                  ✓ {t('common.active')}
                </span>
              )}
              <div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px',
                  background: '#DCFCE7', color: '#16A34A', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  marginBottom: '16px',
                }}>
                  💊
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  {t('profile.track_medication')}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('auth.track_medication_desc')}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 700, fontSize: '0.86rem', color: '#16A34A'
              }}>
                {t('medications.tab_catalog')} <ArrowRight size={16} />
              </div>
            </div>

            {/* 2. QON BERISH */}
            <div
              onClick={() => user ? navigate('/profile') : navigate('/auth')}
              style={{
                background: user?.user_track === 'donor' ? 'linear-gradient(180deg, #FFFFFF, #FEF2F2)' : '#FFFFFF',
                borderRadius: '16px',
                border: user?.user_track === 'donor' ? '2px solid #DC2626' : '1px solid #E2E8F0',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {user?.user_track === 'donor' && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#FEE2E2', color: '#DC2626', fontSize: '0.7rem',
                  fontWeight: 800, padding: '3px 8px', borderRadius: '12px'
                }}>
                  ✓ {t('common.active')}
                </span>
              )}
              <div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px',
                  background: '#FEE2E2', color: '#DC2626', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  marginBottom: '16px',
                }}>
                  🩸
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  {t('profile.track_donor')}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('auth.track_donor_desc')}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 700, fontSize: '0.86rem', color: '#DC2626'
              }}>
                {t('profile.page_title')} <ArrowRight size={16} />
              </div>
            </div>

            {/* 3. QON OLISH */}
            <div
              onClick={() => user ? navigate('/request') : navigate('/auth')}
              style={{
                background: user?.user_track === 'recipient' ? 'linear-gradient(180deg, #FFFFFF, #EFF6FF)' : '#FFFFFF',
                borderRadius: '16px',
                border: user?.user_track === 'recipient' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {user?.user_track === 'recipient' && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#DBEAFE', color: '#2563EB', fontSize: '0.7rem',
                  fontWeight: 800, padding: '3px 8px', borderRadius: '12px'
                }}>
                  ✓ {t('common.active')}
                </span>
              )}
              <div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px',
                  background: '#DBEAFE', color: '#2563EB', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  marginBottom: '16px',
                }}>
                  🔍
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  {t('profile.track_recipient')}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('auth.track_recipient_desc')}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontWeight: 700, fontSize: '0.86rem', color: '#2563EB'
              }}>
                {t('requests.page_title')} <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* Recent Requests */}
        <section>
          <div className="flex items-center justify-between mb-16">
            <h2 style={{ fontSize: '1.25rem' }}>🩸 {t('home.recent_requests_title')}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/request')}>
              {t('home.view_all_requests')} <ChevronRight size={16} />
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
                <RequestCard
                  key={req.id}
                  request={req}
                  onView={() => navigate('/request')}
                  t={t}
                  dateLocale={getDateLocale()}
                />
              ))}
            </div>
          )}

          {requests.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
              <Droplets size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>{t('requests.no_requests_found')}</p>
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section style={{
          marginTop: '48px',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 32px',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              {t('home.how_it_works_title')}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.92rem' }}>
              {t('home.how_it_works_subtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📝</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{t('home.step1_title')}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>{t('home.step1_desc')}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔔</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{t('home.step2_title')}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>{t('home.step2_desc')}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❤️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{t('home.step3_title')}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>{t('home.step3_desc')}</p>
            </div>
          </div>
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
            <h3 style={{ marginBottom: '8px' }}>{t('home.badge')}</h3>
            <p>{t('home.recent_requests_subtitle')}</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
            {t('home.btn_become_donor')} <ArrowRight size={18} />
          </button>
        </section>

        {/* Quick Actions */}
        <section style={{ marginTop: '32px', paddingBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>⚡ {t('common.actions')}</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: `🗺️ ${t('nav.map')}`, to: '/map' },
              { label: `🤖 ${t('nav.ai')}`, to: '/ai' },
              { label: `💊 ${t('nav.medications')}`, to: '/medications' },
              { label: `🩸 ${t('nav.requests')}`, to: '/request' },
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

function RequestCard({
  request,
  onView,
  t,
  dateLocale,
}: {
  request: BloodRequest;
  onView: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dateLocale: any;
}) {
  const urgencyClass = urgencyBadgeClass[request.urgency] || 'badge badge-gray';
  const urgencyKey = `requests.urgency_${request.urgency}`;
  const statusKey = `requests.status_${request.status}`;

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
      <div className="card-body">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-12">
            <div className="blood-badge">{request.blood_group}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                {request.blood_group} {t('common.blood_group')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {request.quantity_units} {t('common.units')}
              </div>
            </div>
          </div>
          <span className={urgencyClass}>
            {t(urgencyKey)}
          </span>
        </div>

        <div className="flex gap-4" style={{ flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div className="flex items-center gap-8 text-sm text-secondary">
            <MapPin size={14} />
            <span className="truncate">{request.region}</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-secondary">
            <Clock size={14} />
            <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: dateLocale })}</span>
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
            {t(statusKey)}
          </span>
          <button className="btn btn-primary btn-sm" onClick={onView}>
            {t('common.details')} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
