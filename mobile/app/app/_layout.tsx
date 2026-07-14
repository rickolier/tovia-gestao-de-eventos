import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { AppInitSkeleton } from '../components/ui/Skeleton';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { PermissoesProvider } from '../contexts/PermissoesContext';

function RootLayoutInner() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { scheme } = useThemeContext();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && profile?.isAdmin) {
      router.replace('/admin-block');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AppInitSkeleton />
      </>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <PermissoesProvider>
          <RootLayoutInner />
        </PermissoesProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
