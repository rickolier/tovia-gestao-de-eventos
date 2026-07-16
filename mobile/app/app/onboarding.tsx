import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarCheck, QrCode, WifiOff, Users,
  ArrowRight, ChevronRight, Check, ClipboardList,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';

export const ONBOARDING_KEY = 'onboarding_done_v2';

const { width: W } = Dimensions.get('window');
const GREEN = '#FF6B1A';
const GREEN_DARK = '#1b3a2d';
const GREEN_LIGHT = '#FFF4EE';
const GREEN_PALE = '#f0faf4';
const SLIDE_IDS = ['welcome', 'checkin', 'tarefas', 'done'] as const;

/* ─── NavBar ─── */
function NavBar({ onSkip }: { onSkip?: () => void }) {
  return (
    <View style={st.navbar}>
      <View style={st.navBrand}>
        <Text style={st.navTovia}>tovia</Text>
        <View style={st.navPipe} />
        <Text style={st.navSub}>{'GESTÃO DE\nEVENTOS'}</Text>
      </View>
      {onSkip && (
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={st.navSkip}>Pular</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── TipBox ─── */
function TipBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={st.tip}>
      {icon}
      <Text style={st.tipText}>{text}</Text>
    </View>
  );
}

/* ─── BottomBar ─── */
function BottomBar({
  index, total, isFirst, isLast, onNext, onFinish,
}: {
  index: number; total: number; isFirst: boolean; isLast: boolean;
  onNext: () => void; onFinish: () => void;
}) {
  return (
    <View style={st.bottom}>
      <View style={st.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[st.dot, i === index && st.dotActive]} />
        ))}
      </View>
      {isLast ? (
        <TouchableOpacity style={st.cta} onPress={onFinish} activeOpacity={0.85}>
          <Text style={st.ctaText}>Começar</Text>
          <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      ) : isFirst ? (
        <TouchableOpacity style={st.swipeHint} onPress={onNext} activeOpacity={0.7}>
          <ChevronRight size={16} color="#9ca3af" strokeWidth={2} />
          <Text style={st.swipeHintText}>DESLIZE PARA CONTINUAR</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={st.cta} onPress={onNext} activeOpacity={0.85}>
          <Text style={st.ctaText}>Próximo</Text>
          <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Screen 1: WELCOME ─── */
function WelcomeSlide({
  firstName, floatAnim, entryAnim, onNext, onFinish, index,
}: {
  firstName: string; floatAnim: Animated.Value; entryAnim: Animated.Value;
  onNext: () => void; onFinish: () => void; index: number;
}) {
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const entryScale = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const entrySlide = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={{ width: W, flex: 1, backgroundColor: GREEN_PALE }}>
      {/* Dark top section */}
      <View style={st.s1Dark}>
        {/* Decorative rings */}
        <View style={[st.s1Ring, { width: 320, height: 320, top: -130, left: -60 }]} />
        <View style={[st.s1Ring, { width: 200, height: 200, top: -70, right: -50 }]} />
        <View style={[st.s1Ring, { width: 100, height: 100, bottom: 60, left: 18 }]} />

        {/* Floating icon card */}
        <Animated.View style={[
          st.s1Card,
          { opacity: entryAnim, transform: [{ scale: entryScale }] },
        ]}>
          <Animated.View style={{ transform: [{ translateY: floatY }], alignItems: 'center', gap: 6 }}>
            <CalendarCheck size={58} color={GREEN} strokeWidth={1.5} />
            <Text style={st.s1CardSub}>MOBILE</Text>
          </Animated.View>
        </Animated.View>

        {/* Wordmark below card */}
        <Animated.View style={{ opacity: entryAnim, marginTop: 20, alignItems: 'center' }}>
          <Text style={st.s1Wordmark}>tovia</Text>
          <View style={st.s1DecoDots}>
            <View style={st.s1DecoDot} />
            <View style={[st.s1DecoDot, st.s1DecoDotActive]} />
            <View style={st.s1DecoDot} />
          </View>
        </Animated.View>
      </View>

      {/* Light bottom section */}
      <View style={st.s1Light}>
        <Animated.View style={{ opacity: entryAnim, transform: [{ translateY: entrySlide }] }}>
          <Text style={st.s1Eyebrow}>TOVIA · GESTÃO DE EVENTOS</Text>
          <Text style={st.s1Hi}>Olá, {firstName}!</Text>
          <Text style={st.s1Body}>
            Seu app de campo para controle total dos seus eventos.
          </Text>
        </Animated.View>
      </View>

      <BottomBar index={index} total={4} isFirst isLast={false} onNext={onNext} onFinish={onFinish} />
    </View>
  );
}

/* ─── Screen 2: CHECK-IN ─── */
function CheckinSlide({
  scanAnim, entryAnim, onNext, onSkip, onFinish, index,
}: {
  scanAnim: Animated.Value; entryAnim: Animated.Value;
  onNext: () => void; onSkip: () => void; onFinish: () => void; index: number;
}) {
  const SCAN_BOX_H = 86;
  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [4, SCAN_BOX_H - 6] });
  const entrySlide = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={{ width: W, flex: 1, backgroundColor: '#fff' }}>
      <NavBar onSkip={onSkip} />

      {/* Illustration */}
      <View style={st.s2Illus}>
        <View style={st.s2BgCircle} />
        <View style={st.innerPhone}>
          {/* Phone bar */}
          <View style={st.ipBar}><View style={st.ipPill} /></View>
          {/* Phone screen */}
          <View style={st.ipScreen}>
            <Text style={st.ipLabel}>ESCANEAR QR CODE</Text>
            <View style={[st.scanBox, { height: SCAN_BOX_H }]}>
              <QrCode size={56} color="#111827" strokeWidth={1.5} />
              <Animated.View style={[st.scanLine, { transform: [{ translateY: scanY }] }]} />
            </View>
            {/* Confirmed row */}
            <View style={st.ipRow}>
              <View style={st.ipAvatar}><Text style={st.ipAvatarText}>JM</Text></View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={st.ipLine} />
                <View style={[st.ipLine, { width: '58%' }]} />
              </View>
              <View style={st.ipOk}><Check size={8} color="#fff" strokeWidth={2.5} /></View>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[st.content, { opacity: entryAnim, transform: [{ translateY: entrySlide }] }]}>
        <Text style={st.slideTitle}>Check-in</Text>
        <Text style={st.slideDesc}>Confirme presenças por QR Code ou pela lista de inscritos, mesmo sem internet.</Text>
        <TipBox
          icon={<WifiOff size={16} color="#92400e" strokeWidth={2} />}
          text="Baixe a lista antes de sair para o local e use sem internet no dia do evento."
        />
      </Animated.View>

      <BottomBar index={index} total={4} isFirst={false} isLast={false} onNext={onNext} onFinish={onFinish} />
    </View>
  );
}

/* ─── Screen 3: TAREFAS ─── */
function TaskRow({ done, text, last }: { done?: boolean; text: string; last?: boolean }) {
  return (
    <View style={[st.task, !last && { borderBottomWidth: 1, borderBottomColor: '#f9fafb' }]}>
      <View style={[st.cb, done && st.cbDone]}>
        {done && <Check size={8} color="#fff" strokeWidth={2.5} />}
      </View>
      <Text style={[st.taskText, done && st.taskDone]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function TarefasSlide({
  entryAnim, onNext, onSkip, onFinish, index,
}: {
  entryAnim: Animated.Value;
  onNext: () => void; onSkip: () => void; onFinish: () => void; index: number;
}) {
  const entrySlide = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={{ width: W, flex: 1, backgroundColor: '#fff' }}>
      <NavBar onSkip={onSkip} />

      {/* Task card illustration */}
      <View style={st.s3Illus}>
        <View style={st.tcard}>
          {/* Card header */}
          <View style={st.tcHd}>
            <View style={st.tcIcon}>
              <ClipboardList size={13} color="#fff" strokeWidth={2} />
            </View>
            <Text style={st.tcName} numberOfLines={1}>Acampamento de Jovens 2026</Text>
            <View style={{ flexDirection: 'row' }}>
              {[['#dbeafe','#1d4ed8','LF'],['#fce7f3','#9d174d','MR'],['#FFF4EE',GREEN,'JP']].map(([bg, color, init]) => (
                <View key={init} style={[st.tcAv, { backgroundColor: bg, marginLeft: init === 'LF' ? 0 : -5 }]}>
                  <Text style={[st.tcAvText, { color }]}>{init}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Tasks */}
          <View style={st.tasks}>
            <TaskRow done text="Montar estrutura do palco" />
            <TaskRow text="Testar sistema de som" />
            <TaskRow text="Receber fornecedores" last />
          </View>
          {/* Badge */}
          <View style={st.tcBadgeRow}>
            <View style={st.tcBadge}>
              <View style={st.tcBadgeDot} />
              <Text style={st.tcBadgeText}>Atualizando em tempo real</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[st.content, { opacity: entryAnim, transform: [{ translateY: entrySlide }] }]}>
        <Text style={st.slideTitle}>Tarefas</Text>
        <Text style={st.slideDesc}>Gerencie o que precisa ser feito e acompanhe sua equipe ao vivo.</Text>
        <TipBox
          icon={<Users size={16} color="#92400e" strokeWidth={2} />}
          text="Membros da equipe também acessam o app e veem as tarefas atribuídas a eles."
        />
      </Animated.View>

      <BottomBar index={index} total={4} isFirst={false} isLast={false} onNext={onNext} onFinish={onFinish} />
    </View>
  );
}

/* ─── Screen 4: PRONTO ─── */
function ProntoSlide({
  pulseAnims, entryAnim, onFinish, index,
}: {
  pulseAnims: Animated.Value[]; entryAnim: Animated.Value;
  onFinish: () => void; index: number;
}) {
  const RING_SIZES = [170, 134, 102];
  const entryScale = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const entrySlide = entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <View style={{ width: W, flex: 1, backgroundColor: GREEN_PALE }}>
      <NavBar />

      {/* Rings + checkmark */}
      <View style={st.s4Illus}>
        <Animated.View style={{ opacity: entryAnim, transform: [{ scale: entryScale }] }}>
          <View style={st.s4Rings}>
            {RING_SIZES.map((size, i) => {
              const scale = pulseAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] });
              const opacity = pulseAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] });
              return (
                <Animated.View
                  key={i}
                  style={[
                    st.s4Ring,
                    { width: size, height: size, borderRadius: size / 2 },
                    { transform: [{ scale }], opacity },
                  ]}
                />
              );
            })}
            <View style={st.s4Check}>
              <Check size={30} color="#fff" strokeWidth={2.5} />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View style={[{ alignItems: 'center', paddingHorizontal: 28 }, { opacity: entryAnim, transform: [{ translateY: entrySlide }] }]}>
        <Text style={st.s4Title}>Pronto!</Text>
        <Text style={st.s4Desc}>Tudo certo! Agora você tem tudo que precisa para arrasar no dia do evento.</Text>
      </Animated.View>

      <BottomBar index={index} total={4} isFirst={false} isLast onNext={onFinish} onFinish={onFinish} />
    </View>
  );
}

/* ─── Main Screen ─── */
const ND = Platform.OS !== 'web'; // useNativeDriver only on native

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const firstName = (profile?.nome ?? 'Organizador').split(' ')[0];

  const [activeIndex, setActiveIndex] = useState(0);
  const entryAnims = useRef(SLIDE_IDS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  // Ambient animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1600, useNativeDriver: ND }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: ND }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1000, useNativeDriver: ND }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1000, useNativeDriver: ND }),
      ])
    ).start();

    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: ND }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: ND }),
        ])
      );

    Animated.parallel(pulseAnims.map((a, i) => createPulse(a, i * 400))).start();
  }, []);

  const animateIn = useCallback((index: number) => {
    entryAnims[index].setValue(0);
    Animated.timing(entryAnims[index], {
      toValue: 1,
      duration: 360,
      useNativeDriver: ND,
    }).start();
  }, [entryAnims]);

  function goToSlide(index: number) {
    setActiveIndex(index);
    animateIn(index);
  }

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(tabs)');
  }

  const commonProps = (index: number) => ({
    entryAnim: entryAnims[index],
    onNext: () => goToSlide(index + 1),
    onSkip: finish,
    onFinish: finish,
    index,
  });

  const show = (i: number): object => ({ display: activeIndex === i ? 'flex' : 'none', flex: 1 });

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <View style={show(0)}><WelcomeSlide firstName={firstName} floatAnim={floatAnim} {...commonProps(0)} /></View>
      <View style={show(1)}><CheckinSlide scanAnim={scanAnim} {...commonProps(1)} /></View>
      <View style={show(2)}><TarefasSlide {...commonProps(2)} /></View>
      <View style={show(3)}><ProntoSlide pulseAnims={pulseAnims} {...commonProps(3)} /></View>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN_DARK },

  // NavBar
  navbar: {
    height: 52,
    backgroundColor: GREEN_DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center' },
  navTovia: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  navPipe: { width: 1, height: 18, backgroundColor: '#2d5c44', marginHorizontal: 9 },
  navSub: { color: '#7aac91', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, lineHeight: 12 },
  navSkip: { color: '#a7c8b5', fontSize: 14, fontWeight: '500' },

  // ── Screen 1 ──
  s1Dark: {
    height: 274,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 16,
  },
  s1Ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  s1Card: {
    width: 118,
    height: 118,
    backgroundColor: '#fff',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  s1CardSub: { color: '#a8d8be', fontSize: 8, fontWeight: '700', letterSpacing: 2 },
  s1Wordmark: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  s1DecoDots: { flexDirection: 'row', gap: 6, marginTop: 6, justifyContent: 'center' },
  s1DecoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#a8d8be' },
  s1DecoDotActive: { width: 18, borderRadius: 3, backgroundColor: GREEN },
  s1Light: { flex: 1, paddingHorizontal: 28, paddingTop: 28, justifyContent: 'flex-start' },
  s1Eyebrow: { color: GREEN, fontSize: 9.5, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 },
  s1Hi: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5, marginBottom: 10 },
  s1Body: { fontSize: 15, color: '#4b5563', lineHeight: 23 },

  // ── Screen 2 ──
  s2Illus: {
    height: 244,
    backgroundColor: '#f8fefb',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  s2BgCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: GREEN_LIGHT,
    opacity: 0.5,
    top: 18,
    left: 14,
  },
  innerPhone: {
    width: 152,
    height: 200,
    borderWidth: 2.5,
    borderColor: GREEN_DARK,
    borderRadius: 22,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  ipBar: { height: 22, backgroundColor: GREEN_DARK, alignItems: 'center', justifyContent: 'center' },
  ipPill: { width: 34, height: 5, backgroundColor: '#2d5c44', borderRadius: 3 },
  ipScreen: { flex: 1, padding: 9, gap: 6 },
  ipLabel: { fontSize: 7, fontWeight: '700', letterSpacing: 0.8, color: '#6b7280' },
  scanBox: {
    borderWidth: 1.5,
    borderColor: GREEN,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#22c55e',
    borderRadius: 1,
    top: 0,
  },
  ipRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  ipAvatar: { width: 17, height: 17, borderRadius: 8.5, backgroundColor: GREEN_LIGHT, alignItems: 'center', justifyContent: 'center' },
  ipAvatarText: { fontSize: 7, fontWeight: '700', color: GREEN },
  ipLine: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  ipOk: { width: 15, height: 15, borderRadius: 7.5, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  // ── Screen 3 ──
  s3Illus: {
    height: 238,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 16,
  },
  tcard: {
    width: '100%',
    maxWidth: 288,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tcHd: {
    backgroundColor: GREEN_PALE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tcIcon: { width: 26, height: 26, backgroundColor: GREEN, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  tcName: { flex: 1, fontSize: 10.5, fontWeight: '700', color: GREEN },
  tcAv: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: GREEN_PALE, alignItems: 'center', justifyContent: 'center' },
  tcAvText: { fontSize: 7, fontWeight: '700' },
  tasks: { paddingHorizontal: 14 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  cb: { width: 15, height: 15, borderRadius: 4, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  cbDone: { backgroundColor: GREEN, borderColor: GREEN },
  taskText: { fontSize: 11.5, color: '#374151', fontWeight: '500', flex: 1 },
  taskDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  tcBadgeRow: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  tcBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: GREEN_LIGHT, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tcBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  tcBadgeText: { fontSize: 9.5, fontWeight: '700', color: GREEN },

  // ── Screen 4 ──
  s4Illus: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  s4Rings: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  s4Ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  s4Check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  s4Title: { fontSize: 30, fontWeight: '800', color: '#111827', letterSpacing: -0.6, textAlign: 'center', marginBottom: 10 },
  s4Desc: { fontSize: 14.5, color: '#4b5563', lineHeight: 22, textAlign: 'center' },

  // ── Shared content ──
  content: { paddingHorizontal: 24, paddingTop: 14, flex: 1 },
  slideTitle: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5, marginBottom: 6 },
  slideDesc: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  tipText: { flex: 1, fontSize: 12.5, color: '#92400e', lineHeight: 19, fontWeight: '500' },

  // ── Bottom bar ──
  bottom: {
    paddingHorizontal: 22,
    paddingBottom: 8,
    paddingTop: 4,
    alignItems: 'center',
    gap: 10,
  },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#d1d5db' },
  dotActive: { width: 24, borderRadius: 3.5, backgroundColor: GREEN },
  cta: {
    width: '100%',
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 15.5, fontWeight: '700' },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
  },
  swipeHintText: { color: '#9ca3af', fontSize: 10.5, fontWeight: '700', letterSpacing: 1.6 },
});
