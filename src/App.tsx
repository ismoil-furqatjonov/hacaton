import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthPage from './pages/Auth/AuthPage';

// Code Splitting with React.lazy
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const MapPage = lazy(() => import('./pages/Map/MapPage'));
const BloodRequestPage = lazy(() => import('./pages/BloodRequest/BloodRequestPage'));
const HospitalPage = lazy(() => import('./pages/Hospital/HospitalPage'));
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'));
const AIAgentPage = lazy(() => import('./pages/AIAgent/AIAgentPage'));
const MedicationsPage = lazy(() => import('./pages/Medications/MedicationsPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        background: 'linear-gradient(135deg, #DC2626, #991B1B)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
      }}>
        🩸
      </div>
      <p style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 500 }}>
        Yuklanmoqda...
      </p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary fallbackTitle="Ilovada kutilmagan xatolik yuz berdi">
      <Routes>
        {/* Auth page */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Protected layout routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/request" element={<BloodRequestPage />} />
                    <Route path="/hospital" element={<HospitalPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/ai" element={<AIAgentPage />} />
                    <Route path="/medications" element={<MedicationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
