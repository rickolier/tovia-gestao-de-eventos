import { useEffect, useRef } from 'react';
import { Pressable, View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (valor: boolean) => void;
  disabled?: boolean;
}

/*
  Toggle padrão do app (web + mobile), baseado na referência aprovada:
  thumb branco grande transbordando a trilha, com sombra.
  Ligado = verde (toggleOn), desligado = cinza (toggleOff).
*/
const TRACK_W = 52;
const TRACK_H = 28;
const THUMB = 34;              // maior que a trilha — transborda
const OFF_X = -3;              // leve transbordo à esquerda
const ON_X = TRACK_W - THUMB + 3; // leve transbordo à direita

export default function ToggleSwitch({ value, onValueChange, disabled }: ToggleSwitchProps) {
  const { colors } = useTheme();
  const tx = useRef(new Animated.Value(value ? ON_X : OFF_X)).current;

  useEffect(() => {
    Animated.timing(tx, {
      toValue: value ? ON_X : OFF_X,
      duration: 170,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={[styles.track, { backgroundColor: value ? colors.toggleOn : colors.toggleOff }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: tx }] }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: 999,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: (TRACK_H - THUMB) / 2,
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#ffffff',
    // sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 4,
  },
});
