import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface TopBarProps {
  onAvatarPress: () => void;
}

export default function TopBar({ onAvatarPress }: TopBarProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();

  const initials = profile?.name
    ? profile.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : '?';

  return (
    <View style={[styles.bar, { backgroundColor: colors.sidebar, borderBottomColor: colors.sidebarBorder }]}>
      {/* Logo */}
      <Text style={styles.logo}>
        tovia<Text style={[styles.logoAccent, { color: colors.primary }]}>mobile</Text>
      </Text>

      {/* Avatar + nome */}
      <TouchableOpacity style={styles.userArea} onPress={onAvatarPress} activeOpacity={0.75}>
        <Text style={styles.userName} numberOfLines={1}>
          {profile?.name?.split(' ')[0] ?? ''}
        </Text>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
    color: '#ffffff',
  },
  logoAccent: {
    fontWeight: '900',
  },
  userArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 80,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
