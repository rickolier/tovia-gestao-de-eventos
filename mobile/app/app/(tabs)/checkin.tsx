import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, List, Search, Check, CloudDownload, WifiOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useEventos } from '../../hooks/useEventos';
import { useCheckin, InscritoCheckin } from '../../hooks/useCheckin';
import { Typography, Radius, Shadow } from '../../constants/typography';
import TopBar from '../../components/shared/TopBar';
import ProfileSheet from '../../components/shared/ProfileSheet';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { CheckinSkeleton } from '../../components/ui/Skeleton';
import EventoSelectorCard from '../../components/ui/EventoSelectorCard';

// ── Barra de progresso ─────────────────────────────────────────────────────────
function ProgressBar({ presentes, total }: { presentes: number; total: number }) {
  const { colors } = useTheme();
  const pct = total > 0 ? presentes / total : 0;

  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>
        {presentes} / {total} presentes
      </Text>
    </View>
  );
}

// ── Linha de inscrito ──────────────────────────────────────────────────────────
function InscritoRow({ inscrito, onToggle }: { inscrito: InscritoCheckin; onToggle: () => void }) {
  const { colors } = useTheme();
  const initials = (inscrito.nome ?? inscrito.email ?? '?')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.inscritoRow,
        { borderBottomColor: colors.border, backgroundColor: inscrito.presenca ? colors.primaryLight : 'transparent' },
      ]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: inscrito.presenca ? colors.primary : colors.secondary }]}>
        <Text style={[Typography.caption, { color: inscrito.presenca ? '#fff' : colors.mutedFg, fontWeight: '700' }]}>
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.h3, { color: colors.foreground }]} numberOfLines={1}>
          {inscrito.nome ?? inscrito.email ?? 'Sem nome'}
        </Text>
        {inscrito.ticket_nome && (
          <Text style={[Typography.small, { color: colors.mutedFg }]}>{inscrito.ticket_nome}</Text>
        )}
      </View>
      <View style={[
        styles.checkbox,
        {
          backgroundColor: inscrito.presenca ? colors.primary : 'transparent',
          borderColor: inscrito.presenca ? colors.primary : colors.border,
        },
      ]}>
        {inscrito.presenca && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}

// ── Lista de inscritos ─────────────────────────────────────────────────────────
function ListaInscritos({
  eventoId, eventoNome, onBack,
}: { eventoId: string; eventoNome: string; onBack: () => void }) {
  const { colors } = useTheme();
  const { inscritos, presentes, total, loading, offline, pendingSync, marcarPresenca, flushQueue } = useCheckin(eventoId);
  const [busca, setBusca] = useState('');

  const visiveis = useMemo(() =>
    inscritos.filter((i) => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return (i.nome ?? '').toLowerCase().includes(q) || (i.email ?? '').toLowerCase().includes(q);
    }),
    [inscritos, busca]
  );

  // Agrupar por letra inicial
  const grupos = useMemo(() => {
    const map = new Map<string, InscritoCheckin[]>();
    visiveis.forEach((i) => {
      const letra = (i.nome ?? i.email ?? '#')[0].toUpperCase();
      if (!map.has(letra)) map.set(letra, []);
      map.get(letra)!.push(i);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visiveis]);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={onBack} style={[styles.backRow, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>← Check-in</Text>
        <Text style={[Typography.h3, { color: colors.foreground, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
          {eventoNome}
        </Text>
      </TouchableOpacity>

      {/* Barra de busca */}
      <View style={[styles.searchRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Search size={14} color={colors.mutedFg} strokeWidth={2} />
        <TextInput
          style={[Typography.body, { flex: 1, color: colors.foreground, marginLeft: 8 }]}
          placeholder="Buscar por nome…"
          placeholderTextColor={colors.mutedFg}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Progresso */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <ProgressBar presentes={presentes} total={total} />
      </View>

      {/* Banner offline */}
      {offline && (
        <View style={[styles.offlineBanner, { backgroundColor: '#fef3c7' }]}>
          <WifiOff size={14} color="#92400e" strokeWidth={2} />
          <Text style={[Typography.small, { color: '#92400e', flex: 1, marginLeft: 8 }]}>
            Modo offline — exibindo lista salva
          </Text>
          {pendingSync > 0 && (
            <TouchableOpacity onPress={flushQueue} style={styles.syncBtn}>
              <RefreshCw size={13} color="#92400e" strokeWidth={2} />
              <Text style={[Typography.caption, { color: '#92400e', marginLeft: 4, fontWeight: '700' }]}>
                {pendingSync} pendente{pendingSync > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : visiveis.length === 0 ? (
        <EmptyState message="Nenhum inscrito encontrado." cta="" ctaUrl="" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {grupos.map(([letra, lista]) => (
            <View key={letra}>
              <View style={[styles.letraHeader, { backgroundColor: colors.secondary }]}>
                <Text style={[Typography.label, { color: colors.mutedFg }]}>{letra}</Text>
              </View>
              {lista.map((i) => (
                <InscritoRow
                  key={i.id}
                  inscrito={i}
                  onToggle={() => marcarPresenca(i.id, !i.presenca)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Seleção de modo ────────────────────────────────────────────────────────────
function ModoCheckin({
  eventoId, eventoNome, onBack, onLista,
}: { eventoId: string; eventoNome: string; onBack: () => void; onLista: () => void }) {
  const { colors } = useTheme();
  const { offline, syncedAt, downloadOffline } = useCheckin(eventoId);
  const [downloading, setDownloading] = useState(false);

  const syncLabel = syncedAt
    ? new Date(syncedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Nunca sincronizado';

  async function handleDownload() {
    setDownloading(true);
    const ok = await downloadOffline();
    setDownloading(false);
    if (ok) {
      Alert.alert('Lista salva!', 'Você pode usar o check-in mesmo sem internet.');
    } else {
      Alert.alert('Erro', 'Não foi possível baixar a lista. Verifique sua conexão.');
    }
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <TouchableOpacity onPress={onBack} style={{ paddingVertical: 12 }}>
        <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>← Check-in</Text>
      </TouchableOpacity>
      <Text style={[Typography.h1, { color: colors.foreground, marginBottom: 4 }]} numberOfLines={2}>
        {eventoNome}
      </Text>
      <Text style={[Typography.small, { color: colors.mutedFg, marginBottom: 24 }]}>
        Como deseja fazer o check-in?
      </Text>

      {/* Cards lado a lado */}
      <View style={styles.modoGrid}>
        {/* QR Code */}
        <TouchableOpacity
          style={[styles.modoCardGrande, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => {/* TODO: scanner QR */}}
        >
          <View style={styles.modoIconCircle}>
            <QrCode size={44} color="#fff" strokeWidth={1.5} />
          </View>
          <Text style={[Typography.h2, { color: '#fff', marginTop: 16, textAlign: 'center' }]}>QR Code</Text>
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.75)', marginTop: 4, textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 }]}>
            SCANNER ATIVO
          </Text>
        </TouchableOpacity>

        {/* Lista manual */}
        <TouchableOpacity
          style={[styles.modoCardGrande, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
          activeOpacity={0.85}
          onPress={onLista}
        >
          <View style={[styles.modoIconCircle, { backgroundColor: colors.primaryLight }]}>
            <List size={44} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[Typography.h2, { color: colors.foreground, marginTop: 16, textAlign: 'center' }]}>Lista</Text>
          <Text style={[Typography.caption, { color: colors.mutedFg, marginTop: 4, textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 }]}>
            BUSCA MANUAL
          </Text>
        </TouchableOpacity>
      </View>

      {/* Box de sincronização */}
      <View style={[styles.syncBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {offline
          ? <WifiOff size={20} color="#f59e0b" strokeWidth={1.5} />
          : <CloudDownload size={20} color={colors.mutedFg} strokeWidth={1.5} />
        }
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[Typography.body, { color: colors.foreground, fontWeight: '600' }]}>
            {offline ? 'Sem conexão' : 'Dados Sincronizados'}
          </Text>
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 1 }]}>
            Última sincronização: {syncLabel}
          </Text>
        </View>
        <View style={[styles.syncDot, { backgroundColor: offline ? '#f59e0b' : '#22c55e' }]} />
      </View>

      {/* Baixar offline */}
      <TouchableOpacity
        style={[styles.offlineBtn, { borderColor: colors.primary, opacity: downloading ? 0.6 : 1 }]}
        activeOpacity={0.8}
        onPress={handleDownload}
        disabled={downloading}
      >
        {downloading
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <CloudDownload size={18} color={colors.primary} strokeWidth={2} />
        }
        <Text style={[Typography.body, { color: colors.primary, fontWeight: '600', marginLeft: 8 }]}>
          {downloading ? 'Baixando lista…' : 'Baixar lista para uso offline'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Seleção de evento ──────────────────────────────────────────────────────────
function EventoSelector({ onSelect }: { onSelect: (id: string, nome: string) => void }) {
  const { hoje, loading } = useEventos();

  if (loading) return <CheckinSkeleton />;
  if (hoje.length === 0) return (
    <EmptyState message="Nenhum evento disponível para check-in hoje." cta="" ctaUrl="" />
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {hoje.map((ev) => (
        <EventoSelectorCard
          key={ev.id}
          evento={ev}
          destaque
          onPress={(e) => onSelect(e.id, e.nome)}
        />
      ))}
    </ScrollView>
  );
}

// ── Tela raiz ──────────────────────────────────────────────────────────────────
type Etapa = 'selecao' | 'modo' | 'lista';

export default function CheckinScreen() {
  const { colors } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('selecao');
  const [eventoSel, setEventoSel] = useState<{ id: string; nome: string } | null>(null);

  function selecionarEvento(id: string, nome: string) {
    setEventoSel({ id, nome });
    setEtapa('modo');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar onAvatarPress={() => setProfileOpen(true)} />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />

      {etapa === 'selecao' && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={[Typography.display, { color: colors.foreground, marginTop: 20, marginBottom: 4 }]}>Check-in</Text>
          <EventoSelector onSelect={selecionarEvento} />
        </View>
      )}

      {etapa === 'modo' && eventoSel && (
        <ModoCheckin
          eventoId={eventoSel.id}
          eventoNome={eventoSel.nome}
          onBack={() => setEtapa('selecao')}
          onLista={() => setEtapa('lista')}
        />
      )}

      {etapa === 'lista' && eventoSel && (
        <ListaInscritos
          eventoId={eventoSel.id}
          eventoNome={eventoSel.nome}
          onBack={() => setEtapa('modo')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modoCardGrande: {
    flex: 1,
    borderRadius: Radius.card,
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modoIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  offlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  inscritoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letraHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: Radius.md,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
