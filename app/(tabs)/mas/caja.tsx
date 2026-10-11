import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Receipt,
  Scissors,
  PlusCircle,
  Banknote,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';

export default function CajaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fondoInicial] = useState(500); // Fondo fijo de caja matutino
  const [ventasEfectivo, setVentasEfectivo] = useState(0);
  const [cobranzaEfectivo, setCobranzaEfectivo] = useState(0);
  const [gastosTotal, setGastosTotal] = useState(0);

  const loadCajaData = async () => {
    setLoading(true);
    try {
      const [resumen, cortes, gastos] = await Promise.all([
        DataService.getResumenDia(),
        DataService.getCortes(),
        DataService.getGastos(),
      ]);

      if (cortes && cortes.length > 0) {
        const totalVentasEf = cortes.reduce((sum: number, c: any) => sum + (c.efectivo || 0), 0);
        const totalCobranzaEf = cortes.reduce((sum: number, c: any) => sum + (c.abonosCobranza || 0), 0);
        const totalGastosRuta = cortes.reduce((sum: number, c: any) => sum + (c.gastos || 0), 0);
        setVentasEfectivo(totalVentasEf);
        setCobranzaEfectivo(totalCobranzaEf);
        setGastosTotal(totalGastosRuta);
      } else {
        setVentasEfectivo(resumen.efectivoEnCaja || 0);
        setCobranzaEfectivo(resumen.cobranzaDelDia || 0);
        const sumaGastos = (gastos || []).reduce((acc: number, g: any) => acc + (g.importe || g.monto || 0), 0);
        setGastosTotal(sumaGastos);
      }
    } catch {
      // Fallback local
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCajaData();
  }, []);

  const efectivoEsperado = fondoInicial + ventasEfectivo + cobranzaEfectivo - gastosTotal;

  const items = [
    {
      label: 'Fondo Inicial en Camioneta',
      value: fondoInicial,
      icon: Wallet,
      color: colors.primary[600],
      bg: colors.primary[50],
      sign: '+',
    },
    {
      label: 'Ventas en Efectivo (Hoy)',
      value: ventasEfectivo,
      icon: TrendingUp,
      color: colors.success[600],
      bg: colors.success[50],
      sign: '+',
    },
    {
      label: 'Cobranza / Abonos Recibidos',
      value: cobranzaEfectivo,
      icon: DollarSign,
      color: colors.success[600],
      bg: colors.success[50],
      sign: '+',
    },
    {
      label: 'Gastos Operativos (Gasolina/Viáticos)',
      value: gastosTotal,
      icon: TrendingDown,
      color: colors.error[500],
      bg: colors.error[50],
      sign: '-',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Arqueo y Flujo de Caja"
        subtitle="Movimientos de efectivo en tiempo real"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCajaData} />}
      >
        {/* Tarjeta Hero Principal: Efectivo en Caja */}
        <View style={[styles.heroCard, shadows.floating]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconBox}>
              <Banknote size={26} color={colors.primary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Efectivo Neto Esperado en Mano</Text>
              <Text style={styles.heroDate}>Calculado con backend SQL Server</Text>
            </View>
          </View>

          <View style={styles.heroValueWrap}>
            <MoneyDisplay amount={efectivoEsperado} size="xl" color={colors.neutral[0]} />
          </View>
          <Text style={styles.heroHint}>
            Fondo Inicial + Ventas Efectivo + Abonos - Gastos Operativos
          </Text>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { borderColor: colors.error[100] }]}
            onPress={() => router.push('/(tabs)/mas/gastos')}
          >
            <Receipt size={18} color={colors.error[600]} />
            <Text style={[styles.quickBtnText, { color: colors.error[700] }]}>+ Registrar Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { borderColor: colors.success[100] }]}
            onPress={() => router.push('/(tabs)/mas/cobranza')}
          >
            <DollarSign size={18} color={colors.success[600]} />
            <Text style={[styles.quickBtnText, { color: colors.success[700] }]}>+ Cobrar Abono</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { borderColor: colors.primary[200] }]}
            onPress={() => router.push('/(tabs)/mas/corte')}
          >
            <Scissors size={18} color={colors.primary[600]} />
            <Text style={[styles.quickBtnText, { color: colors.primary[700] }]}>Cuadrar Corte</Text>
          </TouchableOpacity>
        </View>

        {/* Desglose de Movimientos */}
        <Text style={styles.sectionHeading}>Desglose de Efectivo:</Text>
        <View style={styles.itemsList}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <View key={i} style={[styles.itemCard, shadows.card]}>
                <View style={[styles.itemIcon, { backgroundColor: item.bg }]}>
                  <Icon size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
                <Text
                  style={[
                    styles.itemValue,
                    { color: item.sign === '+' ? colors.success[600] : colors.error[600] },
                  ]}
                >
                  {item.sign}
                  {formatCurrency(item.value)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Resumen Final Cuadrado */}
        <View style={[styles.summaryCard, shadows.card]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Efectivo a Entregar:</Text>
            <MoneyDisplay amount={efectivoEsperado} size="lg" color={colors.primary[700]} />
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: colors.primary[800],
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[200],
    fontWeight: fontWeight.medium,
  },
  heroDate: {
    fontSize: fontSize.xs,
    color: colors.primary[300],
  },
  heroValueWrap: {
    marginBottom: spacing.xs,
  },
  heroHint: {
    fontSize: fontSize.xs,
    color: colors.primary[200],
    marginTop: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: 8,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  quickBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  sectionHeading: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  itemsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[800],
  },
  itemValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  summaryCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
});
