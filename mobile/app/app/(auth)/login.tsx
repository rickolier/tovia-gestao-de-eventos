import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { auth } from '../../lib/firebase';
import ToviaLogoMobile from '../../components/shared/ToviaLogoMobile';

const SIDEBAR = '#2D1470';
const PRIMARY = '#FF6B1A';
const WHITE = '#ffffff';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setAttempts(0);
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      const remaining = Math.max(0, 3 - next);
      Alert.alert(
        'Senha incorreta',
        remaining > 0
          ? `Mais ${remaining} tentativa${remaining > 1 ? 's' : ''} antes do envio automático de redefinição.`
          : 'E-mail ou senha incorretos. Verifique e tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoArea}>
              <ToviaLogoMobile width={240} toviaColor={WHITE} mobileColor={PRIMARY} />
              <Text style={styles.subtitle}>O app do organizador de eventos</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
              <Text style={styles.cardSub}>Gestão de eventos simplificada e profissional.</Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>E-MAIL</Text>
                <View style={styles.inputRow}>
                  <Mail size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Senha */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>SENHA</Text>
                <View style={styles.inputRow}>
                  <Lock size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              {/* Botão */}
              <TouchableOpacity
                style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={PRIMARY} />
                ) : (
                  <>
                    <Text style={styles.btnText}>ENTRAR</Text>
                    <ArrowRight size={16} color={PRIMARY} strokeWidth={2.5} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Não tem conta? Acesse{' '}
              <Text style={styles.footerLink}>tovia.app</Text>
              {' '}para criar a sua.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: SIDEBAR,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: WHITE,
    fontSize: 15,
    fontWeight: '400',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderRadius: 14,
    height: 50,
    marginTop: 8,
  },
  btnText: {
    color: PRIMARY,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 24,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
});
