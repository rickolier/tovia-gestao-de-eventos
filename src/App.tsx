import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import EditEvent from './pages/EditEvent';
import Onboarding from './pages/Onboarding';
import Plans from './pages/Plans';
import AguardandoPagamento from './pages/AguardandoPagamento';
import AdminDashboard from './pages/admin/AdminDashboard';
import LandingPage from './pages/LandingPage';
import PublicRegistration from './pages/PublicRegistration';
import PublicSalesPage from './pages/PublicSalesPage';
import PublicOrganizerProfile from './pages/PublicOrganizerProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermosDeUso from './pages/TermosDeUso';
import BaseConhecimento from './pages/BaseConhecimento';
import ArtigoBaseConhecimento from './pages/ArtigoBaseConhecimento';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

const ADMIN_EMAIL = 'admin@tovia.app';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary font-medium animate-pulse">Iniciando Tovia...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Admin nunca vai para onboarding
  if (user.email === ADMIN_EMAIL) return <Navigate to="/admin" replace />;

  // Conta desativada
  if (profile?.desativado) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Conta desativada</h1>
          <p className="text-gray-500 mt-2 max-w-sm">
            Sua conta foi desativada. Entre em contato com o suporte para mais informações.
          </p>
        </div>
        <a
          href="mailto:suporte@tovia.app"
          className="bg-primary text-white rounded-2xl px-8 py-3 font-bold text-sm"
        >
          Contatar suporte
        </a>
      </div>
    );
  }

  // Novo usuário sem plano → onboarding
  if (profile && !profile.plano) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="tovia-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/planos" element={<PrivateRoute><Plans /></PrivateRoute>} />
            <Route path="/planos/aguardando" element={<PrivateRoute><AguardandoPagamento /></PrivateRoute>} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/eventos/novo"
              element={
                <PrivateRoute>
                  <CreateEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/eventos/:id/editar"
              element={
                <PrivateRoute>
                  <EditEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/eventos/:id/*"
              element={
                <PrivateRoute>
                  <EventDetail />
                </PrivateRoute>
              }
            />
            <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/inscricao/:id" element={<PublicRegistration />} />
            <Route path="/e/:eventoId/:slug" element={<PublicSalesPage />} />
            <Route path="/o/:userId" element={<PublicOrganizerProfile />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/base-de-conhecimento" element={<BaseConhecimento />} />
            <Route path="/base-de-conhecimento/:slug" element={<ArtigoBaseConhecimento />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
