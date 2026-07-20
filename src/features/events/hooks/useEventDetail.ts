import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, listDocuments } from '~/services/firestore';
import { Evento, AppNotification } from '~/types';
import { where } from 'firebase/firestore';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';
import { hasTourBeenSeen, TourId } from '~/features/dashboard/OnboardingTour';

export function useEventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<TourId | null>(null);

  const plan = getPlanConfig(profile?.plano);

  const isOwner = !!user && !!evento && evento.criado_por === user.uid;
  const guestEntry = user && evento ? (evento.equipe || []).find(m => m.userId === user.uid) : null;
  const isGuest = !!guestEntry && !isOwner;
  const guestPerms = guestEntry?.permissoes ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchEventoData = async () => {
    if (!id) return;
    const data = await getDocument<Evento>('eventos', id);
    if (!data) {
      navigate('/dashboard');
      return;
    }
    setEvento({ ...data, id });
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    if (!user || !id) return;
    try {
      const data = await listDocuments<AppNotification>('notificacoes', [
        where('userId', '==', user.uid),
        where('eventoId', '==', id),
        where('lida', '==', false),
      ]);
      setUnreadNotifications(data.length);
    } catch (error) {
      console.error('Error fetching event unread notifications:', error);
    }
  };

  useEffect(() => {
    fetchEventoData().then(() => {
      if (user && !hasTourBeenSeen(user.uid, 'inscricoes')) setActiveTourId('inscricoes');
    });
  }, [id, navigate]);

  useEffect(() => {
    fetchUnreadCount();
  }, [user, id, activeTab]);

  useEffect(() => {
    const tabToCategory: Record<string, string> = {
      tickets: 'Inscrições', 'sales-pages': 'Inscrições', registrations: 'Inscrições', 'checkin-list': 'Inscrições',
      financial: 'Financeiro', donations: 'Financeiro',
      calculadora: 'Gestão', management: 'Gestão', grupos: 'Gestão', tarefas: 'Gestão',
    };
    const cat = tabToCategory[activeTab];
    if (cat) setExpandedSections(prev => new Set([...prev, cat]));
  }, [activeTab]);

  const toggleSection = (category: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  return {
    id, user, profile, plan,
    evento, loading,
    activeTab, setActiveTab,
    unreadNotifications,
    sidebarOpen, setSidebarOpen,
    expandedSections, mobileSubmenu, setMobileSubmenu,
    activeTourId, setActiveTourId,
    isOwner, isGuest, guestPerms,
    handleLogout, fetchEventoData,
    toggleSection,
  };
}
