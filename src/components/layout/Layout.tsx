import React, { useState, useEffect } from 'react';
import {
  Home, Map, Droplets, Bot, Pill, User, Building2,
  LogOut, Bell, Shield, Sun, Moon
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../i18n/LanguageContext';
import NotificationPanel from '../shared/NotificationPanel';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isDemo } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('donor_app_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('donor_app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DN';

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/map', icon: Map, label: t('nav.map') },
    { to: '/request', icon: Droplets, label: t('nav.requests') },
    { to: '/hospital', icon: Building2, label: t('nav.hospital') },
    { to: '/ai', icon: Bot, label: t('nav.ai') },
    { to: '/medications', icon: Pill, label: t('nav.medications') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="app-layout">
      {/* Demo Banner */}
      {isDemo && (
        <div className="demo-banner" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          background: 'linear-gradient(90deg, #1E293B, #0F172A)',
          color: '#E2E8F0',
          borderBottom: '1px solid #334155',
          fontSize: '0.8rem',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#38BDF8' }}>●</span>
          <span>{t('common.demo_banner')}</span>
        </div>
      )}

      {/* Floating Top Bar (Always at top right) */}
      <header
        className="app-topbar"
        style={{
          position: 'fixed',
          top: isDemo ? '32px' : 0,
          right: 0,
          left: 0,
          height: '56px',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 20px',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-border)',
          transition: 'all var(--transition)',
        }}
      >
        {/* Mobile brand logo on top bar */}
        <div className="mobile-topbar-logo" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
          }}>
            🩸
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', letterSpacing: '-0.3px' }}>
            DONOR
          </span>
        </div>

        {/* Quick Notifications Button */}
        <button
          onClick={() => setShowNotifications(true)}
          style={{
            position: 'relative',
            background: 'var(--color-white)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
          }}
          title={t('nav.notifications')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#DC2626',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              boxShadow: '0 2px 5px rgba(220, 38, 38, 0.4)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--color-white)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
          }}
          title={theme === 'dark' ? t('nav.switch_to_light') : t('nav.switch_to_dark')}
        >
          {theme === 'dark' ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#64748B" />}
        </button>

        {/* Language Switcher (Top Right Corner) */}
        <LanguageSwitcher />
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar" style={{ top: isDemo ? '32px' : 0 }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{
            background: 'linear-gradient(135deg, #DC2626, #991B1B)',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          }}>
            🩸
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', letterSpacing: '-0.5px' }}>
              DONOR
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
              {t('nav.slogan')}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Shield size={19} />
              <span>{t('nav.admin')}</span>
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Notifications */}
          <button
            className="sidebar-nav-item"
            style={{ width: '100%', position: 'relative' }}
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={19} />
            <span>{t('nav.notifications')}</span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#DC2626',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            className="sidebar-nav-item"
            style={{ width: '100%', cursor: 'pointer' }}
            onClick={toggleTheme}
            title={theme === 'dark' ? t('nav.switch_to_light') : t('nav.switch_to_dark')}
          >
            {theme === 'dark' ? <Sun size={19} color="#FBBF24" /> : <Moon size={19} color="#64748B" />}
            <span>{theme === 'dark' ? t('nav.light_mode') : t('nav.dark_mode')}</span>
          </button>

          <div className="divider" style={{ margin: '8px 0', borderTop: '1px solid #E2E8F0' }} />

          {/* User info */}
          {user && (
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-sm" style={{ background: '#0F172A', color: 'white', fontWeight: 700 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }} className="truncate">
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                  {user.blood_group ? `${user.blood_group} ${t('common.blood_group').toLowerCase()}` : t('common.not_specified')}
                </div>
                {user.user_track && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: user.user_track === 'medication' ? '#16A34A' : user.user_track === 'donor' ? '#DC2626' : '#2563EB',
                    fontWeight: 700,
                    marginTop: '2px',
                  }}>
                    {user.user_track === 'medication' ? t('profile.track_medication') : user.user_track === 'donor' ? t('profile.track_donor') : t('profile.track_recipient')}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            className="sidebar-nav-item"
            style={{ width: '100%', color: '#DC2626', marginTop: '4px' }}
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>{t('nav.sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ paddingTop: isDemo ? '88px' : '64px' }}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>{t('nav.home')}</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Map size={20} />
          <span>{t('nav.map')}</span>
        </NavLink>
        <NavLink to="/request" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Droplets size={20} />
          <span>SOS</span>
        </NavLink>
        <NavLink to="/hospital" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={20} />
          <span>{t('nav.hospital')}</span>
        </NavLink>
        <NavLink to="/medications" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Pill size={20} />
          <span>{t('nav.medications')}</span>
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Bot size={20} />
          <span>AI</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>{t('nav.profile')}</span>
        </NavLink>
      </nav>

      {/* Notification Panel Modal */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
