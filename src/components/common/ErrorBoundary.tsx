import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const savedLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('donor_language') : 'uz') || 'uz';
      const messages = {
        uz: {
          title: this.props.fallbackTitle || 'Sahifada kutilmagan xatolik yuz berdi',
          desc: "Xavotir olmang, ma'lumotlaringiz xavfsiz. Ushbu komponentni qayta yuklash yoki bosh sahifaga qaytishingiz mumkin.",
          retry: 'Qayta urinish',
          home: 'Bosh sahifa',
        },
        ru: {
          title: this.props.fallbackTitle || 'Произошла непредвиденная ошибка',
          desc: 'Не беспокойтесь, ваши данные в безопасности. Вы можете перезагрузить эту страницу или вернуться на главную.',
          retry: 'Повторить попытку',
          home: 'На главную',
        },
        en: {
          title: this.props.fallbackTitle || 'An unexpected error occurred',
          desc: "Don't worry, your data is safe. You can reload this component or return to the home page.",
          retry: 'Try again',
          home: 'Home page',
        },
      };
      const text = messages[savedLang as 'uz' | 'ru' | 'en'] || messages.uz;

      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
            padding: '32px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              {text.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              {text.desc}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} /> {text.retry}
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} /> {text.home}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
