import React, { useState } from 'react';
import {
  Home, Map, Droplets, Bot, Pill, User, Building2, MessageSquare,
  LogOut, Bell, Shield, Menu, X
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from '../shared/NotificationPanel';

const navItems = [
  { to: '/', icon: Home, label: 'Bosh sahifa' },
  { to: '/map', icon: Map, label: 'Donor xaritasi' },
  { to: '/request', icon: Droplets, label: 'Qon so\'rovlari' },
  { to: '/hospital', icon: Building2, label: 'Shifoxona' },
  { to: '/chat', icon: MessageSquare, label: 'Suhbatlar' },
  { to: '/ai', icon: Bot, label: 'DONOR AI' },
  { to: '/medications', icon: Pill, label: 'Dori eslatmasi' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isDemo } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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
          <span>Demo rejim — barcha funksiyalar to'liq ishchi holatda sinovdan o'tkazish uchun ochiq</span>
        </div>
      )}

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
              Bir donor — bir hayot
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
              <span>Admin Panel</span>
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
            <span>Bildirishnomalar</span>
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
                  {user.blood_group ? `${user.blood_group} guruhi` : 'Qon guruhi belgilanmagan'}
                </div>
              </div>
            </div>
          )}

          <button
            className="sidebar-nav-item"
            style={{ width: '100%', color: '#DC2626', marginTop: '4px' }}
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ paddingTop: isDemo ? '40px' : 0 }}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Bosh</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Map size={20} />
          <span>Xarita</span>
        </NavLink>
        <NavLink to="/request" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Droplets size={20} />
          <span>SOS</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Bot size={20} />
          <span>AI</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profil</span>
        </NavLink>
      </nav>

      {/* Notification Panel Modal */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
