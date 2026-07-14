import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [toviaW, setToviaW]   = useState(0);
  const [mobileW, setMobileW] = useState(0);
  const ready = toviaW > 0 && mobileW > 0;

  // Animated values
  const toviaOpacity  = useRef(new Animated.Value(0)).current;
  const toviaTX       = useRef(new Animated.Value(0)).current;
  const mobileOpacity = useRef(new Animated.Value(0)).current;
  const mobileTX      = useRef(new Animated.Value(18)).current;
  const dotOpacity    = useRef(new Animated.Value(0)).current;
  const dotTX         = useRef(new Animated.Value(0)).current;
  const containerFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ready) return;

    // Positions:
    // "tovia" centered = shifted right by mobileW/2 from its final position
    const toviaShift  = mobileW / 2;
    // dot under tovia (final pos) = left of combined center = -(mobileW/2)
    const dotUnderTovia  = -(mobileW / 2);
    // dot under mobile center = right of combined center = toviaW/2
    const dotUnderMobile = toviaW / 2;

    // Set tovia initial X (appears centered on screen)
    toviaTX.setValue(toviaShift);
    dotTX.setValue(toviaShift); // dot starts where tovia center is

    Animated.sequence([
      // Phase 1 — tovia + dot fade in suave (centralizado)
      Animated.parallel([
        Animated.timing(toviaOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dotOpacity,   { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.delay(300),

      // Phase 2 — tovia desliza esquerda, mobile aparece, ponto acompanha
      Animated.parallel([
        Animated.timing(toviaTX, {
          toValue: 0, duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotTX, {
          toValue: dotUnderTovia, duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(mobileOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(mobileTX,      { toValue: 0, duration: 650, useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(180),

      // Phase 3 — ponto vai para baixo de "mobile"
      Animated.timing(dotTX, {
        toValue: dotUnderMobile, duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(150),

      // Phase 4 — ponto centraliza sob "toviamobile"
      Animated.timing(dotTX, {
        toValue: 0, duration: 450,
        useNativeDriver: true,
      }),

      Animated.delay(800),

      // Phase 5 — fade out suave
      Animated.timing(containerFade, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      {/* Logo row */}
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

      {/* Dot — absolutely positioned, controlled by dotTX */}
      <Animated.View
        style={[
          styles.dot,
          { opacity: dotOpacity, transform: [{ translateX: dotTX }] },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#162d20',
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
    color: '#4ade80',
  },
  dot: {
    marginTop: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ade80',
  },
});
