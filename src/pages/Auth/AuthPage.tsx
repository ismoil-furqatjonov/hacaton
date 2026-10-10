import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Droplets, MapPin,
  AlertCircle, Check, Pill, HeartHandshake, Search, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BLOOD_GROUPS, REGIONS } from '../../data/demo';
import type { UserTrack } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, enterDemoMode, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 3 ta Asosiy Yo'nalish
  const [selectedTrack, setSelectedTrack] = useState<UserTrack>('donor');

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register form
  const [regData, setRegData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    blood_group: '',
    region: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!loginData.email || !loginData.password) {
      setError("Email va parolni kiriting");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signIn(loginData.email, loginData.password);
    setSubmitting(false);
    if (err) { setError(err); return; }
    navigate('/');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!regData.full_name || !regData.email || !regData.password) {
      setError("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    if (regData.password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lsin");
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }
    if (selectedTrack === 'donor' && !regData.blood_group) {
      setError("Donor bo'lish uchun qon guruhingizni ko'rsatish shart");
      return;
    }

    setSubmitting(true);
    const { error: err } = await signUp({
      email: regData.email,
      password: regData.password,
      full_name: regData.full_name,
      phone: regData.phone,
      blood_group: regData.blood_group,
      region: regData.region,
      user_track: selectedTrack,
    });
    setSubmitting(false);
    if (err) { setError(err); return; }

    setSuccess("Ro'yxatdan muvaffaqiyatli o'tdingiz!");

    // Tanlangan yo'nalish bo'yicha darhol tegishli sahifaga yo'naltirish
    setTimeout(() => {
      if (selectedTrack === 'medication') {
        navigate('/medications');
      } else if (selectedTrack === 'recipient') {
        navigate('/request');
      } else {
        navigate('/profile');
      }
    }, 700);
  };

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  const handleDemo = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a0b 0%, #2d0d10 50%, #1a0a0b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorations */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="blood-cell"
          style={{
            width: `${100 + i * 60}px`,
            height: `${100 + i * 60}px`,
            top: `${i * 25}%`,
            left: i % 2 === 0 ? `${i * 10}%` : undefined,
            right: i % 2 === 1 ? `${i * 8}%` : undefined,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}

      <div style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth: mode === 'register' ? '620px' : '460px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        transition: 'max-width 0.25s ease',
      }}>
        {/* Logo Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          padding: '32px',
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px', animation: 'heartbeat 3s infinite' }}>🩸</div>
          <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900 }}>DONOR</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Bir donor — bir hayot</p>
        </div>

        <div style={{ padding: '32px' }}>
          {/* Mode tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '24px',
          }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition)',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {m === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              <Check size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Supabase not configured warning */}
          {!isSupabaseConfigured && (
            <div className="alert alert-warning" style={{ marginBottom: '16px', fontSize: '0.8125rem' }}>
              <AlertCircle size={16} />
              <span>Supabase sozlanmagan. Demo rejimdan foydalaning yoki .env faylni to'ldiring.</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-text-secondary)'
                  }} />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="email@misol.com"
                    style={{ paddingLeft: '40px' }}
                    value={loginData.email}
                    onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                    id="login-email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Parol</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-text-secondary)'
                  }} />
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Parolingiz"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    value={loginData.password}
                    onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--color-text-secondary)',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  style={{ textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 600 }}
                  onClick={() => setMode('forgot')}
                >
                  Parolni unutdingizmi?
                </button>
              </div>

              <button type="submit" className={`btn btn-primary btn-full ${submitting ? 'btn-loading' : ''}`}
                disabled={submitting || isLoading} id="btn-login">
                {submitting ? 'Kirish...' : 'Kirish'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 3 TA ASOSIY YO'NALISH */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#DC2626" /> Asosiy yo'nalishingizni tanlang:
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '10px',
                  marginBottom: '6px',
                }}>
                  {/* Track 1: DORI */}
                  <div
                    onClick={() => setSelectedTrack('medication')}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '12px',
                      border: selectedTrack === 'medication' ? '2px solid #059669' : '1px solid #CBD5E1',
                      background: selectedTrack === 'medication' ? '#ECFDF5' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {selectedTrack === 'medication' && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#059669', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ background: '#D1FAE5', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        <Pill size={18} color="#059669" />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>DORI</div>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#475569', margin: 0, lineHeight: 1.35 }}>
                      Dorilar katalogi, qabul qilish jadvali va eslatmalar olish.
                    </p>
                  </div>

                  {/* Track 2: QON BERISH */}
                  <div
                    onClick={() => setSelectedTrack('donor')}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '12px',
                      border: selectedTrack === 'donor' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                      background: selectedTrack === 'donor' ? '#FEF2F2' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {selectedTrack === 'donor' && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#DC2626', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ background: '#FEE2E2', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        <HeartHandshake size={18} color="#DC2626" />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>QON BERISH</div>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#475569', margin: 0, lineHeight: 1.35 }}>
                      Donor bo'lish, qon topshirishga tayyorlik va insonlarga yordam.
                    </p>
                  </div>

                  {/* Track 3: QON OLISH */}
                  <div
                    onClick={() => setSelectedTrack('recipient')}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '12px',
                      border: selectedTrack === 'recipient' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: selectedTrack === 'recipient' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {selectedTrack === 'recipient' && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#2563EB', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ background: '#DBEAFE', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                        <Droplets size={18} color="#2563EB" />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>QON OLISH</div>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#475569', margin: 0, lineHeight: 1.35 }}>
                      Shoshilinch qon so'rovi yaratish va mos donorlar bilan bog'lanish.
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '8px' }}>
                  ℹ️ Tanlangan yo'nalishni keyinchalik Profil sozlamalaridan xohlagan paytda o'zgartira olasiz.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ism va familiya *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input className="form-input" type="text" placeholder="Ism Familiya" style={{ paddingLeft: '40px' }}
                    value={regData.full_name} onChange={e => setRegData(p => ({ ...p, full_name: e.target.value }))} id="reg-name" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input className="form-input" type="email" placeholder="email@misol.com" style={{ paddingLeft: '40px' }}
                      value={regData.email} onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} id="reg-email" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input className="form-input" type="tel" placeholder="+998901234567" style={{ paddingLeft: '40px' }}
                      value={regData.phone} onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))} id="reg-phone" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">
                    {selectedTrack === 'donor' ? 'Qon guruhi * (Donorlik uchun)' : selectedTrack === 'recipient' ? 'Kerakli qon guruhi' : 'Qon guruhi (Ixtiyoriy)'}
                  </label>
                  <select className="form-select" value={regData.blood_group}
                    onChange={e => setRegData(p => ({ ...p, blood_group: e.target.value }))} id="reg-blood-group" required={selectedTrack === 'donor'}>
                    <option value="">Tanlang</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hudud</label>
                  <select className="form-select" value={regData.region}
                    onChange={e => setRegData(p => ({ ...p, region: e.target.value }))} id="reg-region">
                    <option value="">Tanlang</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Parol *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Kamida 8 ta belgi"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    value={regData.password} onChange={e => setRegData(p => ({ ...p, password: e.target.value }))} id="reg-password" required />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Parolni tasdiqlang *</label>
                <input className="form-input" type="password" placeholder="Parolni qaytaring"
                  value={regData.confirmPassword} onChange={e => setRegData(p => ({ ...p, confirmPassword: e.target.value }))} id="reg-confirm-password" required />
              </div>

              <button type="submit" className={`btn btn-primary btn-full ${submitting ? 'btn-loading' : ''}`}
                disabled={submitting} id="btn-register">
                {submitting ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
              </button>
            </form>
          )}

          {/* Forgot password */}
          {mode === 'forgot' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '20px' }}>Parolni tiklash uchun email manzilingizni kiriting.</p>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input className="form-input" type="email" placeholder="Email manzilingiz" />
              </div>
              <button className="btn btn-primary btn-full">Parolni tiklash</button>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={() => setMode('login')}>
                ← Kirishga qaytish
              </button>
            </div>
          )}

          {/* Divider */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>yoki</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
              </div>

              {/* Google */}
              <button className="btn btn-secondary btn-full" onClick={handleGoogle} id="btn-google-login"
                style={{ marginBottom: '12px' }}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={18} />
                Google orqali kirish
              </button>

              {/* Demo */}
              <button className="btn btn-ghost btn-full" onClick={handleDemo} id="btn-demo"
                style={{ color: 'var(--color-info)' }}>
                🔵 Demo rejimda ko'rish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
