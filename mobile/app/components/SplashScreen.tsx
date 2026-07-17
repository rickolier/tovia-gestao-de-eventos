import { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import ToviaLogoMobile from './shared/ToviaLogoMobile';

interface SplashScreenProps {
  onFinish: () => void;
}

// Tempo total preservado da splash original: 700 + 3230 + 600 = 4530ms
const FADE_IN = 700;
const HOLD = 3230;
const FADE_OUT = 600;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  const logoWidth = Math.min(300, Dimensions.get('window').width * 0.72);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FADE_IN, useNativeDriver: true }),
      Animated.delay(HOLD),
      Animated.timing(opacity, { toValue: 0, duration: FADE_OUT, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <ToviaLogoMobile width={logoWidth} toviaColor="#ffffff" mobileColor="#FF6B1A" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#2D1470',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
