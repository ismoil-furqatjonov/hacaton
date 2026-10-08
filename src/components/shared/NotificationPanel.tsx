import React from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';

const typeIcons: Record<string, string> = {
  blood_request: '🩸',
  donor_response: '✅',
  new_message: '💬',
  request_status_changed: '📋',
  medication_reminder: '💊',
  admin_review: '🛡️',
};

interface Props {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          maxWidth: '100vw',
          background: 'var(--color-white)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 0.2s ease',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div className="flex items-center gap-8">
            <Bell size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Bildirishnomalar</span>
            {unreadCount > 0 && (
              <span className="badge badge-red">{unreadCount}</span>
            )}
          </div>
          <div className="flex gap-8">
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllAsRead} title="Hammasini o'qilgan qil">
                <CheckCheck size={16} />
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
              <Bell size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>Bildirishnomalar yo'q</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer',
                  background: notif.is_read ? 'transparent' : 'rgba(229, 57, 69, 0.04)',
                  borderLeft: notif.is_read ? '3px solid transparent' : '3px solid var(--color-primary)',
                  transition: 'background var(--transition)',
                }}
                className="notification-item"
              >
                <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                  {typeIcons[notif.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: notif.is_read ? 500 : 700, fontSize: '0.875rem', marginBottom: '2px' }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {notif.body}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: uz })}
                  </div>
                </div>
                {!notif.is_read && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--color-primary)', flexShrink: 0, marginTop: '4px',
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
