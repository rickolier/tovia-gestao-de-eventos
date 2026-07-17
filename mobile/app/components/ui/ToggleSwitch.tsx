import { Switch } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (valor: boolean) => void;
  disabled?: boolean;
}

/*
  Toggle padrão do app: ligado = verde (success), desligado = cinza.
  Use sempre este componente no lugar do Switch cru, para as cores não divergirem.
*/
export default function ToggleSwitch({ value, onValueChange, disabled }: ToggleSwitchProps) {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.success }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.border}
    />
  );
}
