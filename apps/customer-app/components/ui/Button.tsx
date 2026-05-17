import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  children, onPress, variant = 'primary', size = 'md',
  loading, disabled, fullWidth, style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'ghost' ? Colors.brand[500] : '#fff'} size="small" />
        : <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle]}>
            {children}
          </Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  primary:   { backgroundColor: Colors.brand[500] },
  secondary: { backgroundColor: Colors.surface[900] },
  ghost:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.surface[200] },
  danger:    { backgroundColor: '#ef4444' },

  sm: { height: 36, paddingHorizontal: 14 },
  md: { height: 48, paddingHorizontal: 20 },
  lg: { height: 56, paddingHorizontal: 28 },

  text:          { fontSize: 15, fontWeight: '600', color: '#fff' },
  primaryText:   { color: '#fff' },
  secondaryText: { color: '#fff' },
  ghostText:     { color: Colors.surface[700] },
  dangerText:    { color: '#fff' },
});
