import React, { useState } from 'react';
import {
  MessageSquare, Send, Shield, Phone, AlertCircle,
  CheckCheck, User, Search, Lock, MoreVertical, Ban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_CONVERSATIONS } from '../../data/demo';
import type { Conversation, Message } from '../../types';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState<string>(DEMO_CONVERSATIONS[0]?.id || '');
  const [inputText, setInputText] = useState('');

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: activeChat.id,
      sender_id: user?.id || 'demo-user-1',
      content: inputText.trim(),
      is_read: true,
      created_at: new Date().toISOString(),
    };

    setConversations((prev: Conversation[]) => prev.map((c: Conversation) => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          messages: [...(c.messages || []), newMessage],
          last_message: newMessage,
          updated_at: newMessage.created_at,
        };
      }
      return c;
    }));

    setInputText('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', height: 'calc(100vh - 110px)' }}>
      {/* Privacy Notice Banner */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '12px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        fontSize: '0.82rem',
        color: '#1E40AF',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} />
          <span>
            <strong>Maxfiy muloqot:</strong> Telefon raqamingiz begonalar uchun yashirin. Faqat ikkala tomon rozilik bergandagina aloqa ma'lumotlari ochiladi.
          </span>
        </div>
      </div>

      {/* Main Chat Layout Container */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        height: 'calc(100% - 60px)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      }}>
        {/* Left: Conversations list */}
        <div style={{
          width: '320px',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          background: '#F8FAFC',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Suhbatlar
            </h2>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Qidirish..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  background: '#FFFFFF',
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map((conv) => {
              const isActive = conv.id === activeChatId;
              const otherPerson = conv.donor?.full_name || "Jasur Ahmedov (Donor)";
              const bloodGroup = conv.donor?.blood_group || "O+";
              const lastText = typeof conv.last_message === 'string'
                ? conv.last_message
                : conv.last_message?.content || "Suhbat boshlandi";

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    borderLeft: isActive ? '4px solid #DC2626' : '4px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}>
                    {bloodGroup}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                        {otherPerson}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {conv.updated_at
                          ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px',
                    }}>
                      {lastText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        {activeChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
            {/* Chat Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}>
                  {activeChat.donor?.blood_group || "O+"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                    {activeChat.donor?.full_name || "Jasur Ahmedov (Donor)"}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
                    Online • Qon topshirishga tayyor
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => alert("Telefon raqami almashish so'rovi yuborildi.")}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Phone size={14} /> Raqam almashish
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {(activeChat.messages || []).map((msg: Message, i: number) => {
                const isMe = msg.sender_id === user?.id || msg.sender_id === 'demo-user-1';
                return (
                  <div
                    key={msg.id || i}
                    style={{
                      maxWidth: '75%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe ? '#0F172A' : '#F1F5F9',
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Xabaringizni yozing..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: inputText.trim() ? '#DC2626' : '#CBD5E1',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={16} /> Yuborish
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            Suhbat tanlang
          </div>
        )}
      </div>
    </div>
  );
}
