import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckSquare, Square, Calendar, User, AlertTriangle, X, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useEventos } from '../../hooks/useEventos';
import { useTarefas, Tarefa } from '../../hooks/useTarefas';
import { Typography, Radius } from '../../constants/typography';
import TopBar from '../../components/shared/TopBar';
import ProfileSheet from '../../components/shared/ProfileSheet';
import EmptyState from '../../components/ui/EmptyState';
import { TarefasSkeleton } from '../../components/ui/Skeleton';
import EventoSelectorCard from '../../components/ui/EventoSelectorCard';

const STATUS_CHIP: Record<string, { label: string; bg: string; text: string }> = {
  pendente:    { label: 'Pendente',    bg: '#f0f4f2', text: '#6b7280' },
  em_progresso:{ label: 'Em andamento',bg: '#eff6ff', text: '#1e40af' },
  concluida:   { label: 'Concluída',   bg: '#FFF4EE', text: '#FF6B1A' },
  atrasada:    { label: 'Atrasada',    bg: '#fee2e2', text: '#991b1b' },
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
};
const PRIORIDADE_COLOR: Record<string, string> = {
  baixa: '#6b7280', media: '#d97706', alta: '#dc2626',
};

function TarefaDetailModal({ tarefa, onClose, onToggle }: {
  tarefa: Tarefa; onClose: () => void; onToggle: () => void;
}) {
  const { colors } = useTheme();
  const chip = STATUS_CHIP[tarefa.status] ?? STATUS_CHIP.pendente;
  const concluida = tarefa.status === 'concluida';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[Typography.h2, { color: colors.foreground, flex: 1 }]} numberOfLines={2}>
            {tarefa.titulo}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={20} color={colors.mutedFg} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Status + Prioridade */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <View style={[styles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[Typography.caption, { color: chip.text }]}>{chip.label}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
            <AlertTriangle size={10} color={PRIORIDADE_COLOR[tarefa.prioridade] ?? '#6b7280'} strokeWidth={2} />
            <Text style={[Typography.caption, { color: PRIORIDADE_COLOR[tarefa.prioridade] ?? '#6b7280', marginLeft: 4 }]}>
              {PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}
            </Text>
          </View>
        </View>

        {/* Descrição */}
        {tarefa.descricao ? (
          <Text style={[Typography.body, { color: colors.foreground, marginBottom: 20, lineHeight: 22 }]}>
            {tarefa.descricao}
          </Text>
        ) : (
          <Text style={[Typography.body, { color: colors.mutedFg, marginBottom: 20 }]}>
            Sem descrição.
          </Text>
        )}

        {/* Metadados */}
        <View style={{ gap: 10, marginBottom: 28 }}>
          {tarefa.responsavel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <User size={14} color={colors.mutedFg} strokeWidth={2} />
              <Text style={[Typography.small, { color: colors.mutedFg }]}>
                Responsável: <Text style={{ color: colors.foreground }}>{tarefa.responsavel}</Text>
              </Text>
            </View>
          ) : null}
          {tarefa.dataLimite ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color={colors.mutedFg} strokeWidth={2} />
              <Text style={[Typography.small, { color: colors.mutedFg }]}>
                Prazo: <Text style={{ color: colors.foreground }}>
                  {new Date(tarefa.dataLimite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Botão toggle */}
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: concluida ? colors.secondary : colors.primary }]}
          onPress={() => { onToggle(); onClose(); }}
          activeOpacity={0.85}
        >
          {concluida
            ? <Square size={18} color={colors.mutedFg} strokeWidth={2} />
            : <CheckSquare size={18} color="#fff" strokeWidth={2} />
          }
          <Text style={[Typography.body, {
            fontWeight: '700',
            color: concluida ? colors.mutedFg : '#fff',
            marginLeft: 8,
          }]}>
            {concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function TarefaRow({ tarefa, onToggle, onDetalhes }: {
  tarefa: Tarefa; onToggle: () => void; onDetalhes: () => void;
}) {
  const { colors } = useTheme();
  const chip = STATUS_CHIP[tarefa.status] ?? STATUS_CHIP.pendente;
  const concluida = tarefa.status === 'concluida';

  return (
    <View style={[styles.tarefaRow, { backgroundColor: concluida ? colors.secondary : colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={onToggle} style={{ marginTop: 2, padding: 2 }} hitSlop={8}>
        {concluida
          ? <CheckSquare size={20} color={colors.primary} strokeWidth={2} />
          : <Square size={20} color={colors.mutedFg} strokeWidth={2} />
        }
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[Typography.h3, { color: concluida ? colors.mutedFg : colors.foreground }]} numberOfLines={2}>
          {tarefa.titulo}
        </Text>
        {tarefa.dataLimite && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} color={colors.mutedFg} strokeWidth={2} />
            <Text style={[Typography.small, { color: colors.mutedFg }]}>
              {new Date(tarefa.dataLimite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </Text>
          </View>
        )}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          <Text style={[Typography.caption, { color: chip.text }]}>{chip.label}</Text>
        </View>
        <TouchableOpacity onPress={onDetalhes} hitSlop={8}>
          <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>Ver detalhes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type Prioridade = 'baixa' | 'media' | 'alta';

const PRIORIDADES: { key: Prioridade; label: string; color: string }[] = [
  { key: 'baixa', label: 'Baixa',  color: '#6b7280' },
  { key: 'media', label: 'Média',  color: '#d97706' },
  { key: 'alta',  label: 'Alta',   color: '#dc2626' },
];

function NovaTarefaModal({ eventoId, onClose, onCreate }: {
  eventoId: string;
  onClose: () => void;
  onCreate: (dados: { eventoId: string; titulo: string; descricao: string; responsavel: string; dataLimite: string; status: 'pendente'; prioridade: Prioridade }) => Promise<void>;
}) {
  const { colors } = useTheme();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  function parsePrazo(texto: string): string {
    if (!texto.trim()) return '';
    const partes = texto.trim().split('/');
    if (partes.length === 3) {
      const [d, m, a] = partes;
      const iso = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (!isNaN(Date.parse(iso))) return iso;
    }
    return '';
  }

  async function salvar() {
    if (!titulo.trim()) { setErro('O título é obrigatório.'); return; }
    setSaving(true);
    setErro('');
    try {
      await onCreate({
        eventoId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        dataLimite: parsePrazo(prazo),
        status: 'pendente',
        prioridade,
      });
      onClose();
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.sheetHeader}>
            <Text style={[Typography.h2, { color: colors.foreground, flex: 1 }]}>Nova tarefa</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.mutedFg} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Título */}
            <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 6 }]}>Título *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="Ex: Montar credenciamento"
              placeholderTextColor={colors.mutedFg}
              value={titulo}
              onChangeText={(t) => { setTitulo(t); setErro(''); }}
              returnKeyType="next"
            />

            {/* Descrição */}
            <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 6, marginTop: 16 }]}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="Detalhes opcionais…"
              placeholderTextColor={colors.mutedFg}
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Responsável */}
            <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 6, marginTop: 16 }]}>Responsável</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="Nome do responsável"
              placeholderTextColor={colors.mutedFg}
              value={responsavel}
              onChangeText={setResponsavel}
            />

            {/* Prazo */}
            <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 6, marginTop: 16 }]}>Prazo</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="dd/mm/aaaa"
              placeholderTextColor={colors.mutedFg}
              value={prazo}
              onChangeText={setPrazo}
              keyboardType="numeric"
            />

            {/* Prioridade */}
            <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 8, marginTop: 16 }]}>Prioridade</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {PRIORIDADES.map((p) => {
                const ativo = prioridade === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.prioChip,
                      { borderColor: ativo ? p.color : colors.border, backgroundColor: ativo ? p.color + '18' : colors.secondary },
                    ]}
                    onPress={() => setPrioridade(p.key)}
                    activeOpacity={0.75}
                  >
                    <AlertTriangle size={11} color={ativo ? p.color : colors.mutedFg} strokeWidth={2} />
                    <Text style={[Typography.caption, { color: ativo ? p.color : colors.mutedFg, marginLeft: 4, fontWeight: ativo ? '700' : '400' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {erro ? (
              <Text style={[Typography.small, { color: '#dc2626', marginBottom: 12 }]}>{erro}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: saving ? colors.secondary : colors.primary }]}
              onPress={salvar}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={colors.mutedFg} size="small" />
                : <>
                    <Plus size={18} color="#fff" strokeWidth={2} />
                    <Text style={[Typography.body, { fontWeight: '700', color: '#fff', marginLeft: 8 }]}>Criar tarefa</Text>
                  </>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EventoSelector({ onSelect }: { onSelect: (id: string, nome: string) => void }) {
  const { colors } = useTheme();
  const { hoje, proximos, loading } = useEventos();
  const todos = [...hoje, ...proximos];

  if (loading) return <TarefasSkeleton />;

  if (todos.length === 0) {
    return (
      <EmptyState
        message="Nenhum evento ativo com tarefas."
        cta="Criar em tovia.app"
        ctaUrl="https://tovia.app"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {todos.map((ev) => (
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

function ListaTarefas({ eventoId, eventoNome, onBack }: { eventoId: string; eventoNome: string; onBack: () => void }) {
  const { colors } = useTheme();
  const { tarefas, pendentes, emProgresso, concluidas, loading, toggleConcluida, criarTarefa } = useTarefas(eventoId);
  const [filtro, setFiltro] = useState<'todas' | 'pendente' | 'em_progresso' | 'concluida'>('todas');
  const [tarefaSel, setTarefaSel] = useState<Tarefa | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);

  const FILTROS = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'em_progresso', label: 'Em andamento' },
    { key: 'concluida', label: 'Concluídas' },
  ] as const;

  const visiveis = filtro === 'todas' ? tarefas
    : filtro === 'pendente' ? pendentes
    : filtro === 'em_progresso' ? emProgresso
    : concluidas;

  return (
    <View style={{ flex: 1 }}>
      {tarefaSel && (
        <TarefaDetailModal
          tarefa={tarefaSel}
          onClose={() => setTarefaSel(null)}
          onToggle={() => toggleConcluida(tarefaSel)}
        />
      )}
      {novaAberta && (
        <NovaTarefaModal
          eventoId={eventoId}
          onClose={() => setNovaAberta(false)}
          onCreate={criarTarefa}
        />
      )}

      {/* Sub-header */}
      <TouchableOpacity onPress={onBack} style={[styles.backRow, { borderBottomColor: colors.border }]}>
        <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>← Tarefas</Text>
        <Text style={[Typography.h3, { color: colors.foreground, flex: 1, marginLeft: 8 }]} numberOfLines={1}>
          {eventoNome}
        </Text>
      </TouchableOpacity>

      {/* Chips de filtro — grid 2×2 */}
      <View style={styles.chipGrid}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              { backgroundColor: filtro === f.key ? colors.primary : colors.secondary },
            ]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[Typography.caption, { color: filtro === f.key ? '#fff' : colors.mutedFg }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : visiveis.length === 0 ? (
        <EmptyState message="Nenhuma tarefa aqui." cta="" ctaUrl="" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {visiveis.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              onToggle={() => toggleConcluida(t)}
              onDetalhes={() => setTarefaSel(t)}
            />
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setNovaAberta(true)}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

export default function TarefasScreen() {
  const { colors } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [eventoSel, setEventoSel] = useState<{ id: string; nome: string } | null>(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar onAvatarPress={() => setProfileOpen(true)} />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />

      {!eventoSel ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={[Typography.display, { color: colors.foreground, marginTop: 20 }]}>Tarefas</Text>
          <EventoSelector onSelect={(id, nome) => setEventoSel({ id, nome })} />
        </View>
      ) : (
        <ListaTarefas
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  tarefaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 80,
    paddingTop: 10,
  },
  prioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    width: '47%',
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
