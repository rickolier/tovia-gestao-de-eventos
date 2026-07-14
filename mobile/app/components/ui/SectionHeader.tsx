import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography } from '../../constants/typography';

interface SectionHeaderProps {
  title: string;
  count?: number;
}

export default function SectionHeader({ title, count }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[Typography.label, { color: colors.mutedFg }]}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
          <Text style={[Typography.caption, { color: colors.mutedFg }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
