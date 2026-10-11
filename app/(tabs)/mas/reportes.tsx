import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Wallet,
  CreditCard,
  Package,
  Receipt,
  DollarSign,
  Printer,
  ChevronRight,
  Award,
  Users,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { ticketPrinter } from '@/services/ticketPrinterService';
import TicketModal from '@/components/TicketModal';
import { formatCurrency } from '@/utils/helpers';

export default function ReportesScreen() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState<any>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  const loadReporte = async (p = periodo) => {
    setLoading(true);
    try {
      const data = await DataService.getReporteResumen(p);
      setReporte(data);
    } catch {
      // Fallback local
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReporte(periodo);
  }, [periodo]);

  const handleExportCsv = () => {
    const url = DataService.getExportCsvUrl(periodo);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Alert.alert(
        'Exportación Iniciada',
        `El archivo CSV de ventas para el periodo "${periodo}" se está descargando de la API.`
      );
    }
  };

  const handleOpenPrintTicket = () => {
    if (!reporte) return;
    setTicketModalVisible(true);
  };

  const ticket58 = reporte
    ? ticketPrinter.generateReporteText(
        {
          periodo: reporte.periodo,
          fechaInicio: reporte.fechaInicio,
          fechaFin: reporte.fechaFin,
          ventasTotales: reporte.ventasTotales,
          cobranzaTotal: reporte.cobranzaTotal,
          creditoColocado: reporte.creditoColocado,
          gastosTotal: reporte.gastosTotal,
          utilidadEstimada: reporte.utilidadEstimada,
          ticketPromedio: reporte.ticketPromedio,
          pedidosTotal: reporte.pedidosTotal,
          clientesVisitados: reporte.clientesVisitados,
          topProductos: (reporte.topProductos || []).map((tp: any) => ({
            nombre: tp.nombre,
            cantidad: tp.cantidadVendida,
            total: tp.importeTotal,
          })),
          metodosPago: reporte.metodosPago || { efectivo: 0, transferencia: 0, tarjeta: 0, credito: 0 },
        },
        58
      )
    : '';

  const ticket80 = reporte
    ? ticketPrinter.generateReporteText(
        {
          periodo: reporte.periodo,
          fechaInicio: reporte.fechaInicio,
          fechaFin: reporte.fechaFin,
          ventasTotales: reporte.ventasTotales,
          cobranzaTotal: reporte.cobranzaTotal,
          creditoColocado: reporte.creditoColocado,
          gastosTotal: reporte.gastosTotal,
          utilidadEstimada: reporte.utilidadEstimada,
          ticketPromedio: reporte.ticketPromedio,
          pedidosTotal: reporte.pedidosTotal,
          clientesVisitados: reporte.clientesVisitados,
          topProductos: (reporte.topProductos || []).map((tp: any) => ({
            nombre: tp.nombre,
            cantidad: tp.cantidadVendida,
            total: tp.importeTotal,
          })),
          metodosPago: reporte.metodosPago || { efectivo: 0, transferencia: 0, tarjeta: 0, credito: 0 },
        },
        80
      )
    : '';

  const ventas = reporte?.ventasTotales || 0;
  const cobranza = reporte?.cobranzaTotal || 0;
  const gastos = reporte?.gastosTotal || 0;
  const utilidad = reporte?.utilidadEstimada || 0;
  const ticketProm = reporte?.ticketPromedio || 0;
  const efectividad = reporte?.efectividadVisitas || 0;

  return (
    <AppShell>
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Métricas ejecutivas de ruta en vivo"
        onBack={() => router.back()}
      />

      {/* Selector de Periodo */}
      <View style={styles.periodoContainer}>
        {(['Día', 'Semana', 'Mes'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            activeOpacity={0.8}
            style={[styles.periodoChip, periodo === p && styles.periodoChipActive]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
              {p === 'Día' ? 'Hoy' : p === 'Semana' ? 'Esta semana' : 'Este mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadReporte(periodo)} />}
      >
        {/* Tarjetas Principales de Resumen Financiero */}
        <View style={styles.kpiGrid}>
          {/* Ventas Totales */}
          <View style={[styles.kpiCard, styles.kpiCardPrimary, shadows.card]}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primary[50] }]}>
                <TrendingUp size={20} color={colors.primary[600]} />
              </View>
              <Text style={styles.kpiBadge}>Ventas</Text>
            </View>
            <Text style={styles.kpiLabel}>Total Facturado</Text>
            <MoneyDisplay amount={ventas} size="lg" color={colors.primary[900]} />
            <Text style={styles.kpiSub}>Ticket prom: {formatCurrency(ticketProm)}</Text>
          </View>

          {/* Cobranza Realizada */}
          <View style={[styles.kpiCard, shadows.card]}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.success[50] }]}>
                <Wallet size={20} color={colors.success[600]} />
              </View>
              <Text style={[styles.kpiBadge, { backgroundColor: colors.success[50], color: colors.success[700] }]}>
                Cobranza
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Recuperado</Text>
            <MoneyDisplay amount={cobranza} size="lg" color={colors.success[700]} />
            <Text style={styles.kpiSub}>Abonos liquidados</Text>
          </View>

          {/* Utilidad Bruta */}
          <View style={[styles.kpiCard, shadows.card]}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.accent[50] }]}>
                <DollarSign size={20} color={colors.accent[700]} />
              </View>
              <Text style={[styles.kpiBadge, { backgroundColor: colors.accent[50], color: colors.accent[800] }]}>
                Margen
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Utilidad Bruta Estimada</Text>
            <MoneyDisplay amount={utilidad} size="lg" color={colors.accent[900]} />
            <Text style={styles.kpiSub}>~35% margen comercial</Text>
          </View>

          {/* Gastos en Ruta */}
          <View style={[styles.kpiCard, shadows.card]}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.error[50] }]}>
                <Receipt size={20} color={colors.error[600]} />
              </View>
              <Text style={[styles.kpiBadge, { backgroundColor: colors.error[50], color: colors.error[700] }]}>
                Gastos
              </Text>
            </View>
            <Text style={styles.kpiLabel}>Viáticos y Gasolina</Text>
            <MoneyDisplay amount={gastos} size="lg" color={colors.error[600]} />
            <Text style={styles.kpiSub}>Deducibles en corte</Text>
          </View>
        </View>

        {/* Efectividad de Visita */}
        <View style={[styles.sectionCard, shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Users size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Efectividad de Visitas</Text>
            </View>
            <Text style={styles.sectionPct}>{efectividad}%</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, efectividad)}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              Visitados: <Text style={{ fontWeight: 'bold' }}>{reporte?.clientesVisitados || 0}</Text>
            </Text>
            <Text style={styles.statsText}>
              Clientes en ruta: <Text style={{ fontWeight: 'bold' }}>{reporte?.clientesTotalRuta || 0}</Text>
            </Text>
          </View>
        </View>

        {/* Top 5 Productos más Vendidos */}
        <View style={[styles.sectionCard, shadows.card]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Award size={18} color={colors.accent[700]} />
              <Text style={styles.sectionTitle}>Productos Estrella</Text>
            </View>
            <Text style={styles.sectionHint}>Top en volumen</Text>
          </View>

          <View style={styles.topProductsList}>
            {(reporte?.topProductos || []).map((p: any, idx: number) => (
              <View key={p.productoId || idx} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.productRankText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.nombre}</Text>
                  <Text style={styles.productSub}>{p.cantidadVendida} piezas vendidas</Text>
                </View>
                <MoneyDisplay amount={p.importeTotal} size="sm" color={colors.primary[700]} />
              </View>
            ))}
          </View>
        </View>

        {/* Desglose de Métodos de Pago */}
        <View style={[styles.sectionCard, shadows.card]}>
          <Text style={styles.sectionTitle}>Desglose por Método de Pago</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Efectivo</Text>
              <Text style={[styles.paymentValue, { color: colors.success[600] }]}>
                {formatCurrency(reporte?.metodosPago?.efectivo || 0)}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>SPEI / Transfer</Text>
              <Text style={[styles.paymentValue, { color: colors.primary[600] }]}>
                {formatCurrency(reporte?.metodosPago?.transferencia || 0)}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Tarjetas</Text>
              <Text style={[styles.paymentValue, { color: colors.neutral[700] }]}>
                {formatCurrency(reporte?.metodosPago?.tarjeta || 0)}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Crédito Otorgado</Text>
              <Text style={[styles.paymentValue, { color: colors.warning[700] }]}>
                {formatCurrency(reporte?.metodosPago?.credito || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones de Exportación e Impresión Térmica */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleExportCsv} style={styles.exportExcelBtn}>
            <FileSpreadsheet size={18} color={colors.neutral[0]} />
            <Text style={styles.exportExcelText}>Exportar a Excel (CSV)</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={handleOpenPrintTicket} style={styles.printTicketBtn}>
            <Printer size={18} color={colors.primary[700]} />
            <Text style={styles.printTicketText}>Imprimir Reporte (Ticket / PDF)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Impresión de Ticket Térmico */}
      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        title={`Reporte ${periodo}`}
        ticketText58={ticket58}
        ticketText80={ticket80}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  periodoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    padding: 3,
  },
  periodoChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  periodoChipActive: {
    backgroundColor: colors.primary[700],
    ...shadows.card,
  },
  periodoText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  periodoTextActive: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  kpiCardPrimary: {
    borderColor: colors.primary[200],
    backgroundColor: '#F8FAFF',
  },
  kpiIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadge: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  sectionPct: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  sectionHint: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  progressBarBg: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statsText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  topProductsList: {
    gap: spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  productRank: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRankText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
  },
  productName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
  },
  productSub: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  paymentItem: {
    width: '48%',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  paymentLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  actionsWrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  exportExcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#047857', // Forest green Excel style
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  exportExcelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  printTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    paddingVertical: spacing.md,
  },
  printTicketText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
});
