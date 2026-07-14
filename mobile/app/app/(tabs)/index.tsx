import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  ActivityIndicator, StyleSheet,
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

function GreetingBox() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  if (!profile?.name) return null;

  return (
    <View style={[styles.greetBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <View style={[styles.greetIcon, { backgroundColor: colors.primary }]}>
        <Sparkles size={16} color="#fff" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.h3, { color: colors.foreground }]}>
          {`${saudacao(profile.name)}`}
        </Text>
        <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
          {'Tudo pronto para o seu próximo evento?'}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { hoje, proximos, encerrados, loading, toggleAtivo } = useEventos();
  const [refreshing, setRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [eventoSel, setEventoSel] = useState<EventoComInscritos | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const totalAtivos = [...hoje, ...proximos].length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar onAvatarPress={() => setProfileOpen(true)} />
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
          contentContainerStyle={[
            styles.scroll,
            hoje.length === 0 && proximos.length === 0 && encerrados.length === 0 && styles.scrollEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <GreetingBox />

          <View style={styles.pageHeader}>
            <Text style={[Typography.display, { color: colors.foreground }]}>Meus Eventos</Text>
            {totalAtivos > 0 && (
              <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
                {totalAtivos} evento{totalAtivos !== 1 ? 's' : ''} ativo{totalAtivos !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {hoje.length === 0 && proximos.length === 0 && encerrados.length === 0 && (
            <EmptyState />
          )}

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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  scrollEmpty: { flex: 1 },
  pageHeader: { paddingTop: 16, paddingBottom: 4 },
  greetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
  },
  greetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
