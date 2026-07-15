import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CheckSquare, List, DollarSign, HelpCircle, LucideIcon } from 'lucide-react-native';
import { Colors, ColorScheme } from '../../constants/colors';
import { useThemeContext } from '../../contexts/ThemeContext';
import { usePermissoes } from '../../contexts/PermissoesContext';

// ── Ícone padrão com animação de escala ───────────────────────────────────────
function TabIcon({ Icon, color, focused }: { Icon: LucideIcon; color: string; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: focused ? 1.2 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: 4 }}>
      <Icon color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
}

// ── Botão central flutuante do Check-in ───────────────────────────────────────
function CheckinFab({ focused, scheme }: { focused: boolean; scheme: ColorScheme }) {
  const colors = Colors[scheme];
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: focused ? colors.primaryDark : colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -36,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12,
        borderWidth: 4,
        borderColor: Colors[scheme].tabBar,
      }}
    >
      <CheckSquare size={26} color="#fff" strokeWidth={2} />
    </Animated.View>
  );
}

// Retorna `tabBarButton: () => null` para esconder a aba visualmente
function hidden() {
  return { tabBarButton: () => null, tabBarItemStyle: { display: 'none' as const } };
}

export default function TabsLayout() {
  const { scheme, colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 8);
  const tabBarHeight = 72 + bottomPad;
  const router = useRouter();

  const {
    loading,
    isMemberOnly,
    podeVerInicio,
    podeVerFinanceiro,
    podeVerCheckin,
    podeVerTarefas,
  } = usePermissoes();

  // Redireciona membro restrito para a primeira aba disponível
  useEffect(() => {
    if (loading || !isMemberOnly) return;
    if (podeVerCheckin && !podeVerInicio) {
      router.replace('/(tabs)/checkin');
    } else if (podeVerTarefas && !podeVerInicio && !podeVerCheckin) {
      router.replace('/(tabs)/tarefas');
    } else if (podeVerFinanceiro && !podeVerInicio) {
      router.replace('/(tabs)/financeiro');
    }
  }, [loading, isMemberOnly, podeVerInicio, podeVerCheckin, podeVerTarefas, podeVerFinanceiro]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedFg,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomPad,
          paddingTop: 14,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      {/* 1 — Início */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />,
          ...(podeVerInicio ? {} : hidden()),
        }}
      />

      {/* 2 — Financeiro */}
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={DollarSign} color={color} focused={focused} />,
          ...(podeVerFinanceiro ? {} : hidden()),
        }}
      />

      {/* 3 — Check-in (central, flutuante) */}
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ focused }) => <CheckinFab focused={focused} scheme={scheme} />,
          ...(podeVerCheckin ? {} : hidden()),
        }}
      />

      {/* 4 — Tarefas */}
      <Tabs.Screen
        name="tarefas"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={List} color={color} focused={focused} />,
          ...(podeVerTarefas ? {} : hidden()),
        }}
      />

      {/* 5 — Suporte (sempre visível — contém logout) */}
      <Tabs.Screen
        name="suporte"
        options={{
          title: 'Suporte',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={HelpCircle} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
