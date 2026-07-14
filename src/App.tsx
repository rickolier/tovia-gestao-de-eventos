import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '~/context/AuthContext';
import { ThemeProvider } from '~/context/ThemeProvider';
import Login from './pages/Login';
import Dashboard from '~/features/dashboard/Dashboard';
import CreateEvent from '~/features/events/CreateEvent';
import EventDetail from '~/features/events/EventDetail';
import EditEvent from '~/features/events/EditEvent';
import Onboarding from './pages/Onboarding';
import VerificarEmail from './pages/VerificarEmail';
import Plans from './pages/Plans';
import AguardandoPagamento from './pages/AguardandoPagamento';
import AdminDashboard from '~/features/admin/AdminDashboard';
import LandingPage from './pages/LandingPage';
import CaptacaoPage from './pages/CaptacaoPage';
import PublicRegistration, { PublicRegistrationByCodigo } from '~/features/public-pages/PublicRegistration';
import PublicSalesPage, { PublicSalesPageByCodigo } from '~/features/public-pages/PublicSalesPage';
import PublicOrganizerProfile, { PublicOrganizerProfileByCodigo } from '~/features/public-pages/PublicOrganizerProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermosDeUso from './pages/TermosDeUso';
import BaseConhecimento from './pages/BaseConhecimento';
import ArtigoBaseConhecimento from './pages/ArtigoBaseConhecimento';
import ConsultarInscricao from './pages/ConsultarInscricao';
import CheckinPage from './pages/CheckinPage';
import CheckoutPlano from './pages/CheckoutPlano';
import SatisfacaoPage from './pages/SatisfacaoPage';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

import { isAdminEmail, isDemoEmail } from '~/utils/admin-config';

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

  if (!user) return <Navigate to="/desenvolvimento/login" replace />;

  // Admin nunca vai para onboarding
  if (isAdminEmail(user.email)) return <Navigate to="/desenvolvimento/admin" replace />;

  // Email não verificado — bloqueia acesso ao app (contas demo são isentas)
  if (!user.emailVerified && !isDemoEmail(user.email)) return <Navigate to="/desenvolvimento/verificar-email" replace />;

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
          href="mailto:suporte@toviaapp.com.br"
          className="bg-primary text-white rounded-2xl px-8 py-3 font-bold text-sm"
        >
          Contatar suporte
        </a>
      </div>
    );
  }


  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/desenvolvimento/login" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/desenvolvimento/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="tovia-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<CaptacaoPage />} />
            <Route path="/sobre" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/desenvolvimento" element={<LandingPage />} />
            <Route path="/desenvolvimento/login" element={<Login />} />
            <Route path="/desenvolvimento/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
            <Route path="/desenvolvimento/verificar-email" element={<VerificarEmail />} />
            <Route path="/desenvolvimento/planos" element={<PrivateRoute><Plans /></PrivateRoute>} />
            <Route path="/desenvolvimento/planos/aguardando" element={<PrivateRoute><AguardandoPagamento /></PrivateRoute>} />
            <Route path="/desenvolvimento/checkout-plano" element={<PrivateRoute><CheckoutPlano /></PrivateRoute>} />
            <Route
              path="/desenvolvimento/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/desenvolvimento/eventos/novo"
              element={
                <PrivateRoute>
                  <CreateEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/desenvolvimento/eventos/:id/editar"
              element={
                <PrivateRoute>
                  <EditEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/desenvolvimento/eventos/:id/checkin"
              element={
                <PrivateRoute>
                  <CheckinPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/desenvolvimento/eventos/:id/*"
              element={
                <PrivateRoute>
                  <EventDetail />
                </PrivateRoute>
              }
            />
            <Route path="/desenvolvimento/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/inscricao/:id" element={<PublicRegistration />} />
            <Route path="/:orgCodigo/:eventoCodigo" element={<PublicRegistrationByCodigo />} />
            <Route path="/:orgCodigo/:eventoCodigo/:paginaCodigo" element={<PublicSalesPageByCodigo />} />
            <Route path="/e/:eventoId/:slug" element={<PublicSalesPage />} />
            <Route path="/o/:userId" element={<PublicOrganizerProfile />} />
            <Route path="/:orgCodigo" element={<PublicOrganizerProfileByCodigo />} />
            <Route path="/consultar" element={<ConsultarInscricao />} />
            <Route path="/satisfacao" element={<SatisfacaoPage />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/desenvolvimento/base-de-conhecimento" element={<PrivateRoute><BaseConhecimento /></PrivateRoute>} />
            <Route path="/desenvolvimento/base-de-conhecimento/:slug" element={<PrivateRoute><ArtigoBaseConhecimento /></PrivateRoute>} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
