import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User, AlertCircle, RefreshCw, ShieldAlert, CheckCircle2, XCircle,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { processUserMessage, type AgentContext } from '../../lib/ai/agentEngine';
import { executeConfirmedBloodRequest, type BloodRequestPayload } from '../../lib/ai/agentTools';
import type { AIMessage, AIAction } from '../../types';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';

export default function AIAgentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialMessages: AIMessage[] = useMemo(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: t('ai.welcome_text'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: t('ai.quick_prompt_compat'), action: 'ask_compat' },
        { label: t('ai.quick_prompt_search'), action: 'navigate', data: { path: '/map' } },
        { label: t('ai.quick_prompt_sos'), action: 'ask_sos' },
        { label: t('ai.quick_prompt_rules'), action: 'ask_rules' },
      ],
    },
  ], [t]);

  const quickPrompts = useMemo(() => {
    if (language === 'ru') {
      return [
        "Кому подходит кровь А+?",
        "Является ли О- универсальным донором?",
        "Что нельзя делать перед сдачей крови?",
        "Мне срочно нужна кровь О+",
        "Поиск доноров в Ташкенте",
      ];
    }
    if (language === 'en') {
      return [
        "Who can receive A+ blood?",
        "Is O- universal donor?",
        "What to avoid before donating blood?",
        "I urgently need O+ blood",
        "Find donors in Tashkent",
      ];
    }
    return [
      "A+ qoni kimlarga to'g'ri keladi?",
      "O- universal donormi?",
      "Qon topshirishdan oldin nimalar qilish mumkin emas?",
      "Menga O+ qon kerak, shoshilinch",
      "Toshkentda donor qidirish",
    ];
  }, [language]);

  // Local storage cache for conversation history
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    const saved = localStorage.getItem('donor_ai_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return initialMessages;
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agentContext, setAgentContext] = useState<AgentContext>({});
  const [pendingConfirmation, setPendingConfirmation] = useState<BloodRequestPayload | null>(null);

  // Til o'zgarganda birinchi xabar bo'lsa yangilash
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'msg-welcome') {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('donor_ai_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearHistory = () => {
    localStorage.removeItem('donor_ai_chat_history');
    setMessages(initialMessages);
    setAgentContext({});
    setPendingConfirmation(null);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setErrorMsg(null);
    setInput('');

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await processUserMessage(query, agentContext, user, controller.signal, language);
      clearTimeout(timeoutId);

      setAgentContext(prev => ({
        ...prev,
        lastIntent: query,
      }));

      if (res.requiresConfirmation && res.confirmationData) {
        setPendingConfirmation(res.confirmationData);
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: res.actions,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      console.error('AI Processing Error:', err);
      setErrorMsg(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Action execution
  const handleActionClick = (action: AIAction) => {
    if (action.action === 'navigate' && action.data?.path) {
      navigate(action.data.path);
    } else if (action.action === 'call' && action.data?.number) {
      window.open(`tel:${action.data.number}`);
    } else if (action.action === 'ask_compat') {
      handleSend(language === 'ru' ? "Расскажи о таблице совместимости групп крови" : language === 'en' ? "Explain blood compatibility table" : "Qon guruhlari mosligi jadvali haqida ma'lumot ber");
    } else if (action.action === 'ask_sos') {
      handleSend(language === 'ru' ? "Мне срочно нужна кровь, начни поиск доноров" : language === 'en' ? "I urgently need blood, start searching donors" : "Menga shoshilinch qon kerak, donor qidiruvini boshla");
    } else if (action.action === 'ask_rules') {
      handleSend(language === 'ru' ? "Каковы правила и подготовка к сдаче крови?" : language === 'en' ? "What are rules and preparations for blood donation?" : "Qon topshirishga tayyorgarlik va talablar qanday?");
    } else if (action.action === 'search_donors' && action.data?.blood_group) {
      handleSend(`${action.data.blood_group} donor`);
    } else {
      handleSend(action.label);
    }
  };

  // Confirmation for SOS / Blood Request
  const handleConfirmRequest = async () => {
    if (!pendingConfirmation) return;
    setLoading(true);
    try {
      const exec = await executeConfirmedBloodRequest(pendingConfirmation, user?.id);
      setPendingConfirmation(null);
      const confirmMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: exec.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: `📋 ${t('nav.requests')}`, action: 'navigate', data: { path: '/request' } },
          { label: `🗺️ ${t('nav.map')}`, action: 'navigate', data: { path: '/map' } },
        ],
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch {
      setErrorMsg(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 20px', minHeight: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          }}>
            <Bot size={26} color="#DC2626" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              DONOR AI <span style={{ fontSize: '0.75rem', background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FCA5A5' }}>Healthcare Assistant</span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              {t('ai.page_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            padding: '7px 12px',
            borderRadius: '8px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#64748B',
            cursor: 'pointer',
          }}
          title={t('ai.btn_clear_history')}
        >
          <Trash2 size={14} /> {t('ai.btn_clear_history')}
        </button>
      </div>

      {/* Medical Disclaimer Banner */}
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: '12px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        fontSize: '0.82rem',
        color: '#991B1B',
      }}>
        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
        <div>
          {t('ai.disclaimer')}
        </div>
      </div>

      {/* Main Chat Box */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '65vh',
        overflow: 'hidden',
      }}>
        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#DC2626',
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isUser ? '#0F172A' : '#F8FAFC',
                      color: isUser ? '#FFFFFF' : '#0F172A',
                      border: isUser ? 'none' : '1px solid #E2E8F0',
                      fontSize: '0.92rem',
                      lineHeight: 1.55,
                      boxShadow: isUser ? '0 2px 8px rgba(15, 23, 42, 0.15)' : 'none',
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    ) : (
                      <MarkdownRenderer content={msg.text || ''} />
                    )}
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color: '#94A3B8',
                    marginTop: '4px',
                    textAlign: isUser ? 'right' : 'left',
                  }}>
                    {msg.timestamp}
                  </div>

                  {/* Actions / Buttons under message */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#DC2626';
                            e.currentTarget.style.color = '#DC2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.color = '#0F172A';
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#FFFFFF',
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending Confirmation Modal / Card */}
          {pendingConfirmation && (
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              borderRadius: '14px',
              padding: '16px',
              maxWidth: '90%',
              alignSelf: 'flex-start',
              boxShadow: '0 6px 16px rgba(245, 158, 11, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: 700, marginBottom: '8px' }}>
                <AlertCircle size={20} />
                <span>{t('ai.confirm_sos_title')}</span>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '10px', fontSize: '0.82rem', marginBottom: '12px', border: '1px solid #FDE68A' }}>
                <div>🩸 <strong>{t('common.blood_group')}:</strong> {pendingConfirmation.blood_group}</div>
                <div>📍 <strong>{t('common.region')}:</strong> {pendingConfirmation.region}</div>
                <div>🏥 <strong>{t('common.hospital')}:</strong> {pendingConfirmation.hospital}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleConfirmRequest}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> {t('ai.confirm_sos_btn')}
                </button>
                <button
                  onClick={() => setPendingConfirmation(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <XCircle size={16} /> {t('ai.cancel_sos_btn')}
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748B',
                fontSize: '0.85rem',
              }}>
                <RefreshCw size={16} className="animate-spin" />
                <span>{t('ai.thinking')}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Footer */}
        <div style={{
          padding: '8px 16px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              style={{
                fontSize: '0.78rem',
                padding: '5px 10px',
                borderRadius: '20px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#475569',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            padding: '12px 16px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai.prompt_placeholder')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.92rem',
              outline: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
            }}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: input.trim() && !loading ? '#DC2626' : '#94A3B8',
              color: '#FFFFFF',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s ease',
            }}
          >
            <Send size={16} />
            <span>{t('ai.btn_send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
