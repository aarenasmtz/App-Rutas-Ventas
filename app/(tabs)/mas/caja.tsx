import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { Card, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

export default function CajaScreen() {
  const router = useRouter();

  const items = [
    { label: 'Efectivo inicial', value: 500, icon: Wallet, color: colors.primary[600], bg: colors.primary[50], sign: '+' },
    { label: 'Ventas en efectivo', value: 4250, icon: TrendingUp, color: colors.success[600], bg: colors.success[50], sign: '+' },
    { label: 'Cobranza', value: 3200, icon: DollarSign, color: colors.success[600], bg: colors.success[50], sign: '+' },
    { label: 'Gastos', value: 515, icon: TrendingDown, color: colors.error[500], bg: colors.error[50], sign: '-' },
    { label: 'Retiros', value: 0, icon: ArrowUpRight, color: colors.warning[600], bg: colors.warning[50], sign: '-' },
  ];

  const efectivoEsperado = 500 + 4250 + 3200 - 515 - 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Caja" subtitle="Flujo de efectivo" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Efectivo esperado en caja</Text>
          <Text style={styles.totalValue}>{formatCurrency(efectivoEsperado)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Movimientos</Text>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} style={styles.itemCard}>
              <View style={[styles.itemIcon, { backgroundColor: item.bg }]}>
                <Icon size={20} color={item.color} />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={[styles.itemValue, { color: item.sign === '+' ? colors.success[600] : colors.error[500] }]}>
                {item.sign}{formatCurrency(item.value)}
              </Text>
            </Card>
          );
        })}

        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Efectivo esperado</Text>
            <Text style={styles.resultValue}>{formatCurrency(efectivoEsperado)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  totalCard: { backgroundColor: colors.primary[700], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  totalLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: fontSize.display, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.xs },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  itemIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: fontSize.base, color: colors.neutral[700] },
  itemValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  resultCard: { backgroundColor: colors.neutral[0], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg, ...shadows.card },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  resultValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary[600] },
});
