import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { cargaInicial, totalCargaInicial } from '@/constants/mockData';
import { Card, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

export default function CargaScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Carga del día" subtitle="Mercancía inicial" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}><Truck size={28} color={colors.neutral[0]} /></View>
          <View>
            <Text style={styles.headerLabel}>Costo total de carga</Text>
            <Text style={styles.headerValue}>{formatCurrency(totalCargaInicial)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Producto</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Costo</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>Importe</Text>
        </View>

        {cargaInicial.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCellName, { flex: 2 }]}>{item.producto}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.cantidad} {item.unidad}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.costo)}</Text>
            <Text style={[styles.tableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(item.importe)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalCargaInicial)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary[700], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  headerIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  headerValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.xs },
  tableHeader: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: colors.neutral[200] },
  tableHeaderText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.neutral[500] },
  tableRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, borderBottomWidth: 1, borderBottomColor: colors.neutral[100], backgroundColor: colors.neutral[0] },
  tableCellName: { fontSize: fontSize.sm, color: colors.neutral[700], flex: 2 },
  tableCell: { fontSize: fontSize.sm, color: colors.neutral[500] },
  tableCellBold: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primary[50], paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary[700] },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary[700] },
});
