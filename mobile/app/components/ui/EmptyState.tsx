import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Radius } from '../../constants/typography';

interface EmptyStateProps {
  message?: string;
  cta?: string;
  ctaUrl?: string;
}

export default function EmptyState({
  message = 'Você ainda não tem eventos.',
  cta = 'Criar em toviaapp.com.br',
  ctaUrl = 'https://toviaapp.com.br',
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Calendar size={32} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[Typography.h3, { color: colors.foreground, marginTop: 16, textAlign: 'center' }]}>
        {message}
      </Text>
      {!!(cta && ctaUrl) && (
        <TouchableOpacity
          style={[styles.btn, { borderColor: colors.primary }]}
          onPress={() => Linking.openURL(ctaUrl)}
          activeOpacity={0.8}
        >
          <Text style={[Typography.body, { color: colors.primary, fontWeight: '600' }]}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
});
