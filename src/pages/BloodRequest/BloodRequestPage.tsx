import React, { useState, useEffect } from 'react';
import {
  Droplets, MapPin, Clock, AlertTriangle, Check, X,
  Phone, Mail, ChevronDown, Plus, Filter, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DEMO_BLOOD_REQUESTS, BLOOD_GROUPS, REGIONS, URGENCY_LABELS,
  URGENCY_COLORS, STATUS_LABELS
} from '../../data/demo';
import { isValidBloodGroup } from '../../lib/catalogs';
import type { BloodRequest, BloodGroup, UrgencyLevel, RequestStatus } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { uz } from 'date-fns/locale';

const urgencyBorderColors: Record<UrgencyLevel, string> = {
  low: '#1A9550',
  medium: '#F9A825',
  high: '#E65100',
  critical: '#E53945',
};

export default function BloodRequestPage() {
  const { user, isDemo } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('donor_user_blood_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return DEMO_BLOOD_REQUESTS;
  });
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [filterGroup, setFilterGroup] = useState<BloodGroup | ''>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    blood_group: user?.blood_group || '' as BloodGroup | '',
    quantity_units: 1,
    region: user?.region || '',
    hospital: '',
    urgency: 'high' as UrgencyLevel,
    needed_by: '',
    contact_phone: user?.phone || '',
    contact_email: user?.email || '',
    notes: '',
  });

  useEffect(() => {
    if (!isDemo && isSupabaseConfigured && supabase) {
      loadRequests();
    }
  }, [isDemo]);

  // Sahifa yangilanganda ham qo'lda kiritilgan so'rovlar saqlanadi
  useEffect(() => {
    localStorage.setItem('donor_user_blood_requests', JSON.stringify(requests));
  }, [requests]);

  const loadRequests = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('blood_requests')
      .select('*, requester:profiles!requester_id(*)')
      .not('status', 'in', '(completed,cancelled)')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as BloodRequest[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');

    if (!user) { setErrorMsg("Kirish talab qilinadi"); return; }
    if (!form.blood_group || !form.region) {
      setErrorMsg("Qon guruhi va hudud majburiy");
      return;
    }

    if (!isValidBloodGroup(form.blood_group)) {
      setErrorMsg("Ruxsat berilmagan qon guruhi! Faqat rasmiy tasdiqlangan qon guruhlari qabul qilinadi.");
      return;
    }

    setSubmitting(true);

    if (isDemo || !isSupabaseConfigured || !supabase) {
      // Demo mode
      const newReq: BloodRequest = {
        id: `local-${Date.now()}`,
        requester_id: user.id,
        requester: user,
        blood_group: form.blood_group as BloodGroup,
        quantity_units: form.quantity_units,
        region: form.region,
        hospital: form.hospital,
        urgency: form.urgency,
        needed_by: form.needed_by || undefined,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        notes: form.notes,
        status: 'searching',
        matched_donors: Math.floor(Math.random() * 5) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRequests(prev => [newReq, ...prev]);
      setSuccessMsg(`So'rov yuborildi! Demo rejimda ${newReq.matched_donors} ta mos donor topildi.`);
      setShowForm(false);
    } else {
      const { data, error } = await supabase
        .from('blood_requests')
        .insert({
          requester_id: user.id,
          blood_group: form.blood_group,
          quantity_units: form.quantity_units,
          region: form.region,
          hospital: form.hospital,
          urgency: form.urgency,
          needed_by: form.needed_by || null,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          notes: form.notes,
          status: 'searching',
        })
        .select()
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("So'rov yuborildi! Mos donorlar qidirilmoqda...");
        setShowForm(false);
        loadRequests();
      }
    }
    setSubmitting(false);
  };

  const handleRespond = async (requestId: string, response: 'accepted' | 'declined') => {
    if (!user) return;
    setRespondingId(requestId);

    if (isDemo || !isSupabaseConfigured || !supabase) {
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: response === 'accepted' ? 'donor_responded' : r.status } : r
      ));
      setSuccessMsg(response === 'accepted' ? "✅ Javobingiz yuborildi! So'rov egasi siz bilan bog'lanadi." : "Javobingiz qabul qilindi.");
    } else {
      await supabase.from('request_responses').upsert({
        request_id: requestId,
        donor_id: user.id,
        response,
      }, { onConflict: 'request_id,donor_id' });

      if (response === 'accepted') {
        await supabase.from('blood_requests')
          .update({ status: 'donor_responded' })
          .eq('id', requestId);
      }
      loadRequests();
    }
    setRespondingId(null);
  };

  const filtered = requests.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterGroup && r.blood_group !== filterGroup) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>🚨 Qon kerak — SOS</h1>
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>
              {filtered.length} ta faol so'rov
              {isDemo && ' (demo ma\'lumotlar)'}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => user ? setShowForm(true) : undefined}
            id="btn-new-request"
          >
            <Plus size={18} />
            Yangi so'rov
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            value={filterGroup} onChange={e => setFilterGroup(e.target.value as BloodGroup | '')} id="req-filter-group">
            <option value="">Barcha qon guruhlari</option>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value as RequestStatus | '')} id="req-filter-status">
            <option value="">Barcha holatlar</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(filterStatus || filterGroup) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterGroup(''); }}>
              <RefreshCw size={14} /> Tozalash
            </button>
          )}
        </div>
      </div>

      <div className="page-container">
        {/* Messages */}
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <Check size={18} /> <span>{successMsg}</span>
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setSuccessMsg('')}><X size={16} /></button>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={18} /> <span>{errorMsg}</span>
          </div>
        )}

        {/* Request Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <div className="modal-header">
                <h3>🩸 Yangi qon so'rovi</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Qon guruhi *</label>
                      <select className="form-select" value={form.blood_group}
                        onChange={e => setForm(p => ({ ...p, blood_group: e.target.value as BloodGroup }))}
                        required id="form-blood-group">
                        <option value="">Tanlang</option>
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Miqdor (dona) *</label>
                      <input className="form-input" type="number" min={1} max={20}
                        value={form.quantity_units}
                        onChange={e => setForm(p => ({ ...p, quantity_units: parseInt(e.target.value) || 1 }))}
                        id="form-quantity" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hudud / Kasalxona *</label>
                    <input className="form-input" type="text" placeholder="Toshkent, 1-Respublika kasalxonasi"
                      value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                      required id="form-region" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Shoshilinchlik darajasi</label>
                      <select className="form-select" value={form.urgency}
                        onChange={e => setForm(p => ({ ...p, urgency: e.target.value as UrgencyLevel }))}
                        id="form-urgency">
                        <option value="low">🟢 Past</option>
                        <option value="medium">🟡 O'rta</option>
                        <option value="high">🟠 Yuqori</option>
                        <option value="critical">🔴 Kritik</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kerakli sana</label>
                      <input className="form-input" type="datetime-local"
                        value={form.needed_by}
                        onChange={e => setForm(p => ({ ...p, needed_by: e.target.value }))}
                        id="form-needed-by" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input className="form-input" type="tel" placeholder="+998..."
                        value={form.contact_phone}
                        onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                        id="form-phone" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email"
                        value={form.contact_email}
                        onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                        id="form-email" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Qo'shimcha izoh</label>
                    <textarea className="form-input" rows={3} placeholder="Qo'shimcha ma'lumot..."
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      style={{ resize: 'vertical' }} id="form-notes" />
                  </div>

                  <div className="alert alert-warning" style={{ fontSize: '0.8125rem' }}>
                    <AlertTriangle size={16} />
                    <span>So'rov yuborilgach, mos donorlar qidiriladi va ularga bildirishnoma yuboriladi.</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Bekor qilish
                  </button>
                  <button type="submit" className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                    disabled={submitting} id="btn-submit-request">
                    {submitting ? 'Yuborilmoqda...' : '🩸 So\'rov yuborish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Requests list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card card-body">
                <div className="skeleton" style={{ height: '100px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-secondary)' }}>
            <Droplets size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p>Hozircha mos so'rovlar yo'q</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(req => (
              <RequestDetailCard
                key={req.id}
                request={req}
                currentUserId={user?.id}
                onRespond={handleRespond}
                responding={respondingId === req.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestDetailCard({
  request,
  currentUserId,
  onRespond,
  responding,
}: {
  request: BloodRequest;
  currentUserId?: string;
  onRespond: (id: string, resp: 'accepted' | 'declined') => void;
  responding: boolean;
}) {
  const isOwner = currentUserId === request.requester_id;
  const urgencyColor = urgencyBorderColors[request.urgency];

  return (
    <div className="card" style={{ borderLeft: `4px solid ${urgencyColor}` }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div className="blood-badge blood-badge-lg">{request.blood_group}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>
                {request.blood_group} qon guruhi kerak
              </span>
              <span className={`badge ${request.urgency === 'critical' ? 'badge-red' :
                request.urgency === 'high' ? 'badge-orange' :
                  request.urgency === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                {URGENCY_LABELS[request.urgency]}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <MapPin size={14} />
                <span>{request.region}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <Droplets size={14} />
                <span>{request.quantity_units} dona</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <Clock size={14} />
                <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: uz })}</span>
              </div>
            </div>

            {request.needed_by && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--color-error-bg)', color: 'var(--color-error)',
                padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem',
                fontWeight: 600, marginBottom: '12px',
              }}>
                <Clock size={14} />
                Kerak: {format(new Date(request.needed_by), 'dd.MM.yyyy HH:mm')}
              </div>
            )}

            {request.notes && (
              <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
                {request.notes}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-bg)', fontSize: '0.8125rem', fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}>
                  {STATUS_LABELS[request.status]}
                </span>
                {request.matched_donors !== undefined && request.matched_donors > 0 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✅ {request.matched_donors} ta mos donor
                  </span>
                )}
              </div>

              {/* Donor response buttons (only for non-owners) */}
              {!isOwner && request.status !== 'completed' && request.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onRespond(request.id, 'accepted')}
                    disabled={responding}
                    id={`btn-accept-${request.id}`}
                  >
                    <Check size={14} />
                    ✅ Yordam beraman
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => onRespond(request.id, 'declined')}
                    disabled={responding}
                    id={`btn-decline-${request.id}`}
                  >
                    <X size={14} />
                    Hozir bo'lmaydi
                  </button>
                </div>
              )}

              {isOwner && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  👤 Sizning so'rovingiz
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
