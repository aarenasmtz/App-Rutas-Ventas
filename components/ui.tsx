import { type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, shadows.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, shadows.card, style]}>{children}</View>;
}

export function Badge({ label, color = 'azul' }: { label: string; color?: 'verde' | 'amber' | 'rojo' | 'azul' | 'neutral' }) {
  const colorMap = {
    verde: { bg: colors.success[50], text: colors.success[700] },
    amber: { bg: colors.warning[50], text: colors.warning[700] },
    rojo: { bg: colors.error[50], text: colors.error[700] },
    azul: { bg: colors.primary[50], text: colors.primary[700] },
    neutral: { bg: colors.neutral[100], text: colors.neutral[600] },
  };
  const c = colorMap[color];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: c.bg }]}>
      <Text style={[badgeStyles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {action}
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, style, disabled }: { title: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[btnStyles.primary, disabled && btnStyles.disabled, style]}
    >
      {icon}
      <Text style={btnStyles.primaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, icon, style }: { title: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[btnStyles.secondary, style]}>
      {icon}
      <Text style={btnStyles.secondaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function StatCard({ label, value, color = 'azul', icon }: { label: string; value: string; color?: 'verde' | 'amber' | 'rojo' | 'azul'; icon?: ReactNode }) {
  const colorMap = {
    verde: colors.success[600],
    amber: colors.warning[500],
    rojo: colors.error[500],
    azul: colors.primary[600],
  };
  const accent = colorMap[color];
  return (
    <Card style={statStyles.card}>
      <View style={statStyles.header}>
        {icon && <View style={[statStyles.iconWrap, { backgroundColor: accent + '18' }]}>{icon}</View>}
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Card>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <View style={emptyStyles.container}>
      {icon && <View style={emptyStyles.iconWrap}>{icon}</View>}
      <Text style={emptyStyles.title}>{title}</Text>
      {subtitle && <Text style={emptyStyles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
});

const btnStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.5,
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryText: {
    color: colors.neutral[700],
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    lineHeight: 36,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
});
