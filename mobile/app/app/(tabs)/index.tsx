import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useEventos, EventoComInscritos } from '../../hooks/useEventos';
import { Typography, Radius } from '../../constants/typography';
import TopBar from '../../components/shared/TopBar';
import ProfileSheet from '../../components/shared/ProfileSheet';
import EventCard from '../../components/ui/EventCard';
import EventoDetailModal from '../../components/ui/EventoDetailModal';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { HomeSkeleton } from '../../components/ui/Skeleton';

function saudacao(nome: string) {
  const hora = new Date().getHours();
  const period = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiro = nome.split(' ')[0];
  return `${period}, ${primeiro}!`;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { hoje, proximos, encerrados, loading, toggleAtivo } = useEventos();
  const [refreshing, setRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [eventoSel, setEventoSel] = useState<EventoComInscritos | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const totalAtivos = [...hoje, ...proximos].length;
  const isEmpty = hoje.length === 0 && proximos.length === 0 && encerrados.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]} edges={['top']}>
      {/* Top bar sobre fundo verde */}
      <TopBar onAvatarPress={() => setProfileOpen(true)} transparent />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />
      {eventoSel && (
        <EventoDetailModal
          evento={eventoSel}
          onClose={() => setEventoSel(null)}
          onToggleAtivo={(id, v) => { toggleAtivo(id, v); setEventoSel((e) => e ? { ...e, ativo: v } : e); }}
        />
      )}

      {loading ? (
        <HomeSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, isEmpty && styles.scrollEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={[colors.primary]}
            />
          }
        >
          {/* Saudação — sobre o verde */}
          {profile?.name && (
            <View style={styles.greetSection}>
              <View style={[styles.greetIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Sparkles size={16} color="#fff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.h3, { color: '#fff' }]}>{saudacao(profile.name)}</Text>
                <Text style={[Typography.small, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
                  Tudo pronto para o seu próximo evento?
                </Text>
              </View>
            </View>
          )}

          {/* Ficha branca com bordas arredondadas no topo */}
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.pageHeader}>
              <Text style={[Typography.display, { color: colors.foreground }]}>Meus Eventos</Text>
              {totalAtivos > 0 && (
                <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
                  {totalAtivos} evento{totalAtivos !== 1 ? 's' : ''} ativo{totalAtivos !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {isEmpty && <EmptyState />}

            {hoje.length > 0 && (
              <>
                <SectionHeader title="Em andamento" count={hoje.length} />
                {hoje.map((ev) => (
                  <EventCard key={ev.id} evento={ev} destaque onPress={setEventoSel} />
                ))}
              </>
            )}

            {proximos.length > 0 && (
              <>
                <SectionHeader title="Próximos eventos" count={proximos.length} />
                {proximos.map((ev) => (
                  <EventCard key={ev.id} evento={ev} onPress={setEventoSel} />
                ))}
              </>
            )}

            {encerrados.length > 0 && (
              <>
                <SectionHeader title="Encerrados" count={encerrados.length} />
                <View style={{ opacity: 0.65 }}>
                  {encerrados.map((ev) => (
                    <EventCard key={ev.id} evento={ev} onPress={setEventoSel} />
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  scrollEmpty: { flex: 1 },
  greetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  greetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  pageHeader: { paddingTop: 16, paddingBottom: 4 },
});
