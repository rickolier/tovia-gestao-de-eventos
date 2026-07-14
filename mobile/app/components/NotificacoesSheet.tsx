import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Switch, TextInput, ScrollView, Alert,
} from 'react-native';
import { Bell, BellOff, Plus, Trash2, Clock, WifiOff } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { Typography, Radius, Shadow } from '../constants/typography';

const HOURS_OPTIONS = [1, 2, 6, 24];

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

function NewNotifForm({ onAdd, onCancel }: { onAdd: (msg: string, date: string) => void; onCancel: () => void }) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [dateStr, setDateStr] = useState('');

  function handleAdd() {
    if (!message.trim()) { Alert.alert('Atenção', 'Digite uma mensagem.'); return; }
    if (!dateStr.trim()) { Alert.alert('Atenção', 'Informe a data e hora (DD/MM/AAAA HH:MM).'); return; }

    const [datePart, timePart] = dateStr.trim().split(' ');
    const [day, month, year] = (datePart ?? '').split('/').map(Number);
    const [hour, minute] = (timePart ?? '00:00').split(':').map(Number);

    if (!day || !month || !year) { Alert.alert('Formato inválido', 'Use DD/MM/AAAA HH:MM'); return; }
    const dt = new Date(year, month - 1, day, hour ?? 0, minute ?? 0);
    if (isNaN(dt.getTime()) || dt <= new Date()) {
      Alert.alert('Data inválida', 'A data precisa ser no futuro.');
      return;
    }

    onAdd(message.trim(), dt.toISOString());
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
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
        placeholder="Data e hora: DD/MM/AAAA HH:MM"
        placeholderTextColor={colors.mutedFg}
        value={dateStr}
        onChangeText={setDateStr}
        keyboardType="numbers-and-punctuation"
      />
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
    settings, permGranted, loading,
    requestPermission, updateEventReminder, updateOfflineReminder,
    addCustom, removeCustom,
  } = useNotifications();

  const [showForm, setShowForm] = useState(false);

  async function handleToggle(type: 'event' | 'offline', value: boolean) {
    if (value && !permGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações nas configurações do dispositivo para usar este recurso.',
        );
        return;
      }
    }
    if (type === 'event') updateEventReminder({ enabled: value });
    else updateOfflineReminder(value);
  }

  async function handleAddCustom(message: string, scheduledAt: string) {
    if (!permGranted) {
      const granted = await requestPermission();
      if (!granted) { Alert.alert('Permissão necessária', 'Ative as notificações para continuar.'); return; }
    }
    await addCustom({ message, scheduledAt });
    setShowForm(false);
    Alert.alert('Notificação agendada!', 'Você receberá um aviso na data e hora informados.');
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
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
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <NotifRow
              icon={<Clock size={14} color={colors.primary} strokeWidth={2} />}
              title="Lembrete antes do evento"
              subtitle={`Avisa ${settings.eventReminder.hoursBefore}h antes do início`}
              right={
                <Switch
                  value={settings.eventReminder.enabled}
                  onValueChange={(v) => handleToggle('event', v)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
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
              subtitle="24h antes: avisa para baixar a lista de inscritos"
              right={
                <Switch
                  value={settings.offlineReminder.enabled}
                  onValueChange={(v) => handleToggle('offline', v)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
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
              <NotifRow
                key={c.id}
                icon={<Bell size={14} color={colors.primary} strokeWidth={2} />}
                title={c.message}
                subtitle={formatDate(c.scheduledAt)}
                right={
                  <TouchableOpacity
                    onPress={() => Alert.alert('Remover', 'Excluir esta notificação?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => removeCustom(c.id) },
                    ])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                  </TouchableOpacity>
                }
              />
            ))}

            {showForm
              ? <NewNotifForm onAdd={handleAddCustom} onCancel={() => setShowForm(false)} />
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
});
