import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Language } from '../../i18n/types';

interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'uz', label: "O'zbekcha", shortLabel: 'UZ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
];

interface Props {
  variant?: 'dropdown' | 'compact' | 'pill';
  className?: string;
  style?: React.CSSProperties;
}

export default function LanguageSwitcher({ variant = 'dropdown', className = '', style }: Props) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'pill') {
    return (
      <div
        className={`lang-switcher-pill ${className}`}
        style={{
          display: 'inline-flex',
          background: 'var(--color-bg)',
          borderRadius: '24px',
          padding: '3px',
          border: '1px solid var(--color-border)',
          ...style,
        }}
      >
        {LANGUAGES.map((item) => (
          <button
            key={item.code}
            onClick={() => handleSelect(item.code)}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: 'none',
              background: language === item.code ? 'var(--color-primary)' : 'transparent',
              color: language === item.code ? '#FFFFFF' : 'var(--color-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
            title={item.label}
          >
            <span>{item.flag}</span>
            <span>{item.shortLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`lang-switcher-container ${className}`}
      style={{ position: 'relative', display: 'inline-block', zIndex: 110, ...style }}
    >
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="lang-switcher-btn"
        aria-label="Select language"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 12px',
          borderRadius: '10px',
          background: 'var(--color-white)',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
        }}
      >
        <Globe size={16} color="var(--color-primary)" />
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentLang.flag}</span>
        <span style={{ fontWeight: 700 }}>{currentLang.shortLabel}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--color-text-secondary)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="lang-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '150px',
            background: 'var(--color-white)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-border)',
            padding: '6px',
            animation: 'fadeIn 0.15s ease',
            zIndex: 1000,
          }}
        >
          {LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? 'var(--color-primary-bg)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check size={16} color="var(--color-primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
