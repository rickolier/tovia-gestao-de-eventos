import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useEventos } from '../../hooks/useEventos';
import { useFinanceiro, Inscricao } from '../../hooks/useFinanceiro';
import { Typography, Radius } from '../../constants/typography';
import TopBar from '../../components/shared/TopBar';
import ProfileSheet from '../../components/shared/ProfileSheet';
import EmptyState from '../../components/ui/EmptyState';
import { FinanceiroSkeleton } from '../../components/ui/Skeleton';
import EventoSelectorCard from '../../components/ui/EventoSelectorCard';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pago:              { label: 'Pago',      bg: '#e8f5ee', text: '#1a7a45' },
  pendente:          { label: 'Pendente',  bg: '#fef9c3', text: '#92400e' },
  pagamento_iniciado:{ label: 'Pendente',  bg: '#fef9c3', text: '#92400e' },
  cancelada:         { label: 'Cancelado', bg: '#fee2e2', text: '#991b1b' },
  analise:           { label: 'Em análise',bg: '#eff6ff', text: '#1e40af' },
};

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function InscricaoRow({ inscricao }: { inscricao: Inscricao }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[inscricao.status] ?? STATUS_CONFIG.pendente;

  return (
    <View style={[styles.inscricaoRow, { borderBottomColor: colors.border }]}>
      {/* Avatar inicial */}
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>
          {(inscricao.nome ?? inscricao.email ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[Typography.body, { color: colors.foreground, fontWeight: '600' }]} numberOfLines={1}>
          {inscricao.nome ?? inscricao.email ?? 'Sem nome'}
        </Text>
        {inscricao.ticket_nome ? (
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 1 }]} numberOfLines={1}>
            {inscricao.ticket_nome}
          </Text>
        ) : inscricao.email ? (
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 1 }]} numberOfLines={1}>
            {inscricao.email}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
          <Text style={[Typography.caption, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
        {inscricao.valor_total > 0 && (
          <Text style={[Typography.caption, { color: colors.mutedFg }]}>
            {moeda(inscricao.valor_total)}
          </Text>
        )}
      </View>
    </View>
  );
}

type Filtro = 'todos' | 'pago' | 'pendente' | 'cancelada';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pago', label: 'Pago' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'cancelada', label: 'Cancelado' },
];

function ListaInscritos({ eventoId, eventoNome, onBack }: {
  eventoId: string; eventoNome: string; onBack: () => void;
}) {
  const { colors } = useTheme();
  const { inscricoes, resumo, loading } = useFinanceiro(eventoId);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const visiveis = useMemo(() => inscricoes
    .filter((i) => {
      if (filtro === 'pago') return i.status === 'pago';
      if (filtro === 'pendente') return i.status === 'pendente' || i.status === 'pagamento_iniciado';
      if (filtro === 'cancelada') return i.status === 'cancelada';
      return true;
    })
    .filter((i) => {
      if (!busca.trim()) return true;
      const q = busca.toLowerCase();
      return (i.nome ?? '').toLowerCase().includes(q) || (i.email ?? '').toLowerCase().includes(q);
    }),
    [inscricoes, filtro, busca],
  );

  const totalPago = inscricoes.filter((i) => i.status === 'pago').length;

  return (
    <View style={{ flex: 1 }}>
      {/* Volta */}
      <TouchableOpacity onPress={onBack} style={[styles.backRow, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>← Financeiro</Text>
        <Text style={[Typography.h3, { color: colors.foreground, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
          {eventoNome}
        </Text>
      </TouchableOpacity>

      {/* Resumo rápido */}
      <View style={[styles.resumoRow, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.small, { color: colors.mutedFg }]}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>{inscricoes.length}</Text> inscritos
          {'  ·  '}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{totalPago} pagos</Text>
        </Text>
        {resumo.totalArrecadado > 0 && (
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
            <Text style={{ color: '#1a7a45', fontWeight: '700' }}>{moeda(resumo.totalArrecadado)}</Text> arrecadado
            {resumo.totalPendente > 0 && (
              <Text>{'  ·  '}<Text style={{ color: '#92400e', fontWeight: '700' }}>{moeda(resumo.totalPendente)}</Text> pendente</Text>
            )}
          </Text>
        )}
      </View>

      {/* Busca */}
      <View style={[styles.searchRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Search size={14} color={colors.mutedFg} strokeWidth={2} />
        <TextInput
          style={[Typography.body, { flex: 1, color: colors.foreground, marginLeft: 8 }]}
          placeholder="Buscar por nome ou e-mail…"
          placeholderTextColor={colors.mutedFg}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFiltro(f.key)}
            style={[
              styles.filtroBtn,
              filtro === f.key
                ? { borderBottomWidth: 2, borderBottomColor: colors.primary }
                : { borderBottomWidth: 2, borderBottomColor: 'transparent' },
            ]}
          >
            <Text style={[
              Typography.small,
              {
                color: filtro === f.key ? colors.primary : colors.mutedFg,
                fontWeight: filtro === f.key ? '700' : '400',
              },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <FinanceiroSkeleton />
      ) : visiveis.length === 0 ? (
        <EmptyState message={busca ? 'Nenhum resultado.' : 'Nenhum inscrito aqui.'} cta="" ctaUrl="" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {visiveis.map((i) => <InscricaoRow key={i.id} inscricao={i} />)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default function FinanceiroScreen() {
  const { colors } = useTheme();
  const { hoje, proximos, loading } = useEventos();
  const [profileOpen, setProfileOpen] = useState(false);
  const [eventoSel, setEventoSel] = useState<{ id: string; nome: string } | null>(null);
  const todos = [...hoje, ...proximos];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar onAvatarPress={() => setProfileOpen(true)} />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />

      {!eventoSel ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={[Typography.display, { color: colors.foreground, marginTop: 20 }]}>Financeiro</Text>
          {loading ? (
            <FinanceiroSkeleton />
          ) : todos.length === 0 ? (
            <EmptyState message="Nenhum evento ativo." cta="Criar em tovia.app" ctaUrl="https://tovia.app" />
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {todos.map((ev) => (
                <EventoSelectorCard
                  key={ev.id}
                  evento={ev}
                  destaque
                  onPress={(e) => setEventoSel({ id: e.id, nome: e.nome })}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <ListaInscritos
          eventoId={eventoSel.id}
          eventoNome={eventoSel.nome}
          onBack={() => setEventoSel(null)}
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
  resumoRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
  filtrosRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  filtroBtn: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  listCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inscricaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
