import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius, Shadow } from '../../constants/typography';
import type { EventoComInscritos } from '../../hooks/useEventos';

interface Props {
  evento: EventoComInscritos;
  onPress: (evento: EventoComInscritos) => void;
  destaque?: boolean;
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function EventoSelectorCard({ evento, onPress, destaque }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.flat,
        { backgroundColor: colors.card, borderColor: colors.border },
        { borderLeftColor: evento.cor_tema ?? colors.primary, borderLeftWidth: destaque ? 5 : 3 },
      ]}
      onPress={() => onPress(evento)}
      activeOpacity={0.82}
    >
      <Text style={[Typography.h3, { color: colors.foreground }]} numberOfLines={1}>
        {evento.nome}
      </Text>

      <View style={styles.meta}>
        <Calendar size={12} color={colors.mutedFg} strokeWidth={2} />
        <Text style={[Typography.small, { color: colors.mutedFg, marginLeft: 4 }]}>
          {formatData(evento.data_inicio)}
          {evento.data_fim && evento.data_fim !== evento.data_inicio
            ? ` – ${formatData(evento.data_fim)}`
            : ''}
        </Text>
      </View>

      {!!(evento.hora_inicio) && (
        <View style={styles.meta}>
          <Clock size={12} color={colors.mutedFg} strokeWidth={2} />
          <Text style={[Typography.small, { color: colors.mutedFg, marginLeft: 4 }]}>
            {evento.hora_inicio}
            {evento.hora_fim ? ` – ${evento.hora_fim}` : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
