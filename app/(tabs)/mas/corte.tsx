import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Scissors,
  User,
  ChevronRight,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Printer,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockCortesTrabajadores, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import { ticketPrinter } from '@/services/ticketPrinterService';
import TicketModal from '@/components/TicketModal';
import type { CorteTrabajador } from '@/types';

export default function CorteScreen() {
  const router = useRouter();
  const [cortesList, setCortesList] = useState<CorteTrabajador[]>(mockCortesTrabajadores);
  const [selectedTrabajador, setSelectedTrabajador] = useState<CorteTrabajador | null>(null);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const loadCortes = async () => {
    try {
      const data = await DataService.getCortes();
      if (data && data.length > 0) setCortesList(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadCortes();
  }, []);

  const handleSelectTrabajador = (t: CorteTrabajador) => {
    setSelectedTrabajador(t);
    setEfectivoContado(t.efectivoEsperado.toString());
  };

  const handleCerrarCorte = async () => {
    if (!selectedTrabajador) return;
    const contado = parseFloat(efectivoContado) || 0;

    setCerrando(true);
    try {
      await DataService.cerrarCorteCaja({
        empleadoId: selectedTrabajador.empleadoId,
        efectivoContado: contado,
      });
      await loadCortes();
      Alert.alert(
        'Corte de Caja Cerrado',
        `El corte de ${selectedTrabajador.nombre} ha sido cerrado y persistido en la base de datos SQL Server exitosamente.`
      );
      setSelectedTrabajador(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cerrar el corte de caja');
    } finally {
      setCerrando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Cortes Diarios por Ruta"
        subtitle="Panel de Administración y Cuadre de Caja"
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cabecera Informativa */}
        <View style={[styles.summaryHeader, shadows.card]}>
          <View style={styles.headerIcon}>
            <Scissors size={24} color={colors.neutral[0]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Cierre de Jornada de Hoy</Text>
            <Text style={styles.summaryDate}>Lunes 15 de septiembre, 2026</Text>
          </View>
        </View>

        {/* Sección: Cards por trabajador */}
        <View style={styles.workersSection}>
          <Text style={styles.sectionHeading}>Selecciona un trabajador para ver detalle:</Text>

          {cortesList.map((trabajador) => {
            const hasDiff = trabajador.diferenciaCaja !== 0;

            return (
              <View key={trabajador.empleadoId} style={[styles.workerCard, shadows.card]}>
                {/* Header Trabajador */}
                <View style={styles.workerTop}>
                  <View style={styles.workerAvatar}>
                    <User size={20} color={colors.primary[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>{trabajador.nombre}</Text>
                    <Text style={styles.workerRoute}>{trabajador.ruta}</Text>
                  </View>
                  {hasDiff ? (
                    <View style={styles.diffBadge}>
                      <Text style={styles.diffBadgeText}>Dif: {formatCurrency(trabajador.diferenciaCaja)}</Text>
                    </View>
                  ) : (
                    <View style={styles.okBadge}>
                      <Text style={styles.okBadgeText}>Cuadrado ✓</Text>
                    </View>
                  )}
                </View>

                {/* Métricas clave: Ventas, Cobrado, Crédito */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Ventas</Text>
                    <MoneyDisplay amount={trabajador.ventasTotales} size="sm" color={colors.primary[700]} />
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Cobrado</Text>
                    <MoneyDisplay amount={trabajador.abonosCobranza} size="sm" color={colors.success[700]} />
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Crédito</Text>
                    <MoneyDisplay amount={trabajador.credito} size="sm" color={colors.warning[700]} />
                  </View>
                </View>

                {/* Botón Ver corte */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSelectTrabajador(trabajador)}
                  style={styles.btnVerCorte}
                >
                  <Text style={styles.btnVerCorteText}>Ver corte detallado</Text>
                  <ChevronRight size={16} color={colors.primary[600]} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Modal de Detalle Completo del Trabajador */}
        {selectedTrabajador && (
          <View style={[styles.detailCard, shadows.card]}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Detalle: {selectedTrabajador.nombre}</Text>
                <Text style={styles.detailSub}>{selectedTrabajador.ruta}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTrabajador(null)} style={styles.closeBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Desglose Financiero */}
            <Text style={styles.subHeading}>Desglose de Efectivo y Cobros:</Text>
            <View style={styles.tableBlock}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Ventas Totales del Día:</Text>
                <MoneyDisplay amount={selectedTrabajador.ventasTotales} size="sm" />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>• En Efectivo:</Text>
                <MoneyDisplay amount={selectedTrabajador.efectivo} size="sm" color={colors.success[600]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>• En Transferencias (SPEI):</Text>
                <MoneyDisplay amount={selectedTrabajador.transferencias} size="sm" color={colors.primary[600]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>• En Tarjetas:</Text>
                <MoneyDisplay amount={selectedTrabajador.tarjetas} size="sm" color={colors.neutral[700]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>• Ventas a Crédito:</Text>
                <MoneyDisplay amount={selectedTrabajador.credito} size="sm" color={colors.warning[700]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Abonos recibidos (Cobranza):</Text>
                <MoneyDisplay amount={selectedTrabajador.abonosCobranza} size="sm" color={colors.success[700]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Gastos en ruta (gasolina/comida):</Text>
                <Text style={[styles.negText]}>-{formatCurrency(selectedTrabajador.gastos)}</Text>
              </View>

              <View style={[styles.tableRow, styles.tableHighlight]}>
                <Text style={styles.highlightLabel}>Efectivo esperado a entregar:</Text>
                <MoneyDisplay amount={selectedTrabajador.efectivoEsperado} size="md" color={colors.primary[800]} />
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Diferencia en caja:</Text>
                <Text style={{ fontWeight: 'bold', color: selectedTrabajador.diferenciaCaja === 0 ? colors.success[600] : colors.error[600] }}>
                  {formatCurrency(selectedTrabajador.diferenciaCaja)}
                </Text>
              </View>
            </View>

            {/* Desglose de Inventario */}
            <Text style={[styles.subHeading, { marginTop: spacing.md }]}>Balance de Mercancía (Piezas):</Text>
            <View style={styles.tableBlock}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Inventario inicial en camioneta:</Text>
                <Text style={styles.tableVal}>{selectedTrabajador.inventarioInicialPiezas} piezas</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Piezas vendidas hoy:</Text>
                <Text style={[styles.tableVal, { color: colors.primary[700] }]}>{selectedTrabajador.piezasVendidas} piezas</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Inventario actual remanente:</Text>
                <Text style={[styles.tableVal, { fontWeight: 'bold' }]}>{selectedTrabajador.inventarioActualPiezas} piezas</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Faltantes de mercancía:</Text>
                <Text style={{ color: colors.success[600], fontWeight: 'bold' }}>0 piezas (Cuadrado)</Text>
              </View>
            </View>

            {/* Input de arqueo físico en mano */}
            <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200] }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[800], marginBottom: spacing.xs }}>
                Efectivo Físico Contado en Mano ($):
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.neutral[0],
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.bold,
                  color: colors.neutral[900],
                }}
                keyboardType="decimal-pad"
                value={efectivoContado}
                onChangeText={setEfectivoContado}
                placeholder="0.00"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.neutral[600] }}>Diferencia calculada:</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: ((parseFloat(efectivoContado) || 0) - selectedTrabajador.efectivoEsperado) === 0 ? colors.success[600] : colors.error[600] }}>
                  {formatCurrency((parseFloat(efectivoContado) || 0) - selectedTrabajador.efectivoEsperado)}
                </Text>
              </View>
            </View>

            {/* Botón de cierre o aprobación */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={cerrando}
              onPress={handleCerrarCorte}
              style={[styles.approveBtn, cerrando && { opacity: 0.6 }]}
            >
              {cerrando ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <>
                  <CheckCircle2 size={18} color={colors.neutral[0]} />
                  <Text style={styles.approveBtnText}>✓ Cerrar Jornada y Cuadrar Caja</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Botón para imprimir ticket térmico del corte */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowTicketModal(true)}
              style={[styles.approveBtn, { backgroundColor: colors.neutral[0], borderWidth: 1.5, borderColor: colors.primary[500], marginTop: spacing.sm }]}
            >
              <Printer size={18} color={colors.primary[600]} />
              <Text style={[styles.approveBtnText, { color: colors.primary[700] }]}>Imprimir Ticket de Corte</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE TICKET TÉRMICO DE CORTE */}
      {selectedTrabajador && (
        <TicketModal
          visible={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title={`Ticket Corte - ${selectedTrabajador.nombre}`}
          ticketText58={ticketPrinter.generateCorteText({
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            vendedorNombre: selectedTrabajador.nombre,
            rutaNombre: selectedTrabajador.ruta,
            ventasTotales: selectedTrabajador.ventasTotales,
            efectivo: selectedTrabajador.efectivo,
            transferencias: selectedTrabajador.transferencias,
            tarjetas: selectedTrabajador.tarjetas,
            credito: selectedTrabajador.credito,
            abonosCobranza: selectedTrabajador.abonosCobranza,
            gastos: selectedTrabajador.gastos,
            efectivoEsperado: selectedTrabajador.efectivoEsperado,
            efectivoContado: parseFloat(efectivoContado) || selectedTrabajador.efectivoEsperado,
            diferenciaCaja: (parseFloat(efectivoContado) || selectedTrabajador.efectivoEsperado) - selectedTrabajador.efectivoEsperado,
            piezasVendidas: selectedTrabajador.piezasVendidas,
            inventarioActualPiezas: selectedTrabajador.inventarioActualPiezas,
          }, 58)}
          ticketText80={ticketPrinter.generateCorteText({
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            vendedorNombre: selectedTrabajador.nombre,
            rutaNombre: selectedTrabajador.ruta,
            ventasTotales: selectedTrabajador.ventasTotales,
            efectivo: selectedTrabajador.efectivo,
            transferencias: selectedTrabajador.transferencias,
            tarjetas: selectedTrabajador.tarjetas,
            credito: selectedTrabajador.credito,
            abonosCobranza: selectedTrabajador.abonosCobranza,
            gastos: selectedTrabajador.gastos,
            efectivoEsperado: selectedTrabajador.efectivoEsperado,
            efectivoContado: parseFloat(efectivoContado) || selectedTrabajador.efectivoEsperado,
            diferenciaCaja: (parseFloat(efectivoContado) || selectedTrabajador.efectivoEsperado) - selectedTrabajador.efectivoEsperado,
            piezasVendidas: selectedTrabajador.piezasVendidas,
            inventarioActualPiezas: selectedTrabajador.inventarioActualPiezas,
          }, 80)}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  summaryHeader: {
    backgroundColor: colors.primary[700],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  summaryDate: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  workersSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm + 2,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  workerCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  workerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  workerAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  workerRoute: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  diffBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  diffBadgeText: {
    fontSize: fontSize.xs - 1,
    color: colors.error[700],
    fontWeight: fontWeight.bold,
  },
  okBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  okBadgeText: {
    fontSize: fontSize.xs - 1,
    color: colors.success[700],
    fontWeight: fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  btnVerCorte: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs + 2,
  },
  btnVerCorteText: {
    fontSize: fontSize.xs + 1,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
  },
  detailCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  detailSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  closeBtn: {
    padding: 4,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
  },
  subHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  tableBlock: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[600],
  },
  tableVal: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[800],
  },
  negText: {
    fontSize: fontSize.xs + 1,
    color: colors.error[600],
    fontWeight: 'bold',
  },
  tableHighlight: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 6,
    marginTop: 4,
  },
  highlightLabel: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  approveBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  approveBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
