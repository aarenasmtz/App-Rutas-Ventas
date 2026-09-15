import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, FileSpreadsheet, TrendingUp, Wallet, CreditCard, Package, RotateCcw, Receipt, Scissors, DollarSign, Box, Users, Map } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { Card, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

const reportes = [
  { titulo: 'Ventas', icon: TrendingUp, color: colors.primary[600], bg: colors.primary[50], valor: '$84,250', periodo: 'Esta semana' },
  { titulo: 'Cobranza', icon: Wallet, color: colors.success[600], bg: colors.success[50], valor: '$32,000', periodo: 'Esta semana' },
  { titulo: 'Créditos', icon: CreditCard, color: colors.warning[600], bg: colors.warning[50], valor: '$14,300', periodo: 'Saldo total' },
  { titulo: 'Inventario', icon: Package, color: colors.primary[600], bg: colors.primary[50], valor: '18 prod.', periodo: 'En camioneta' },
  { titulo: 'Devoluciones', icon: RotateCcw, color: colors.error[500], bg: colors.error[50], valor: '$690', periodo: 'Esta semana' },
  { titulo: 'Gastos', icon: Receipt, color: colors.warning[600], bg: colors.warning[50], valor: '$1,545', periodo: 'Esta semana' },
  { titulo: 'Cortes', icon: Scissors, color: colors.primary[600], bg: colors.primary[50], valor: '5 cortes', periodo: 'Esta semana' },
  { titulo: 'Utilidad', icon: DollarSign, color: colors.success[600], bg: colors.success[50], valor: '$28,400', periodo: 'Esta semana' },
  { titulo: 'Productos', icon: Box, color: colors.neutral[700], bg: colors.neutral[100], valor: '18 prod.', periodo: 'Catálogo' },
  { titulo: 'Clientes', icon: Users, color: colors.neutral[700], bg: colors.neutral[100], valor: '10 clients', periodo: 'Activos' },
  { titulo: 'Rutas', icon: Map, color: colors.primary[600], bg: colors.primary[50], valor: '3 rutas', periodo: 'Activas' },
];

export default function ReportesScreen() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('Semana');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reportes" subtitle="Dashboard administrativo" onBack={() => router.back()} />

      <View style={styles.periodoRow}>
        {['Día', 'Semana', 'Mes'].map((p) => (
          <TouchableOpacity key={p} style={[styles.periodoChip, periodo === p && styles.periodoChipActive]} onPress={() => setPeriodo(p)}>
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateBox}><Text style={styles.dateLabel}>Desde</Text><Text style={styles.dateValue}>09/09/2026</Text></View>
        <View style={styles.dateBox}><Text style={styles.dateLabel}>Hasta</Text><Text style={styles.dateValue}>15/09/2026</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {reportes.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.titulo} style={styles.reportCard}>
              <View style={[styles.reportIcon, { backgroundColor: r.bg }]}>
                <Icon size={22} color={r.color} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{r.titulo}</Text>
                <Text style={styles.reportPeriodo}>{r.periodo}</Text>
              </View>
              <Text style={styles.reportValor}>{r.valor}</Text>
            </Card>
          );
        })}

        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn}>
            <FileText size={20} color={colors.error[500]} />
            <Text style={styles.exportText}>Exportar PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn}>
            <FileSpreadsheet size={20} color={colors.success[600]} />
            <Text style={styles.exportText}>Exportar Excel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  periodoRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  periodoChip: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.neutral[100], alignItems: 'center' },
  periodoChipActive: { backgroundColor: colors.primary[600] },
  periodoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  periodoTextActive: { color: colors.neutral[0] },
  dateRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  dateBox: { flex: 1, backgroundColor: colors.neutral[0], borderRadius: radius.md, padding: spacing.md, ...shadows.card },
  dateLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  dateValue: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900], marginTop: 2 },
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  reportIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  reportPeriodo: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  reportValor: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  exportRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, marginTop: spacing.md },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.neutral[0], borderRadius: radius.md, paddingVertical: spacing.md, ...shadows.card },
  exportText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[700] },
});
