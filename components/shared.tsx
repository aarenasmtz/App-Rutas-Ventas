import { type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Wifi, WifiOff, CloudCheck, CloudOff, Clock, X } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export { Card, Badge } from './ui';

export function ConnectivityBanner() {
  const { online } = useApp();
  if (online) return null;
  return (
    <View style={bannerStyles.container}>
      <WifiOff size={18} color={colors.neutral[0]} />
      <Text style={bannerStyles.text}>Sin conexión. Tus movimientos se guardarán en el dispositivo y se sincronizarán automáticamente.</Text>
    </View>
  );
}

export function ConnectivityIndicator() {
  const { online, conexionEstado, toggleOnline } = useApp();
  const isOnline = online;
  const c = isOnline ? colors.success[600] : colors.error[500];
  const Icon = isOnline ? CloudCheck : CloudOff;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={toggleOnline} style={connStyles.container}>
      <Icon size={16} color={c} />
      <Text style={[connStyles.text, { color: c }]}>{conexionEstado}</Text>
    </TouchableOpacity>
  );
}

import { useRouter } from 'expo-router';

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBack) {
      if (router.canGoBack()) {
        onBack();
      } else {
        router.replace('/(tabs)/mas');
      }
    }
  };

  return (
    <View style={headerStyles.container}>
      {onBack && (
        <TouchableOpacity onPress={handleBackPress} style={headerStyles.backBtn}>
          <Text style={headerStyles.backText}>‹</Text>
        </TouchableOpacity>
      )}
      <View style={headerStyles.titles}>
        <Text style={headerStyles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={headerStyles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn}>
              <X size={22} color={colors.neutral[400]} />
            </TouchableOpacity>
          </View>
          <ScrollView style={sheetStyles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.error[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.neutral[0],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});

const connStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.neutral[0],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  backText: {
    fontSize: 28,
    color: colors.neutral[700],
    marginTop: -4,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
});

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
