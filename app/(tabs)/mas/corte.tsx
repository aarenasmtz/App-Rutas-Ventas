import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
  Fuel,
  Receipt,
  Scale,
  DollarSign,
  ArrowDownRight,
  ShieldCheck,
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
  const [fondoInicial, setFondoInicial] = useState('500');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const loadCortes = async () => {
    try {
      const data = await DataService.getCortes();
      if (data && data.length > 0) {
        setCortesList(data);
        if (!selectedTrabajador) {
          setSelectedTrabajador(data[0]);
          const ini = 500;
          setEfectivoContado((data[0].efectivoEsperado + ini).toString());
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadCortes();
  }, []);

  const currentTrabajador = selectedTrabajador || cortesList[0] || null;

  const fondoInicialNum = parseFloat(fondoInicial) || 0;
  const efectivoVentas = currentTrabajador ? currentTrabajador.efectivo : 0;
  const abonosCobranza = currentTrabajador ? currentTrabajador.abonosCobranza : 0;
  const gastosRuta = currentTrabajador ? currentTrabajador.gastos : 0;
  const esperadoNum = fondoInicialNum + efectivoVentas + abonosCobranza - gastosRuta;

  useEffect(() => {
    if (!selectedTrabajador && cortesList.length > 0) {
      setSelectedTrabajador(cortesList[0]);
      setEfectivoContado(esperadoNum.toString());
    }
  }, [cortesList]);

  const handleSelectTrabajador = (t: CorteTrabajador) => {
    setSelectedTrabajador(t);
    const esp = fondoInicialNum + (t.efectivo || 0) + (t.abonosCobranza || 0) - (t.gastos || 0);
    setEfectivoContado(esp.toString());
  };

  const totalVentasDia = cortesList.reduce((acc, c) => acc + (c.ventasTotales || 0), 0);
  const totalEfectivoGlobal = cortesList.reduce((acc, c) => acc + (c.efectivoEsperado || 0), 0) + fondoInicialNum;
  const totalCobradoGlobal = cortesList.reduce((acc, c) => acc + (c.abonosCobranza || 0), 0);

  const contadoNum = parseFloat(efectivoContado) || 0;
  const diferenciaCalculada = contadoNum - esperadoNum;
  const isCuadrado = Math.abs(diferenciaCalculada) < 0.01;

  const handleCerrarCorte = async () => {
    if (!currentTrabajador) return;

    setCerrando(true);
    try {
      await DataService.cerrarCorteCaja({
        empleadoId: currentTrabajador.empleadoId,
        efectivoContado: contadoNum,
      });
      await loadCortes();
      Alert.alert(
        'Corte de Caja Cerrado',
        `El corte de ${currentTrabajador.nombre} ha sido verificado y persistido en la base de datos SQL Server exitosamente.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cerrar el corte de caja');
    } finally {
      setCerrando(false);
    }
  };

  const handleSetQuickCash = (monto: number) => {
    setEfectivoContado(monto.toString());
  };

  const handleAddQuickCash = (monto: number) => {
    const act = parseFloat(efectivoContado) || 0;
    setEfectivoContado((act + monto).toString());
  };

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppShell>
      <PageHeader
        title="Corte Diario de Caja"
        subtitle="Liquidación y Arqueo Financiero por Ruta"
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* HERO CARD FINANCIERO */}
        <View style={[styles.heroCard, shadows.card]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroPreTitle}>JORNADA DE HOY</Text>
              <Text style={styles.heroDate}>{fechaHoy}</Text>
            </View>
            <View style={styles.heroLiveBadge}>
              <View style={styles.heroLiveDot} />
              <Text style={styles.heroLiveText}>Ruta Activa</Text>
            </View>
          </View>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>Total Ventas (Flota)</Text>
              <Text style={styles.heroMetricAmount}>{formatCurrency(totalVentasDia)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>Efectivo a Entregar</Text>
              <Text style={[styles.heroMetricAmount, { color: '#86efac' }]}>{formatCurrency(totalEfectivoGlobal)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>Cobranza Recuperada</Text>
              <Text style={styles.heroMetricAmount}>{formatCurrency(totalCobradoGlobal)}</Text>
            </View>
          </View>
        </View>

        {/* SELECTOR DE TRABAJADOR / RUTA */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeading}>Trabajador en Turno:</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workerChipsRow}>
          {cortesList.map((trabajador) => {
            const isSelected = currentTrabajador?.empleadoId === trabajador.empleadoId;
            const hasDiff = trabajador.diferenciaCaja !== 0;

            return (
              <TouchableOpacity
                key={trabajador.empleadoId}
                activeOpacity={0.82}
                onPress={() => handleSelectTrabajador(trabajador)}
                style={[
                  styles.workerChip,
                  isSelected && styles.workerChipActive,
                  shadows.card,
                ]}
              >
                <View style={[styles.workerAvatarSmall, isSelected && { backgroundColor: '#FFFFFF' }]}>
                  <Text style={[styles.workerAvatarText, isSelected && { color: colors.primary[700] }]}>
                    {trabajador.nombre.charAt(0)}
                  </Text>
                </View>
                <View style={{ marginRight: spacing.xs }}>
                  <Text style={[styles.workerChipName, isSelected && styles.workerChipNameActive]}>
                    {trabajador.nombre}
                  </Text>
                  <Text style={[styles.workerChipRoute, isSelected && styles.workerChipRouteActive]}>
                    {trabajador.ruta}
                  </Text>
                </View>

                {hasDiff ? (
                  <View style={styles.chipDiffBadge}>
                    <Text style={styles.chipDiffBadgeText}>Dif</Text>
                  </View>
                ) : (
                  <View style={styles.chipOkBadge}>
                    <Text style={styles.chipOkBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {currentTrabajador && (
          <View style={styles.mainContent}>
            {/* ENCABEZADO DE LIQUIDACIÓN DEL TRABAJADOR */}
            <View style={[styles.liquidationCard, shadows.card]}>
              <View style={styles.liqTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liqWorkerName}>{currentTrabajador.nombre}</Text>
                  <Text style={styles.liqWorkerRoute}>{currentTrabajador.ruta} · Camioneta Asignada</Text>
                </View>
                <View style={isCuadrado ? styles.statusBadgeOk : styles.statusBadgeWarn}>
                  {isCuadrado ? (
                    <>
                      <CheckCircle2 size={14} color="#15803d" />
                      <Text style={styles.statusBadgeTextOk}>Caja Cuadrada</Text>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} color="#b45309" />
                      <Text style={styles.statusBadgeTextWarn}>
                        {diferenciaCalculada > 0 ? `Sobrante +${formatCurrency(diferenciaCalculada)}` : `Faltante ${formatCurrency(diferenciaCalculada)}`}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* FONDO INICIAL DE RUTA */}
              <View style={styles.fondoInicialCard}>
                <View style={styles.fondoInicialTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Banknote size={16} color={colors.primary[700]} />
                    <Text style={styles.fondoInicialTitle}>Efectivo Inicial de Ruta (Fondo para Cambio)</Text>
                  </View>
                  <View style={styles.fondoInicialInputWrap}>
                    <Text style={styles.fondoInicialCurrency}>$</Text>
                    <TextInput
                      value={fondoInicial}
                      onChangeText={setFondoInicial}
                      keyboardType="numeric"
                      style={styles.fondoInicialInput}
                      placeholder="500"
                    />
                  </View>
                </View>
                <Text style={styles.fondoInicialHelp}>
                  Dinero en efectivo entregado a {currentTrabajador.nombre} al iniciar su jornada para dar cambio a clientes.
                </Text>
                <View style={styles.fondoChipsRow}>
                  {[200, 300, 500, 1000].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setFondoInicial(m.toString())}
                      style={[styles.fondoChip, fondoInicial === m.toString() && styles.fondoChipActive]}
                    >
                      <Text style={[styles.fondoChipText, fondoInicial === m.toString() && styles.fondoChipTextActive]}>
                        ${m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* GRID DE MÉTODOS DE PAGO Y FLUJO */}
              <Text style={styles.subTitleText}>Desglose Financiero por Canal:</Text>
              <View style={styles.breakdownGrid}>
                {/* 1. Efectivo */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#ecfdf5' }]}>
                    <Banknote size={18} color="#10b981" />
                  </View>
                  <Text style={styles.channelLabel}>Efectivo en Ventas</Text>
                  <Text style={[styles.channelAmount, { color: '#047857' }]}>
                    {formatCurrency(currentTrabajador.efectivo)}
                  </Text>
                </View>

                {/* 2. SPEI / Transferencia */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#eff6ff' }]}>
                    <Smartphone size={18} color="#2563eb" />
                  </View>
                  <Text style={styles.channelLabel}>Transferencias (SPEI)</Text>
                  <Text style={[styles.channelAmount, { color: '#1d4ed8' }]}>
                    {formatCurrency(currentTrabajador.transferencias)}
                  </Text>
                </View>

                {/* 3. Tarjetas */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#faf5ff' }]}>
                    <CreditCard size={18} color="#9333ea" />
                  </View>
                  <Text style={styles.channelLabel}>Tarjetas / Terminal</Text>
                  <Text style={[styles.channelAmount, { color: '#7e22ce' }]}>
                    {formatCurrency(currentTrabajador.tarjetas)}
                  </Text>
                </View>

                {/* 4. Crédito */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#fffbeb' }]}>
                    <Receipt size={18} color="#f59e0b" />
                  </View>
                  <Text style={styles.channelLabel}>Ventas a Crédito</Text>
                  <Text style={[styles.channelAmount, { color: '#b45309' }]}>
                    {formatCurrency(currentTrabajador.credito)}
                  </Text>
                </View>

                {/* 5. Cobranza recibida */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#f0fdf4' }]}>
                    <Wallet size={18} color="#16a34a" />
                  </View>
                  <Text style={styles.channelLabel}>Cobranza (Abonos)</Text>
                  <Text style={[styles.channelAmount, { color: '#15803d' }]}>
                    +{formatCurrency(currentTrabajador.abonosCobranza)}
                  </Text>
                </View>

                {/* 6. Gastos */}
                <View style={styles.channelCard}>
                  <View style={[styles.channelIconCircle, { backgroundColor: '#fef2f2' }]}>
                    <Fuel size={18} color="#ef4444" />
                  </View>
                  <Text style={styles.channelLabel}>Gastos en Ruta</Text>
                  <Text style={[styles.channelAmount, { color: '#dc2626' }]}>
                    -{formatCurrency(currentTrabajador.gastos)}
                  </Text>
                </View>
              </View>

              {/* BARRA DE TOTALES Y ENTREGA DE EFECTIVO */}
              <View style={styles.totalExpectedBox}>
                <View style={styles.totalExpectedLeft}>
                  <Text style={styles.totalExpectedLabel}>EFECTIVO ESPERADO EN CAJA (TIEMPO REAL)</Text>
                  <Text style={styles.totalExpectedSub}>
                    Fondo (${fondoInicialNum}) + Ventas (${efectivoVentas}) + Cobranza (${abonosCobranza}) - Gastos (${gastosRuta})
                  </Text>
                </View>
                <Text style={styles.totalExpectedAmount}>
                  {formatCurrency(esperadoNum)}
                </Text>
              </View>

              {/* SECCIÓN DE ARQUEO FÍSICO CONTADO */}
              <View style={styles.arqueoSection}>
                <View style={styles.arqueoHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Scale size={16} color={colors.primary[700]} />
                    <Text style={styles.arqueoTitle}>Arqueo Físico en Mano</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSetQuickCash(esperadoNum)}
                    style={styles.cuadrarExactoBtn}
                  >
                    <Text style={styles.cuadrarExactoText}>Cuadrar exacto</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cashInputRow}>
                  <Text style={styles.cashCurrencySymbol}>$</Text>
                  <TextInput
                    style={styles.cashTextInput}
                    keyboardType="decimal-pad"
                    value={efectivoContado}
                    onChangeText={setEfectivoContado}
                    placeholder="0.00"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                {/* Chips rápidos de denominaciones */}
                <View style={styles.denominacionesRow}>
                  <TouchableOpacity style={styles.denomChip} onPress={() => handleAddQuickCash(100)}>
                    <Text style={styles.denomChipText}>+ $100</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.denomChip} onPress={() => handleAddQuickCash(200)}>
                    <Text style={styles.denomChipText}>+ $200</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.denomChip} onPress={() => handleAddQuickCash(500)}>
                    <Text style={styles.denomChipText}>+ $500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.denomChip} onPress={() => handleAddQuickCash(1000)}>
                    <Text style={styles.denomChipText}>+ $1,000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.denomChip, { backgroundColor: '#fee2e2' }]} onPress={() => setEfectivoContado('0')}>
                    <Text style={[styles.denomChipText, { color: '#dc2626' }]}>Limpiar</Text>
                  </TouchableOpacity>
                </View>

                {/* RESULTADO DEL CUADRE */}
                <View style={[styles.diffSummaryRow, isCuadrado ? styles.diffSummaryRowOk : styles.diffSummaryRowWarn]}>
                  <Text style={styles.diffSummaryLabel}>
                    {isCuadrado ? '✓ Caja perfectamente cuadrada:' : 'Diferencia de arqueo:'}
                  </Text>
                  <Text style={[styles.diffSummaryVal, { color: isCuadrado ? '#15803d' : '#b45309' }]}>
                    {formatCurrency(diferenciaCalculada)}
                  </Text>
                </View>
              </View>

              {/* BALANCE DE MERCANCÍA / PIEZAS */}
              <View style={styles.merchandiseCard}>
                <View style={styles.merchTop}>
                  <Package size={16} color={colors.primary[700]} />
                  <Text style={styles.merchTitle}>Balance de Mercancía en Camioneta</Text>
                </View>
                <View style={styles.merchGrid}>
                  <View style={styles.merchCol}>
                    <Text style={styles.merchLabel}>Inventario Inicial</Text>
                    <Text style={styles.merchVal}>{currentTrabajador.inventarioInicialPiezas} pzas</Text>
                  </View>
                  <View style={styles.merchCol}>
                    <Text style={styles.merchLabel}>Vendidas Hoy</Text>
                    <Text style={[styles.merchVal, { color: colors.primary[700] }]}>{currentTrabajador.piezasVendidas} pzas</Text>
                  </View>
                  <View style={styles.merchCol}>
                    <Text style={styles.merchLabel}>Remanente Físico</Text>
                    <Text style={[styles.merchVal, { fontWeight: '800' }]}>{currentTrabajador.inventarioActualPiezas} pzas</Text>
                  </View>
                </View>
              </View>

              {/* BOTONES DE ACCIÓN: CERRAR CORTE E IMPRIMIR TICKET */}
              <View style={styles.actionsBlock}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={cerrando}
                  onPress={handleCerrarCorte}
                  style={[styles.primaryActionBtn, cerrando && { opacity: 0.65 }]}
                >
                  {cerrando ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>✓ Guardar y Cerrar Jornada</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowTicketModal(true)}
                  style={styles.secondaryActionBtn}
                >
                  <Printer size={18} color={colors.primary[700]} />
                  <Text style={styles.secondaryActionBtnText}>Imprimir Ticket de Corte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE TICKET TÉRMICO DE CORTE */}
      {currentTrabajador && (
        <TicketModal
          visible={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title={`Ticket Corte - ${currentTrabajador.nombre}`}
          ticketText58={ticketPrinter.generateCorteText({
            fecha: new Date().toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            vendedorNombre: currentTrabajador.nombre,
            rutaNombre: currentTrabajador.ruta,
            ventasTotales: currentTrabajador.ventasTotales,
            efectivo: currentTrabajador.efectivo,
            transferencias: currentTrabajador.transferencias,
            tarjetas: currentTrabajador.tarjetas,
            credito: currentTrabajador.credito,
            abonosCobranza: currentTrabajador.abonosCobranza,
            gastos: currentTrabajador.gastos,
            efectivoEsperado: currentTrabajador.efectivoEsperado,
            efectivoContado: contadoNum,
            diferenciaCaja: diferenciaCalculada,
            piezasVendidas: currentTrabajador.piezasVendidas,
            inventarioActualPiezas: currentTrabajador.inventarioActualPiezas,
          }, 80)}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  heroDate: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  heroLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#22c55e',
  },
  heroLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroMetricAmount: {
    fontSize: fontSize.sm + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workerChipsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  workerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    gap: 8,
  },
  workerChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  workerAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary[700],
  },
  workerChipName: {
    fontSize: fontSize.xs + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  workerChipNameActive: {
    color: '#FFFFFF',
  },
  workerChipRoute: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  workerChipRouteActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chipDiffBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  chipDiffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b91c1c',
  },
  chipOkBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  chipOkBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  mainContent: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  liquidationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  liqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    marginBottom: spacing.md,
  },
  liqWorkerName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  liqWorkerRoute: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  statusBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeTextOk: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  statusBadgeWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeTextWarn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  subTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  channelCard: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  channelIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  channelLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  channelAmount: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    marginTop: 2,
  },
  totalExpectedBox: {
    backgroundColor: '#0f172a',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalExpectedLeft: {
    flex: 1,
  },
  totalExpectedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  totalExpectedSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  totalExpectedAmount: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: '#86efac',
  },
  arqueoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  arqueoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  arqueoTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: '800',
    color: colors.neutral[800],
  },
  cuadrarExactoBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  cuadrarExactoText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cashCurrencySymbol: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.neutral[600],
    marginRight: 6,
  },
  cashTextInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.neutral[900],
    paddingVertical: spacing.sm,
  },
  denominacionesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  denomChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  denomChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  diffSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  diffSummaryRowOk: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  diffSummaryRowWarn: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  diffSummaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  diffSummaryVal: {
    fontSize: fontSize.sm,
    fontWeight: '900',
  },
  merchandiseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  merchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  merchTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.neutral[800],
  },
  merchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  merchCol: {
    flex: 1,
    alignItems: 'center',
  },
  merchLabel: {
    fontSize: 9,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  merchVal: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  actionsBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionBtnText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  fondoInicialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fondoInicialTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  fondoInicialTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  fondoInicialInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary[400],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 100,
  },
  fondoInicialCurrency: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary[700],
    marginRight: 2,
  },
  fondoInicialInput: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.neutral[900],
    padding: 0,
    minWidth: 60,
  },
  fondoInicialHelp: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  fondoChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  fondoChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fondoChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  fondoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  fondoChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
