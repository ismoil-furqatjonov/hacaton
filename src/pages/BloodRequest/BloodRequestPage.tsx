import React, { useState, useEffect } from 'react';
import {
  Droplets, MapPin, Clock, AlertTriangle, Check, X,
  Plus, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  DEMO_BLOOD_REQUESTS, BLOOD_GROUPS, REGIONS
} from '../../data/demo';
import { isValidBloodGroup } from '../../lib/catalogs';
import type { BloodRequest, BloodGroup, UrgencyLevel, RequestStatus } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCompatibleDonorsForRecipient, canDonateBlood } from '../../lib/bloodCompatibility';
import { formatDistanceToNow, format } from 'date-fns';
import { uz as uzLocale } from 'date-fns/locale/uz';
import { ru as ruLocale } from 'date-fns/locale/ru';
import { enUS as enLocale } from 'date-fns/locale/en-US';

const urgencyBorderColors: Record<UrgencyLevel, string> = {
  low: '#1A9550',
  medium: '#F9A825',
  high: '#E65100',
  critical: '#E53945',
};

export default function BloodRequestPage() {
  const { user, isDemo } = useAuth();
  const { t, language } = useLanguage();
  
  // Faqat foydalanuvchi qo'lda kiritgan so'rovlar (demo ma'lumotlar bilan qorishib ketmaydi)
  const [userCreatedRequests, setUserCreatedRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('donor_user_created_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });

  const [serverRequests, setServerRequests] = useState<BloodRequest[]>(() => {
    return isDemo ? DEMO_BLOOD_REQUESTS : [];
  });

  const requests = React.useMemo(() => {
    return [...userCreatedRequests, ...serverRequests];
  }, [userCreatedRequests, serverRequests]);

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

  const getDateLocale = () => {
    if (language === 'ru') return ruLocale;
    if (language === 'en') return enLocale;
    return uzLocale;
  };

  const loadRequests = React.useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('blood_requests')
      .select('*, requester:profiles!requester_id(*)')
      .not('status', 'in', '(completed,cancelled)')
      .order('created_at', { ascending: false });
    if (data) setServerRequests(data as BloodRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isDemo && isSupabaseConfigured && supabase) {
      loadRequests();
    } else {
      setServerRequests(DEMO_BLOOD_REQUESTS);
    }
  }, [isDemo, loadRequests]);

  // Foydalanuvchi yaratgan so'rovlarni saqlash
  useEffect(() => {
    localStorage.setItem('donor_user_created_requests', JSON.stringify(userCreatedRequests));
  }, [userCreatedRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');

    if (!user) { setErrorMsg(t('auth.error_fill_fields')); return; }
    if (!form.blood_group || !form.region) {
      setErrorMsg(t('auth.error_fill_fields'));
      return;
    }

    if (!isValidBloodGroup(form.blood_group)) {
      setErrorMsg(t('common.error'));
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
      setUserCreatedRequests(prev => [newReq, ...prev]);
      setSuccessMsg(t('requests.created_success'));
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
        setSuccessMsg(t('requests.created_success'));
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
      setUserCreatedRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: response === 'accepted' ? 'donor_responded' : r.status } : r
      ));
      setServerRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: response === 'accepted' ? 'donor_responded' : r.status } : r
      ));
      setSuccessMsg(response === 'accepted' ? t('requests.responded_success') : t('requests.response_cancelled'));
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
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>🚨 {t('requests.page_title')}</h1>
            <p style={{ fontSize: '0.8125rem', margin: 0 }}>
              {filtered.length} {t('requests.page_subtitle')}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => user ? setShowForm(true) : undefined}
            id="btn-new-request"
          >
            <Plus size={18} />
            {t('requests.btn_new_request')}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            value={filterGroup} onChange={e => setFilterGroup(e.target.value as BloodGroup | '')} id="req-filter-group">
            <option value="">{t('requests.filter_all_groups')}</option>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.875rem' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value as RequestStatus | '')} id="req-filter-status">
            <option value="">{t('requests.filter_all_status')}</option>
            {(['new', 'searching', 'donor_responded', 'agreed', 'completed', 'cancelled'] as RequestStatus[]).map((st) => (
              <option key={st} value={st}>{t(`requests.status_${st}`)}</option>
            ))}
          </select>
          {(filterStatus || filterGroup) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterGroup(''); }}>
              <RefreshCw size={14} /> {t('common.cancel')}
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
                <h3>🩸 {t('requests.modal_title')}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_blood_group')} *</label>
                      <select className="form-select" value={form.blood_group}
                        onChange={e => setForm(p => ({ ...p, blood_group: e.target.value as BloodGroup }))}
                        required id="form-blood-group">
                        <option value="">{t('auth.select_blood_group')}</option>
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_units')} *</label>
                      <input className="form-input" type="number" min={1} max={20}
                        value={form.quantity_units}
                        onChange={e => setForm(p => ({ ...p, quantity_units: parseInt(e.target.value) || 1 }))}
                        id="form-quantity" />
                    </div>
                  </div>

                  {form.blood_group && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ fontWeight: 700, color: '#991B1B' }}>{t('requests.compatible_donors')}:</span>
                      {getCompatibleDonorsForRecipient(form.blood_group).map(g => (
                        <span key={g} style={{
                          background: '#FFFFFF',
                          color: '#DC2626',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: '1px solid #FCA5A5',
                          fontSize: '0.74rem'
                        }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">{t('requests.form_region')} *</label>
                    <input className="form-input" type="text" placeholder={t('requests.form_region')}
                      value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                      required id="form-region" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_urgency')}</label>
                      <select className="form-select" value={form.urgency}
                        onChange={e => setForm(p => ({ ...p, urgency: e.target.value as UrgencyLevel }))}
                        id="form-urgency">
                        <option value="low">🟢 {t('requests.urgency_low')}</option>
                        <option value="medium">🟡 {t('requests.urgency_medium')}</option>
                        <option value="high">🟠 {t('requests.urgency_high')}</option>
                        <option value="critical">🔴 {t('requests.urgency_critical')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_needed_by')}</label>
                      <input className="form-input" type="datetime-local"
                        value={form.needed_by}
                        onChange={e => setForm(p => ({ ...p, needed_by: e.target.value }))}
                        id="form-needed-by" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_phone')}</label>
                      <input className="form-input" type="tel" placeholder="+998..."
                        value={form.contact_phone}
                        onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                        id="form-phone" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('requests.form_email')}</label>
                      <input className="form-input" type="email"
                        value={form.contact_email}
                        onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                        id="form-email" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('requests.form_notes')}</label>
                    <textarea className="form-input" rows={3} placeholder={t('requests.form_notes')}
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      style={{ resize: 'vertical' }} id="form-notes" />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                    disabled={submitting} id="btn-submit-request">
                    {submitting ? t('requests.form_submitting') : `🩸 ${t('requests.form_submit')}`}
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
            <p>{t('requests.no_requests_found')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(req => (
              <RequestDetailCard
                key={req.id}
                request={req}
                currentUserId={user?.id}
                currentUserBloodGroup={user?.blood_group as BloodGroup | undefined}
                onRespond={handleRespond}
                responding={respondingId === req.id}
                t={t}
                dateLocale={getDateLocale()}
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
  currentUserBloodGroup,
  onRespond,
  responding,
  t,
  dateLocale,
}: {
  request: BloodRequest;
  currentUserId?: string;
  currentUserBloodGroup?: BloodGroup;
  onRespond: (id: string, resp: 'accepted' | 'declined') => void;
  responding: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  dateLocale: any;
}) {
  const isOwner = currentUserId === request.requester_id;
  const urgencyColor = urgencyBorderColors[request.urgency];
  const urgencyKey = `requests.urgency_${request.urgency}`;
  const statusKey = `requests.status_${request.status}`;

  return (
    <div className="card" style={{ borderLeft: `4px solid ${urgencyColor}` }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div className="blood-badge blood-badge-lg">{request.blood_group}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>
                {request.blood_group} {t('common.blood_group')}
              </span>
              <span className={`badge ${request.urgency === 'critical' ? 'badge-red' :
                request.urgency === 'high' ? 'badge-orange' :
                  request.urgency === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                {t(urgencyKey)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <MapPin size={14} />
                <span>{request.region}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <Droplets size={14} />
                <span>{request.quantity_units} {t('common.units')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <Clock size={14} />
                <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: dateLocale })}</span>
              </div>
            </div>

            {/* Mos keluvchi donor guruhlari badge qatori */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '6px 10px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                {t('requests.compatible_donors')}:
              </span>
              {getCompatibleDonorsForRecipient(request.blood_group).map(g => (
                <span key={g} style={{
                  padding: '2px 7px',
                  borderRadius: '5px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                }}>
                  {g}
                </span>
              ))}
              {currentUserBloodGroup && canDonateBlood(currentUserBloodGroup, request.blood_group) && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#DCFCE7',
                  color: '#16A34A',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  ✓ {t('requests.compatible_donors_tip')}
                </span>
              )}
            </div>

            {request.needed_by && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--color-error-bg)', color: 'var(--color-error)',
                padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem',
                fontWeight: 600, marginBottom: '12px',
              }}>
                <Clock size={14} />
                {t('requests.form_needed_by')}: {format(new Date(request.needed_by), 'dd.MM.yyyy HH:mm')}
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
                  {t(statusKey)}
                </span>
                {request.matched_donors !== undefined && request.matched_donors > 0 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✅ {request.matched_donors} {t('map.donors_count')}
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
                    {t('requests.btn_respond')}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => onRespond(request.id, 'declined')}
                    disabled={responding}
                    id={`btn-decline-${request.id}`}
                  >
                    <X size={14} />
                    {t('requests.btn_cancel_response')}
                  </button>
                </div>
              )}

              {isOwner && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  👤 {t('profile.personal_info')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
