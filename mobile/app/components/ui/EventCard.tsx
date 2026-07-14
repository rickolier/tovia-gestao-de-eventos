import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Users, Calendar } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Shadow, Typography } from '../../constants/typography';
import type { EventoComInscritos } from '../../hooks/useEventos';

interface EventCardProps {
  evento: EventoComInscritos;
  destaque?: boolean;
  onPress: (evento: EventoComInscritos) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventCard({ evento, destaque, onPress }: EventCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        { borderLeftColor: evento.cor_tema ?? colors.primary, borderLeftWidth: destaque ? 5 : 3 },
      ]}
      onPress={() => onPress(evento)}
      activeOpacity={0.85}
    >
      {/* Header: nome + badge ao vivo */}
      <View style={styles.row}>
        <Text style={[Typography.h3, { color: colors.foreground, flex: 1 }]} numberOfLines={2}>
          {evento.nome}
        </Text>
        {destaque && (
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Ao vivo</Text>
          </View>
        )}
      </View>

      {/* Data */}
      <View style={[styles.metaRow, { marginTop: 6 }]}>
        <Calendar size={13} color={colors.mutedFg} strokeWidth={2} />
        <Text style={[Typography.small, { color: colors.mutedFg, marginLeft: 5 }]}>
          {formatDate(evento.data_inicio)}
        </Text>
      </View>

      {/* Local */}
      {!!evento.local && (
        <View style={styles.metaRow}>
          <MapPin size={13} color={colors.mutedFg} strokeWidth={2} />
          <Text style={[Typography.small, { color: colors.mutedFg, marginLeft: 5 }]} numberOfLines={1}>
            {evento.local}
          </Text>
        </View>
      )}

      {/* Rodapé: inscritos + status */}
      <View style={[styles.row, { marginTop: 14, alignItems: 'center' }]}>
        <View style={styles.metaRow}>
          <Users size={13} color={colors.mutedFg} strokeWidth={2} />
          <Text style={[Typography.small, { color: colors.mutedFg, marginLeft: 5 }]}>
            {evento.total_inscritos} inscrito{evento.total_inscritos !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[
          styles.statusPill,
          { backgroundColor: evento.ativo ? colors.primaryLight : colors.secondary },
        ]}>
          <Text style={[Typography.caption, { color: evento.ativo ? colors.primary : colors.mutedFg, fontWeight: '600' }]}>
            {evento.ativo ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
