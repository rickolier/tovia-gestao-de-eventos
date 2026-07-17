import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, TextInput, ScrollView, Alert,
} from 'react-native';
import ToggleSwitch from './ui/ToggleSwitch';
import { Bell, BellOff, Plus, Trash2, Clock, WifiOff, Calendar, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { useEventos, Evento } from '../hooks/useEventos';
import { Typography, Radius, Shadow } from '../constants/typography';

const HOURS_OPTIONS = [1, 2, 6, 24];

function formatEventDate(evento: Evento) {
  try {
    return new Date(evento.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
}

function EventSelector({
  eventos, selected, onSelect,
}: { eventos: Evento[]; selected: Evento | null; onSelect: (e: Evento) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  if (eventos.length === 0) {
    return (
      <View style={[styles.eventBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
        <Calendar size={14} color={colors.mutedFg} strokeWidth={2} />
        <Text style={[Typography.small, { color: colors.mutedFg, flex: 1, marginLeft: 8 }]}>
          Nenhum evento disponível
        </Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.eventBtn, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Calendar size={14} color={selected ? colors.primary : colors.mutedFg} strokeWidth={2} />
        <Text style={[Typography.body, { flex: 1, marginLeft: 8, color: selected ? colors.foreground : colors.mutedFg }]} numberOfLines={1}>
          {selected ? `${selected.nome} · ${formatEventDate(selected)}` : 'Selecionar evento…'}
        </Text>
        <ChevronDown size={14} color={colors.mutedFg} strokeWidth={2} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {eventos.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(ev); setOpen(false); }}
            >
              <Text style={[Typography.body, { color: colors.foreground }]} numberOfLines={1}>{ev.nome}</Text>
              <Text style={[Typography.small, { color: colors.mutedFg }]}>{formatEventDate(ev)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 8, marginTop: 20 }]}>
      {label}
    </Text>
  );
}

function NotifRow({
  icon, title, subtitle, right,
}: { icon: React.ReactNode; title: string; subtitle?: string; right: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.notifRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.notifIcon, { backgroundColor: colors.primaryLight }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.body, { color: colors.foreground, fontWeight: '500' }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 1 }]} numberOfLines={2}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

function HoursPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const { colors } = useTheme();
  const options = [1, 2, 3, 6, 12, 24, 36, 48];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
      {options.map((h) => (
        <TouchableOpacity
          key={h}
          style={[
            styles.hourBtn,
            {
              backgroundColor: value === h ? colors.primary : colors.card,
              borderColor: value === h ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onChange(h)}
        >
          <Text style={[Typography.caption, {
            color: value === h ? '#fff' : colors.mutedFg,
            fontWeight: '600',
          }]}>{h}h</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function NewNotifForm({
  eventos, onAdd, onCancel,
}: { eventos: Evento[]; onAdd: (msg: string, hours: number, before: boolean, evento: Evento) => void; onCancel: () => void }) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [hours, setHours] = useState(2);
  const [before, setBefore] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(eventos[0] ?? null);

  function handleAdd() {
    if (!message.trim()) { Alert.alert('Atenção', 'Digite uma mensagem.'); return; }
    if (!evento) { Alert.alert('Atenção', 'Selecione um evento.'); return; }
    onAdd(message.trim(), hours, before, evento);
  }

  return (
    <View style={[styles.form, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 6 }]}>Nova notificação</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        placeholder="Mensagem…"
        placeholderTextColor={colors.mutedFg}
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {/* Evento */}
      <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 12, marginBottom: 4 }]}>Evento:</Text>
      <EventSelector eventos={eventos} selected={evento} onSelect={setEvento} />

      {/* Horas */}
      <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 12, marginBottom: 2 }]}>Quantas horas:</Text>
      <HoursPicker value={hours} onChange={setHours} />

      {/* Antes / Depois */}
      <View style={[styles.toggleRow, { borderColor: colors.border, marginTop: 12 }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, before && { backgroundColor: colors.primary }]}
          onPress={() => setBefore(true)}
        >
          <Text style={[Typography.caption, { color: before ? '#fff' : colors.mutedFg, fontWeight: '600' }]}>
            Antes do evento
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !before && { backgroundColor: colors.primary }]}
          onPress={() => setBefore(false)}
        >
          <Text style={[Typography.caption, { color: !before ? '#fff' : colors.mutedFg, fontWeight: '600' }]}>
            Após o evento
          </Text>
        </TouchableOpacity>
      </View>

      {evento && (
        <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 8 }]}>
          Aviso {hours}h {before ? 'antes' : 'após'} "{evento.nome}" ({formatEventDate(evento)}).
        </Text>
      )}

      <View style={styles.formActions}>
        <TouchableOpacity onPress={onCancel} style={[styles.formBtn, { borderColor: colors.border }]}>
          <Text style={[Typography.body, { color: colors.mutedFg }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAdd} style={[styles.formBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={[Typography.body, { color: '#fff', fontWeight: '600' }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface Props { visible: boolean; onClose: () => void; }

export default function NotificacoesSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const {
    settings, permGranted,
    requestPermission, updateEventReminder, updateOfflineReminder,
    addCustom, removeCustom,
  } = useNotifications();
  const { hoje, proximos } = useEventos();

  // Todos os eventos ativos ordenados por data — hoje primeiro, depois próximos
  const todosEventos: Evento[] = [...hoje, ...proximos].sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );
  const eventoMaisProximo = todosEventos[0] ?? null;

  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleToggle(type: 'event' | 'offline', value: boolean) {
    if (value && !permGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permissão necessária', 'Ative as notificações nas configurações do dispositivo para usar este recurso.');
        return;
      }
    }
    if (type === 'event') updateEventReminder({ enabled: value });
    else updateOfflineReminder(value);
  }

  async function handleAddCustom(message: string, hours: number, before: boolean, evento: Evento) {
    if (!permGranted) await requestPermission();
    await addCustom({ message, hours, before, eventoNome: evento.nome }, new Date(evento.data_inicio));
    setShowForm(false);
  }

  function formatCustom(c: { hours: number; before: boolean }) {
    return `${c.hours}h ${c.before ? 'antes' : 'após'} o evento`;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, Shadow.floating, { backgroundColor: colors.card }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[Typography.h2, { color: colors.foreground, marginTop: 8, marginBottom: 4, paddingHorizontal: 24 }]}>
          Notificações
        </Text>

        {!permGranted && permGranted !== null && (
          <View style={[styles.permBanner, { backgroundColor: '#fef3c7' }]}>
            <BellOff size={14} color="#92400e" strokeWidth={2} />
            <Text style={[Typography.small, { color: '#92400e', flex: 1, marginLeft: 8 }]}>
              Notificações desativadas. Ative nas configurações do dispositivo.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Pré-programadas */}
          <SectionLabel label="PRÉ-PROGRAMADAS" />

          {/* Evento mais próximo */}
          {eventoMaisProximo ? (
            <View style={[styles.nextEventBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <Calendar size={13} color={colors.primary} strokeWidth={2} />
              <Text style={[Typography.small, { color: colors.primary, flex: 1, marginLeft: 6, fontWeight: '600' }]} numberOfLines={1}>
                Próximo: {eventoMaisProximo.nome} · {formatEventDate(eventoMaisProximo)}
              </Text>
            </View>
          ) : (
            <View style={[styles.nextEventBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Calendar size={13} color={colors.mutedFg} strokeWidth={2} />
              <Text style={[Typography.small, { color: colors.mutedFg, flex: 1, marginLeft: 6 }]}>
                Nenhum evento próximo encontrado
              </Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <NotifRow
              icon={<Clock size={14} color={colors.primary} strokeWidth={2} />}
              title="Lembrete antes do evento"
              subtitle={`Avisa ${settings.eventReminder.hoursBefore}h antes do início`}
              right={
                <ToggleSwitch
                  value={settings.eventReminder.enabled}
                  onValueChange={(v) => handleToggle('event', v)}
                />
              }
            />
            {settings.eventReminder.enabled && (
              <View style={[styles.hoursRow, { borderTopColor: colors.border }]}>
                <Text style={[Typography.small, { color: colors.mutedFg, marginRight: 8 }]}>Avisar com:</Text>
                {HOURS_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.hourBtn,
                      {
                        backgroundColor: settings.eventReminder.hoursBefore === h ? colors.primary : colors.secondary,
                        borderColor: settings.eventReminder.hoursBefore === h ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => updateEventReminder({ hoursBefore: h })}
                  >
                    <Text style={[Typography.caption, {
                      color: settings.eventReminder.hoursBefore === h ? '#fff' : colors.mutedFg,
                      fontWeight: '600',
                    }]}>
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <NotifRow
              icon={<WifiOff size={14} color={colors.primary} strokeWidth={2} />}
              title="Lembrete de lista offline"
              subtitle="3h antes: avisa para baixar a lista de inscritos"
              right={
                <ToggleSwitch
                  value={settings.offlineReminder.enabled}
                  onValueChange={(v) => handleToggle('offline', v)}
                />
              }
            />
          </View>

          {/* Personalizadas */}
          <SectionLabel label="MINHAS NOTIFICAÇÕES" />
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {settings.custom.length === 0 && !showForm && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Bell size={28} color={colors.border} strokeWidth={1.5} />
                <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 8, textAlign: 'center' }]}>
                  Nenhuma notificação personalizada.{'\n'}Crie abaixo.
                </Text>
              </View>
            )}

            {settings.custom.map((c) => (
              <View key={c.id}>
                <NotifRow
                  icon={<Bell size={14} color={colors.primary} strokeWidth={2} />}
                  title={c.message}
                  subtitle={formatCustom(c)}
                  right={
                    <TouchableOpacity
                      onPress={() => setConfirmDeleteId(confirmDeleteId === c.id ? null : c.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                    </TouchableOpacity>
                  }
                />
                {confirmDeleteId === c.id && (
                  <View style={[styles.confirmRow, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
                    <Text style={[Typography.small, { color: colors.danger, flex: 1 }]}>Excluir esta notificação?</Text>
                    <TouchableOpacity onPress={() => setConfirmDeleteId(null)} style={styles.confirmBtn}>
                      <Text style={[Typography.small, { color: colors.mutedFg, fontWeight: '600' }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { removeCustom(c.id); setConfirmDeleteId(null); }} style={[styles.confirmBtn, { backgroundColor: colors.danger }]}>
                      <Text style={[Typography.small, { color: '#fff', fontWeight: '700' }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {showForm
              ? <NewNotifForm eventos={todosEventos} onAdd={handleAddCustom} onCancel={() => setShowForm(false)} />
              : (
                <TouchableOpacity
                  style={[styles.addBtn, { borderColor: colors.primary }]}
                  onPress={() => setShowForm(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={[Typography.body, { color: colors.primary, fontWeight: '600', marginLeft: 6 }]}>
                    Nova notificação
                  </Text>
                </TouchableOpacity>
              )
            }
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12,
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  permBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginTop: 8,
    padding: 10, borderRadius: Radius.md,
  },
  card: {
    borderRadius: Radius.card, borderWidth: 1, overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  notifIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  hoursRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, gap: 6,
  },
  hourBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: 12, paddingVertical: 12,
    borderRadius: Radius.pill, borderWidth: 1.5,
  },
  form: {
    margin: 12, padding: 14,
    borderRadius: Radius.md, borderWidth: 1,
  },
  input: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  formBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1,
  },
  nextEventBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 8,
  },
  eventBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  dropdown: {
    borderWidth: 1, borderRadius: Radius.md,
    marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  confirmRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    gap: 8, borderTopWidth: 1,
  },
  confirmBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.md,
  },
  toggleRow: {
    flexDirection: 'row', borderWidth: 1,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
  },
});
