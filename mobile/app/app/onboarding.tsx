import { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Animated, ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarCheck, QrCode, ClipboardList, CheckCircle2,
  WifiOff, Users, Bell, ArrowRight, ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { Typography, Radius } from '../constants/typography';

export const ONBOARDING_KEY = 'onboarding_done_v2';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: React.ReactNode;
  accent: string;
  title: string;
  description: string;
  tip?: string;
  tipIcon?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

const GREEN = '#1a7a45';
const GREEN_LIGHT = '#e8f5ee';

function makeSlides(firstName: string): Slide[] {
  return [
    {
      id: 'welcome',
      icon: <CalendarCheck size={72} color={GREEN} strokeWidth={1.5} />,
      accent: GREEN_LIGHT,
      title: `Olá, ${firstName}!`,
      description: 'Este é o seu app de campo para controle total dos seus eventos.',
      isFirst: true,
    },
    {
      id: 'checkin',
      icon: <QrCode size={64} color={GREEN} strokeWidth={1.5} />,
      accent: GREEN_LIGHT,
      title: 'Check-in',
      description: 'Faça check-in pela lista de inscritos com ou sem internet.',
      tip: 'Baixe a lista antes de chegar no local para usar sem internet.',
      tipIcon: <WifiOff size={16} color={GREEN} strokeWidth={2} />,
    },
    {
      id: 'tarefas',
      icon: <ClipboardList size={64} color={GREEN} strokeWidth={1.5} />,
      accent: GREEN_LIGHT,
      title: 'Tarefas',
      description: 'Gerencie tarefas do evento e acompanhe sua equipe em tempo real.',
      tip: 'Membros da equipe também acessam o app para ver suas tarefas.',
      tipIcon: <Users size={16} color={GREEN} strokeWidth={2} />,
    },
    {
      id: 'done',
      icon: <CheckCircle2 size={80} color={GREEN} strokeWidth={1.5} />,
      accent: GREEN_LIGHT,
      title: 'Pronto!',
      description: 'Tudo certo! Vamos começar.',
      isLast: true,
    },
  ];
}

function IllustrationBox({ slide, anim }: { slide: Slide; anim: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.illustrationBox,
        { backgroundColor: slide.accent },
        {
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        },
      ]}
    >
      {slide.icon}
    </Animated.View>
  );
}

function SlideContent({ slide, anim }: { slide: Slide; anim: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.contentArea,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <Text style={styles.slideTitle}>{slide.title}</Text>
      <Text style={styles.slideDesc}>{slide.description}</Text>
      {!!slide.tip && (
        <View style={styles.tipBox}>
          {slide.tipIcon}
          <Text style={styles.tipText}>{slide.tip}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const firstName = (profile?.nome ?? 'Organizador').split(' ')[0];
  const slides = makeSlides(firstName);

  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const anims = useRef(slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const animateIn = useCallback((index: number) => {
    anims[index].setValue(0);
    Animated.timing(anims[index], {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [anims]);

  function goToSlide(index: number) {
    flatRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
    animateIn(index);
  }

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(tabs)');
  }

  const renderItem: ListRenderItem<Slide> = ({ item, index }) => (
    <View style={styles.slide}>
      <IllustrationBox slide={item} anim={anims[index]} />
      <SlideContent slide={item} anim={anims[index]} />
    </View>
  );

  const current = slides[activeIndex];
  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          <Text style={styles.logoTovia}>tovia</Text>
          {'  '}
          <Text style={styles.logoSub}>GESTÃO DE EVENTOS</Text>
        </Text>
        {!current.isFirst && !current.isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA Button */}
      <View style={styles.bottomBar}>
        {isLast ? (
          <TouchableOpacity style={styles.ctaBtn} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Começar</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : current.isFirst ? (
          <TouchableOpacity style={styles.swipeHint} onPress={() => goToSlide(1)} activeOpacity={0.7}>
            <ChevronRight size={16} color="#9ca3af" strokeWidth={2} />
            <Text style={styles.swipeHintText}>DESLIZE PARA CONTINUAR</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => goToSlide(activeIndex + 1)} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Próximo</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f1' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1b3a2d',
  },
  logo: { flexDirection: 'row', alignItems: 'center' },
  logoTovia: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  logoSub: { color: '#a7c5b4', fontSize: 9, fontWeight: '600', letterSpacing: 1.2 },
  skipText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationBox: {
    width: 180,
    height: 180,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  contentArea: {
    width: '100%',
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: Radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    width: 24,
    backgroundColor: GREEN,
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  ctaBtn: {
    backgroundColor: GREEN,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  swipeHintText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
