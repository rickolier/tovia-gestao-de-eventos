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
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

const ADMIN_EMAIL = 'admin@ekko.app';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary font-medium animate-pulse">Iniciando Ekko...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Admin nunca vai para onboarding
  if (user.email === ADMIN_EMAIL) return <Navigate to="/admin" replace />;

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
    <ThemeProvider defaultTheme="light" storageKey="ekko-theme">
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
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
