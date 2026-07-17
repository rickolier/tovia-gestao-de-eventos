import { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, ScrollView,
  StyleSheet, TouchableOpacity, Dimensions, Clipboard, ToastAndroid, Platform, Alert,
} from 'react-native';
import ToggleSwitch from './ToggleSwitch';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  X, MapPin, Calendar, Users, Ticket,
  CheckSquare, AlignLeft, Shield, Link, Copy, CheckCheck,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Radius } from '../../constants/typography';
import type { EventoComInscritos } from '../../hooks/useEventos';

interface PaginaVenda {
  id: string;
  nome: string;
  slug: string;
  codigo?: string;
  ativa: boolean;
}

interface Props {
  evento: EventoComInscritos;
  onClose: () => void;
  onToggleAtivo: (id: string, valor: boolean) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.secondary }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.caption, { color: colors.mutedFg, fontSize: 10 }]}>{label}</Text>
        <Text style={[Typography.small, { color: colors.foreground, marginTop: 1 }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventoDetailModal({ evento, onClose, onToggleAtivo }: Props) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [vagasValidas, setVagasValidas] = useState<number | null>(null);
  const [membros, setMembros] = useState<number | null>(null);
  const [paginas, setPaginas] = useState<PaginaVenda[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(
      collection(db, 'eventos', evento.id, 'inscricoes'),
      where('status', '==', 'pago'),
    )).then((s) => setVagasValidas(s.size)).catch(() => setVagasValidas(0));

    setMembros(evento.equipeIds?.length ?? 0);

    getDocs(collection(db, 'eventos', evento.id, 'paginas_venda'))
      .then((s) => setPaginas(s.docs.map((d) => ({ id: d.id, ...d.data() } as PaginaVenda))))
      .catch(() => {});
  }, [evento.id]);

  function urlDaPagina(p: PaginaVenda): string {
    if (profile?.codigo && evento.codigo && p.codigo) {
      return `https://toviaapp.com.br/${profile.codigo}/${evento.codigo}/${p.codigo}`;
    }
    return `https://toviaapp.com.br/e/${evento.id}/${p.slug}`;
  }

  function copiarLink(p: PaginaVenda) {
    const url = urlDaPagina(p);
    Clipboard.setString(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copiado!', ToastAndroid.SHORT);
    }
  }

  const dataInicio = evento.data_inicio ? formatDate(evento.data_inicio) : '—';
  const dataFim = evento.data_fim && evento.data_fim !== evento.data_inicio
    ? ` até ${formatDate(evento.data_fim)}`
    : '';
  const periodo = dataInicio + dataFim;

  const horaStr = evento.hora_inicio
    ? evento.hora_inicio + (evento.hora_fim ? ` – ${evento.hora_fim}` : '')
    : null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: colors.foreground, flex: 1 }]} numberOfLines={2}>
            {evento.nome}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={20} color={colors.mutedFg} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Info rows */}
          <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <InfoRow
              icon={<Calendar size={14} color={colors.primary} strokeWidth={2} />}
              label="Data"
              value={periodo}
            />
            {horaStr && (
              <InfoRow
                icon={<Calendar size={14} color={colors.primary} strokeWidth={2} />}
                label="Horário"
                value={horaStr}
              />
            )}
            {!!evento.local && (
              <InfoRow
                icon={<MapPin size={14} color={colors.primary} strokeWidth={2} />}
                label="Local"
                value={evento.local}
              />
            )}
            <InfoRow
              icon={<Ticket size={14} color={colors.primary} strokeWidth={2} />}
              label="Vagas totais"
              value={evento.vagas_totais > 0 ? String(evento.vagas_totais) : 'Ilimitadas'}
            />
            <InfoRow
              icon={<Users size={14} color={colors.primary} strokeWidth={2} />}
              label="Inscrições"
              value={String(evento.total_inscritos)}
            />
            <InfoRow
              icon={<CheckSquare size={14} color={colors.primary} strokeWidth={2} />}
              label="Válidas para check-in"
              value={vagasValidas === null ? '—' : String(vagasValidas)}
            />
            <InfoRow
              icon={<Shield size={14} color={colors.primary} strokeWidth={2} />}
              label="Membros da equipe"
              value={membros === null ? '—' : String(membros)}
            />
          </View>

          {/* Descrição */}
          {evento.descricao ? (
            <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 12 }]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: colors.card }]}>
                  <AlignLeft size={14} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.caption, { color: colors.mutedFg }]}>Descrição</Text>
                  <Text style={[Typography.body, { color: colors.foreground, marginTop: 4, lineHeight: 22 }]}>
                    {evento.descricao}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Toggle ativo */}
          <View style={[styles.toggleCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                Evento ativo
              </Text>
              <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
                {evento.ativo ? 'Visível e aceitando inscrições' : 'Oculto para novos participantes'}
              </Text>
            </View>
            <ToggleSwitch
              value={evento.ativo}
              onValueChange={(v) => onToggleAtivo(evento.id, v)}
            />
          </View>

          {/* Páginas de venda */}
          {paginas.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 8 }]}>
                Páginas de venda
              </Text>
              <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                {paginas.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.paginaRow,
                      i < paginas.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={[styles.infoIcon, { backgroundColor: colors.card }]}>
                      <Link size={13} color={p.ativa ? colors.primary : colors.mutedFg} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[Typography.body, { color: colors.foreground, fontWeight: '600' }]} numberOfLines={1}>
                        {p.nome}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.mutedFg, marginTop: 1 }]} numberOfLines={1}>
                        {urlDaPagina(p)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => copiarLink(p)}
                      hitSlop={8}
                      style={[styles.copyBtn, { backgroundColor: copiedId === p.id ? colors.primaryLight : colors.card, borderColor: colors.border }]}
                    >
                      {copiedId === p.id
                        ? <CheckCheck size={14} color={colors.primary} strokeWidth={2.5} />
                        : <Copy size={14} color={colors.mutedFg} strokeWidth={2} />
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.82,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 14,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoIcon: {
    width: 24, height: 24,
    borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    gap: 12,
  },
  paginaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
