import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius } from '../../constants/typography';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = Radius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.secondary },
        { opacity },
        style,
      ]}
    />
  );
}

// ── Skeleton da tela Início ────────────────────────────────────────────────────
export function HomeSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.page, { backgroundColor: colors.background }]}>
      {/* Greeting box */}
      <Skeleton height={72} borderRadius={Radius.card} style={{ marginBottom: 20 }} />

      {/* Título */}
      <Skeleton width="55%" height={36} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="35%" height={14} borderRadius={6} style={{ marginBottom: 24 }} />

      {/* Section header */}
      <Skeleton width="45%" height={12} borderRadius={6} style={{ marginBottom: 12 }} />

      {/* Cards */}
      {[1, 2].map((i) => (
        <Skeleton key={i} height={110} borderRadius={Radius.card} style={{ marginBottom: 10 }} />
      ))}
    </View>
  );
}

// ── Skeleton da tela Check-in ──────────────────────────────────────────────────
export function CheckinSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.page, { backgroundColor: colors.background }]}>
      <Skeleton width="45%" height={36} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="65%" height={14} borderRadius={6} style={{ marginBottom: 24 }} />
      <Skeleton height={80} borderRadius={Radius.lg} style={{ marginBottom: 12 }} />
      <Skeleton height={80} borderRadius={Radius.lg} />
    </View>
  );
}

// ── Skeleton da tela Tarefas ───────────────────────────────────────────────────
export function TarefasSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.page, { backgroundColor: colors.background }]}>
      <Skeleton width="40%" height={36} borderRadius={6} style={{ marginBottom: 20 }} />
      {/* Grid 2x2 filtros */}
      <View style={sk.grid}>
        <Skeleton height={40} borderRadius={Radius.md} style={{ flex: 1 }} />
        <Skeleton height={40} borderRadius={Radius.md} style={{ flex: 1 }} />
      </View>
      <View style={[sk.grid, { marginBottom: 20 }]}>
        <Skeleton height={40} borderRadius={Radius.md} style={{ flex: 1 }} />
        <Skeleton height={40} borderRadius={Radius.md} style={{ flex: 1 }} />
      </View>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={72} borderRadius={Radius.md} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}

// ── Skeleton da tela Financeiro ────────────────────────────────────────────────
export function FinanceiroSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.page, { backgroundColor: colors.background }]}>
      <Skeleton width="50%" height={36} borderRadius={6} style={{ marginBottom: 20 }} />
      <View style={sk.row}>
        <Skeleton height={80} borderRadius={Radius.card} style={{ flex: 1 }} />
        <Skeleton height={80} borderRadius={Radius.card} style={{ flex: 1 }} />
      </View>
      <Skeleton height={80} borderRadius={Radius.card} style={{ marginBottom: 20 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} height={56} borderRadius={Radius.md} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}

// ── Skeleton da tela Suporte ───────────────────────────────────────────────────
export function SuporteSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.page, { backgroundColor: colors.background }]}>
      <Skeleton width="40%" height={36} borderRadius={6} style={{ marginBottom: 24 }} />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={52} borderRadius={Radius.md} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}

// ── Skeleton da inicialização (splash) ────────────────────────────────────────
export function AppInitSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.splash, { backgroundColor: colors.background }]}>
      <View style={[sk.page, { backgroundColor: colors.background }]}>
        <Skeleton height={52} borderRadius={8} style={{ marginBottom: 6 }} />
        <Skeleton width="55%" height={36} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="35%" height={14} borderRadius={6} style={{ marginBottom: 24 }} />
        <Skeleton width="45%" height={12} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton height={110} borderRadius={Radius.card} style={{ marginBottom: 10 }} />
        <Skeleton height={110} borderRadius={Radius.card} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  splash: { flex: 1 },
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});
