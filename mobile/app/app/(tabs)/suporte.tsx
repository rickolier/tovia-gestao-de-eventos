import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen, MessageCircle, RefreshCw, Info,
  Shield, FileText, LogOut, ChevronRight, Moon, Sun, Smartphone, Bell,
} from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../lib/firebase';
import { ONBOARDING_KEY } from '../onboarding';
import { useTheme } from '../../hooks/useTheme';
import { ThemeMode } from '../../contexts/ThemeContext';
import { Typography, Radius, Shadow } from '../../constants/typography';
import TopBar from '../../components/shared/TopBar';
import ProfileSheet from '../../components/shared/ProfileSheet';
import NotificacoesSheet from '../../components/NotificacoesSheet';
import { useState } from 'react';

const APP_VERSION = '1.0.0';

interface RowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function Row({ icon, label, onPress, destructive, showChevron = true }: RowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: destructive ? '#fee2e2' : colors.primaryLight }]}>
        {icon}
      </View>
      <Text style={[
        Typography.body,
        styles.rowLabel,
        { color: destructive ? colors.danger : colors.foreground },
      ]}>
        {label}
      </Text>
      {showChevron && <ChevronRight size={16} color={colors.mutedFg} strokeWidth={2} />}
    </TouchableOpacity>
  );
}

const THEME_OPTIONS: { key: ThemeMode; label: string; Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }> }[] = [
  { key: 'light', label: 'Claro', Icon: Sun },
  { key: 'dark',  label: 'Escuro', Icon: Moon },
  { key: 'system', label: 'Sistema', Icon: Smartphone },
];

function ThemeToggle() {
  const { colors, mode, setMode } = useTheme();
  return (
    <View style={[styles.themeCard, Shadow.flat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[Typography.label, { color: colors.mutedFg, flex: 1 }]}>Aparência</Text>
      <View style={[styles.themeRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {THEME_OPTIONS.map(({ key, label, Icon }) => {
          const active = mode === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.themeOption,
                active && { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setMode(key)}
              activeOpacity={0.75}
            >
              <Icon size={13} color={active ? colors.primary : colors.mutedFg} strokeWidth={2} />
              <Text style={[Typography.caption, { color: active ? colors.primary : colors.mutedFg, marginLeft: 4, fontWeight: active ? '700' : '400', fontSize: 11 }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function SuporteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  async function openOnboarding() {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    router.push('/onboarding');
  }

  function confirmSignOut() {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopBar onAvatarPress={() => setProfileOpen(true)} />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificacoesSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[Typography.display, { color: colors.foreground, marginBottom: 20 }]}>Suporte</Text>

        {/* Ajuda */}
        <Text style={[Typography.label, { color: colors.mutedFg, marginBottom: 8 }]}>Ajuda</Text>
        <View style={[styles.card, Shadow.flat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon={<BookOpen size={16} color={colors.primary} strokeWidth={2} />}
            label="Base de Conhecimento"
            onPress={() => Linking.openURL('https://toviaapp.com.br/desenvolvimento/login?redirect=/desenvolvimento/base-de-conhecimento')}
          />
          <Row
            icon={<MessageCircle size={16} color={colors.primary} strokeWidth={2} />}
            label="Fale Conosco"
            onPress={() => Linking.openURL('mailto:suporte@toviaapp.com.br?subject=Suporte%20Tovia%20Mobile')}
          />
          <Row
            icon={<RefreshCw size={16} color={colors.primary} strokeWidth={2} />}
            label="Rever tutorial"
            onPress={openOnboarding}
            showChevron={false}
          />
        </View>

        {/* Aparência */}
        <ThemeToggle />

        {/* Notificações */}
        <TouchableOpacity
          style={[styles.notifRow, Shadow.flat, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setNotifOpen(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.notifIcon, { backgroundColor: colors.primaryLight }]}>
            <Bell size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[Typography.body, { flex: 1, color: colors.foreground, fontWeight: '500' }]}>Notificações</Text>
          <ChevronRight size={16} color={colors.mutedFg} strokeWidth={2} />
        </TouchableOpacity>

        {/* Sobre */}
        <Text style={[Typography.label, { color: colors.mutedFg, marginTop: 24, marginBottom: 8 }]}>Sobre</Text>
        <View style={[styles.card, Shadow.flat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Info size={16} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[Typography.body, styles.rowLabel, { color: colors.foreground }]}>
              {`Tovia Mobile  v${APP_VERSION}`}
            </Text>
          </View>
          <Row
            icon={<Shield size={16} color={colors.primary} strokeWidth={2} />}
            label="Política de Privacidade"
            onPress={() => Linking.openURL('https://toviaapp.com.br/privacidade')}
          />
          <Row
            icon={<FileText size={16} color={colors.primary} strokeWidth={2} />}
            label="Termos de Uso"
            onPress={() => Linking.openURL('https://toviaapp.com.br/termos-de-uso')}
          />
        </View>

        {/* Sair */}
        <View style={[styles.card, Shadow.flat, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
          <Row
            icon={<LogOut size={16} color={colors.danger} strokeWidth={2} />}
            label="Sair"
            onPress={confirmSignOut}
            destructive
            showChevron={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  themeCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notifRow: {
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 0,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontWeight: '500' },
});
