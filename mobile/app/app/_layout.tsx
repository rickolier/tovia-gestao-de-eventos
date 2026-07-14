import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { AppInitSkeleton } from '../components/ui/Skeleton';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { PermissoesProvider } from '../contexts/PermissoesContext';
import SplashScreen from '../components/SplashScreen';
import { ONBOARDING_KEY } from './onboarding';

function RootLayoutInner() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { scheme } = useThemeContext();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && profile?.isAdmin) {
      router.replace('/admin-block');
    } else if (user && inAuth) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
        if (done) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <AppInitSkeleton />
      </>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
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
