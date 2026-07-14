import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTheme } from '../hooks/useTheme';
import { Typography, Radius } from '../constants/typography';

export default function AdminBlockScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Lock size={40} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={[Typography.h1, { color: colors.foreground, textAlign: 'center', marginTop: 20 }]}>
          Acesso restrito
        </Text>
        <Text style={[Typography.body, { color: colors.mutedFg, textAlign: 'center', marginTop: 10, lineHeight: 22 }]}>
          A Central Tovia é acessada exclusivamente via web. Utilize tovia.app no seu navegador.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, marginTop: 32 }]}
          onPress={() => Linking.openURL('https://tovia.app')}
        >
          <Text style={styles.btnText}>Abrir tovia.app</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => signOut(auth)} style={{ marginTop: 20 }}>
          <Text style={[Typography.body, { color: colors.mutedFg }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  btn: { width: '100%', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
