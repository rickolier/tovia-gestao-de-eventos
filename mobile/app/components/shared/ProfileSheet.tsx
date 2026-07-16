import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Linking, Alert,
} from 'react-native';
import { LogOut, ExternalLink, Copy, Building2, User, FileText } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Radius, Shadow } from '../../constants/typography';

const PLAN_LABEL: Record<string, string> = {
  chinam: 'Chinám',
  petach: 'Pétach',
  koach: 'Koách',
  chalem: 'Chalém',
};

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  chinam: { bg: '#f0f4f2', text: '#6b7280' },
  petach: { bg: '#eff6ff', text: '#1e40af' },
  koach: { bg: '#FFF4EE', text: '#FF6B1A' },
  chalem: { bg: '#fdf4ff', text: '#7e22ce' },
};

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.caption, { color: colors.mutedFg, marginBottom: 1 }]}>{label}</Text>
        <Text style={[Typography.body, { color: colors.foreground, fontWeight: '500' }]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();

  const initials = profile?.name
    ? profile.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : '?';

  const plan = profile?.plan ?? 'chinam';
  const planStyle = PLAN_COLOR[plan] ?? PLAN_COLOR.chinam;

  const publicUrl = profile?.codigo
    ? `https://toviaapp.com.br/${profile.codigo}`
    : profile?.uid
    ? `https://toviaapp.com.br/o/${profile.uid}`
    : null;

  const copyLink = async () => {
    if (!publicUrl) return;
    await Clipboard.setStringAsync(publicUrl);
    Alert.alert('Link copiado!', publicUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, Shadow.floating, { backgroundColor: colors.card }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Avatar + info */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[Typography.h2, { color: colors.foreground, marginTop: 12 }]}>
            {profile?.name ?? ''}
          </Text>
          <Text style={[Typography.small, { color: colors.mutedFg, marginTop: 2 }]}>
            {profile?.email ?? ''}
          </Text>

          <View style={[styles.planBadge, { backgroundColor: planStyle.bg }]}>
            <Text style={[Typography.caption, { color: planStyle.text, fontWeight: '700' }]}>
              {PLAN_LABEL[plan]}
            </Text>
          </View>

        </View>

        {/* Campos do perfil */}
        <View style={[styles.fields, { borderColor: colors.border }]}>
          {!!profile?.instituicao && (
            <InfoRow
              icon={<Building2 size={14} color={colors.primary} strokeWidth={2} />}
              label="Instituição"
              value={profile.instituicao}
            />
          )}
          {!!profile?.name && (
            <InfoRow
              icon={<User size={14} color={colors.primary} strokeWidth={2} />}
              label="Nome do Produtor"
              value={profile.name}
            />
          )}
          {!!profile?.bio && (
            <InfoRow
              icon={<FileText size={14} color={colors.primary} strokeWidth={2} />}
              label="Bio"
              value={profile.bio}
            />
          )}

          {/* Link copiável */}
          {publicUrl && (
            <TouchableOpacity style={styles.linkRow} onPress={copyLink} activeOpacity={0.7}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
                <ExternalLink size={14} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.caption, { color: colors.mutedFg, marginBottom: 1 }]}>Página do organizador</Text>
                <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>{publicUrl}</Text>
              </View>
              <View style={[styles.copyBtn, { backgroundColor: colors.primaryLight }]}>
                <Copy size={13} color={colors.primary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Editar perfil */}
        <TouchableOpacity
          style={[styles.editBtn, { borderColor: colors.primary }]}
          onPress={() => { onClose(); Linking.openURL('https://toviaapp.com.br/desenvolvimento/login?redirect=/desenvolvimento/dashboard'); }}
          activeOpacity={0.8}
        >
          <ExternalLink size={15} color={colors.primary} strokeWidth={2} />
          <Text style={[Typography.body, { color: colors.primary, fontWeight: '600' }]}>
            Editar perfil
          </Text>
        </TouchableOpacity>

        {/* Sair */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => { onClose(); signOut(auth); }}
          activeOpacity={0.7}
        >
          <LogOut size={15} color={colors.danger} strokeWidth={2} />
          <Text style={[Typography.body, { color: colors.danger }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  planBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  fields: {
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 13,
    marginTop: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
});
