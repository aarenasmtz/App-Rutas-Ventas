import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Banknote,
  Smartphone,
  CreditCard,
  CreditCard as CardIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { mockClientes, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import type { MetodoPago, Pago } from '@/types';

export default function PagoScreen() {
  const router = useRouter();
  const { ventaTotal, setPagos, clienteActivoId, user, carrito, setUltimoFolioVenta } = useApp();

  const cliente = mockClientes.find((c) => c.id === clienteActivoId) || mockClientes[0];
  const creditoActual = cliente?.saldo || 0;
  const limiteCredito = cliente?.limiteCredito || 5000;
  const creditoDisponible = Math.max(0, limiteCredito - creditoActual);

  // Estados de montos
  const [efectivo, setEfectivo] = useState(ventaTotal.toString());
  const [transferencia, setTransferencia] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [credito, setCredito] = useState('');

  // Prevención de doble envío
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ef = parseFloat(efectivo) || 0;
  const tr = parseFloat(transferencia) || 0;
  const tj = parseFloat(tarjeta) || 0;
  const cr = parseFloat(credito) || 0;

  const totalPagado = ef + tr + tj + cr;
  const diferencia = ventaTotal - totalPagado;
  const completo = Math.abs(diferencia) < 0.01;
  const nuevoSaldo = creditoActual + cr;
  const excedeCredito = nuevoSaldo > limiteCredito;

  // Acciones rápidas de un toque
  const setExacto = (metodo: MetodoPago) => {
    setEfectivo(metodo === 'Efectivo' ? ventaTotal.toString() : '');
    setTransferencia(metodo === 'Transferencia' ? ventaTotal.toString() : '');
    setTarjeta(metodo === 'Tarjeta' ? ventaTotal.toString() : '');
    setCredito(metodo === 'Crédito' ? ventaTotal.toString() : '');
  };

  // Simular pago combinado según especificación del requerimiento
  const handleSimularCombinado = () => {
    if (ventaTotal <= 0) return;
    // Repartir proporcionalmente o con el ejemplo mock
    const pEfectivo = Math.round(ventaTotal * 0.35);
    const pTransfer = Math.round(ventaTotal * 0.15);
    const pCredito = ventaTotal - pEfectivo - pTransfer;

    setEfectivo(pEfectivo.toString());
    setTransferencia(pTransfer.toString());
    setTarjeta('');
    setCredito(pCredito.toString());
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (!completo) {
      Alert.alert('Pago incompleto', `Aún faltan ${formatCurrency(diferencia)} por cubrir.`);
      return;
    }

    if (excedeCredito) {
      Alert.alert(
        'Límite de crédito excedido',
        `El nuevo saldo (${formatCurrency(nuevoSaldo)}) excede el límite autorizado del cliente (${formatCurrency(limiteCredito)}).`
      );
      return;
    }

    setIsSubmitting(true);

    const pagosValidos: Pago[] = [];
    if (ef > 0) pagosValidos.push({ metodo: 'Efectivo', monto: ef });
    if (tr > 0) pagosValidos.push({ metodo: 'Transferencia', monto: tr });
    if (tj > 0) pagosValidos.push({ metodo: 'Tarjeta', monto: tj });
    if (cr > 0) pagosValidos.push({ metodo: 'Crédito', monto: cr });

    setPagos(pagosValidos);

    try {
      const res = await DataService.registrarVenta({
        clienteId: cliente.id,
        empleadoId: user?.id || '1',
        total: ventaTotal,
        items: carrito.map((i) => ({
          productoId: i.producto.id,
          presentacionTipo: i.presentacion?.tipo || 'pieza',
          cantidadPresentaciones: i.cantidad,
          piezasTotalesCalculadas: i.piezasTotales || i.cantidad,
          precioUnitario: i.precioFinal,
          subtotal: i.subtotal,
        })),
        pagos: pagosValidos.map((p) => ({ metodo: p.metodo, monto: p.monto })),
      });

      if (res && res.folio) {
        setUltimoFolioVenta(res.folio);
      }
    } catch (err: any) {
      console.warn('Error al registrar venta live:', err);
    } finally {
      setIsSubmitting(false);
      router.push('/(tabs)/venta/confirmacion');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Cobro de Venta"
        subtitle={`Total a liquidar: ${formatCurrency(ventaTotal)}`}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Tarjeta de Total a Cobrar */}
        <View style={[styles.heroCard, shadows.card]}>
          <Text style={styles.heroSub}>TOTAL DE LA NOTA</Text>
          <Text style={styles.heroAmount}>{formatCurrency(ventaTotal)}</Text>
          <View style={styles.clientInline}>
            <User size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.clientInlineText}>
              {cliente.nombre} · Saldo actual: {formatCurrency(cliente.saldo)}
            </Text>
          </View>
        </View>

        {/* Acceso Rápido de Métodos (Un Toque) */}
        <View style={styles.quickMethodsSection}>
          <Text style={styles.sectionHeading}>Asignación rápida de monto:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setExacto('Efectivo')} style={styles.quickChip}>
              <Banknote size={15} color={colors.success[700]} />
              <Text style={styles.quickChipText}>100% Efectivo</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setExacto('Transferencia')} style={styles.quickChip}>
              <Smartphone size={15} color={colors.primary[700]} />
              <Text style={styles.quickChipText}>100% Transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setExacto('Tarjeta')} style={styles.quickChip}>
              <CreditCard size={15} color={colors.neutral[800]} />
              <Text style={styles.quickChipText}>100% Tarjeta</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setExacto('Crédito')} style={styles.quickChip}>
              <CardIcon size={15} color={colors.warning[700]} />
              <Text style={styles.quickChipText}>100% Crédito</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleSimularCombinado} style={[styles.quickChip, styles.quickChipCombinado]}>
              <Sparkles size={15} color={colors.primary[700]} />
              <Text style={[styles.quickChipText, { color: colors.primary[700], fontWeight: 'bold' }]}>
                Simular Combinado
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Desglose de Métodos de Pago */}
        <View style={styles.inputsSection}>
          <Text style={styles.sectionHeading}>Captura de métodos de pago:</Text>

          {/* 1. Efectivo */}
          <View style={[styles.paymentInputCard, shadows.card]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.success[50] }]}>
              <Banknote size={22} color={colors.success[600]} />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Efectivo en mano</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={efectivo}
                  onChangeText={setEfectivo}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.neutral[300]}
                />
              </View>
            </View>
          </View>

          {/* 2. Transferencia */}
          <View style={[styles.paymentInputCard, shadows.card]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary[50] }]}>
              <Smartphone size={22} color={colors.primary[600]} />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Transferencia bancaria / SPEI</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={transferencia}
                  onChangeText={setTransferencia}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.neutral[300]}
                />
              </View>
            </View>
          </View>

          {/* 3. Tarjeta */}
          <View style={[styles.paymentInputCard, shadows.card]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.neutral[100] }]}>
              <CreditCard size={22} color={colors.neutral[700]} />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.inputLabel}>Tarjeta de Débito / Crédito</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={tarjeta}
                  onChangeText={setTarjeta}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.neutral[300]}
                />
              </View>
            </View>
          </View>

          {/* 4. Crédito */}
          <View style={[styles.paymentInputCard, shadows.card]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warning[50] }]}>
              <CardIcon size={22} color={colors.warning[600]} />
            </View>
            <View style={styles.inputBody}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>A Crédito (Fiado en cuenta)</Text>
                <Text style={styles.disponibleText}>Disp: {formatCurrency(creditoDisponible)}</Text>
              </View>
              <View style={styles.currencyRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={credito}
                  onChangeText={setCredito}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.neutral[300]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Resumen de Validación en tiempo real */}
        <View style={[styles.statusCard, shadows.card]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total cubierto:</Text>
            <MoneyDisplay amount={totalPagado} size="md" color={colors.neutral[900]} />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Diferencia por cubrir:</Text>
            <Text
              style={[
                styles.diffValue,
                { color: completo ? colors.success[600] : colors.error[600] },
              ]}
            >
              {completo ? '✓ Cubierto al 100%' : formatCurrency(diferencia)}
            </Text>
          </View>

          {cr > 0 && (
            <View style={styles.creditoImpactBox}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Nuevo saldo del cliente:</Text>
                <MoneyDisplay
                  amount={nuevoSaldo}
                  size="sm"
                  color={excedeCredito ? colors.error[600] : colors.warning[700]}
                />
              </View>
              {excedeCredito && (
                <View style={styles.alertRow}>
                  <AlertCircle size={14} color={colors.error[600]} />
                  <Text style={styles.alertText}>
                    Supera el límite de crédito ({formatCurrency(limiteCredito)})
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón Inferior: CONFIRMAR VENTA (con protección anti doble clic) */}
      <View style={[styles.bottomBar, shadows.floating]}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={!completo || isSubmitting || excedeCredito}
          onPress={handleConfirm}
          style={[
            styles.confirmBtn,
            (!completo || isSubmitting || excedeCredito) && styles.confirmBtnDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.neutral[0]} />
          ) : (
            <>
              <CheckCircle2 size={22} color={colors.neutral[0]} />
              <Text style={styles.confirmBtnText}>CONFIRMAR VENTA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 140,
  },
  heroCard: {
    backgroundColor: colors.primary[700],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
    marginVertical: spacing.xs,
  },
  clientInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  clientInlineText: {
    color: colors.neutral[0],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  quickMethodsSection: {
    marginTop: spacing.md,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  quickRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  quickChipCombinado: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  quickChipText: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[800],
    fontWeight: fontWeight.semibold,
  },
  inputsSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  paymentInputCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBody: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[600],
    fontWeight: fontWeight.semibold,
  },
  disponibleText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  currencyPrefix: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[400],
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    padding: 0,
  },
  statusCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.xs + 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  diffValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  creditoImpactBox: {
    backgroundColor: colors.warning[50],
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning[100],
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  alertText: {
    fontSize: fontSize.xs,
    color: colors.error[600],
    fontWeight: fontWeight.semibold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  confirmBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.neutral[300],
  },
  confirmBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
