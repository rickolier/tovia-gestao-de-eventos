import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [toviaW, setToviaW]   = useState(0);
  const [mobileW, setMobileW] = useState(0);
  const ready = toviaW > 0 && mobileW > 0;

  const toviaOpacity  = useRef(new Animated.Value(0)).current;
  const toviaTX       = useRef(new Animated.Value(0)).current;
  const mobileOpacity = useRef(new Animated.Value(0)).current;
  const mobileTX      = useRef(new Animated.Value(18)).current;
  const dotOpacity    = useRef(new Animated.Value(0)).current;
  const dotTX         = useRef(new Animated.Value(0)).current;
  const containerFade = useRef(new Animated.Value(1)).current;

  // Fallback: se onLayout não disparar (web), força com dimensões estimadas
  useEffect(() => {
    const t = setTimeout(() => {
      if (toviaW === 0) setToviaW(108);
      if (mobileW === 0) setMobileW(124);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const toviaShift     = mobileW / 2;
    const dotUnderTovia  = -(mobileW / 2);
    const dotUnderMobile = toviaW / 2;

    toviaTX.setValue(toviaShift);
    dotTX.setValue(toviaShift);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(toviaOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotOpacity,   { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.delay(300),

      Animated.parallel([
        Animated.timing(toviaTX, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(dotTX,   { toValue: dotUnderTovia, duration: 800, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(mobileOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(mobileTX,      { toValue: 0, duration: 650, useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(180),

      Animated.timing(dotTX, { toValue: dotUnderMobile, duration: 500, useNativeDriver: true }),
      Animated.delay(150),

      Animated.timing(dotTX, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.delay(800),

      Animated.timing(containerFade, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      <View style={styles.logoRow}>
        <Animated.Text
          style={[styles.tovia, { opacity: toviaOpacity, transform: [{ translateX: toviaTX }] }]}
          onLayout={e => setToviaW(e.nativeEvent.layout.width)}
        >
          tovia
        </Animated.Text>
        <Animated.Text
          style={[styles.mobile, { opacity: mobileOpacity, transform: [{ translateX: mobileTX }] }]}
          onLayout={e => setMobileW(e.nativeEvent.layout.width)}
        >
          mobile
        </Animated.Text>
      </View>

      <Animated.View
        style={[styles.dot, { opacity: dotOpacity, transform: [{ translateX: dotTX }] }]}
      />
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tovia: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#ffffff',
  },
  mobile: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#FF6B1A',
  },
  dot: {
    marginTop: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF6B1A',
  },
});
