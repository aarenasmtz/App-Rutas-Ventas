import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Banknote, Smartphone, CreditCard, Check, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { clientes } from '@/constants/mockData';
import { ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import type { MetodoPago, Pago } from '@/types';

export default function PagoScreen() {
  const router = useRouter();
  const { ventaTotal, pagos, setPagos, clienteActivoId, clearCarrito } = useApp();
  const [efectivo, setEfectivo] = useState('');
  const [transferencia, setTransferencia] = useState('');
  const [credito, setCredito] = useState('');

  const cliente = clientes.find((c) => c.id === clienteActivoId);
  const creditoActual = cliente?.saldo || 0;
  const creditoDisponible = cliente ? cliente.limiteCredito - cliente.saldo : 0;

  const ef = parseFloat(efectivo) || 0;
  const tr = parseFloat(transferencia) || 0;
  const cr = parseFloat(credito) || 0;
  const totalPagado = ef + tr + cr;
  const diferencia = ventaTotal - totalPagado;
  const completo = Math.abs(diferencia) < 0.01;

  const metodos: { key: MetodoPago; label: string; icon: typeof Banknote; value: string; set: (v: string) => void; color: string; bg: string }[] = [
    { key: 'Efectivo', label: 'Efectivo', icon: Banknote, value: efectivo, set: setEfectivo, color: colors.success[600], bg: colors.success[50] },
    { key: 'Transferencia', label: 'Transferencia', icon: Smartphone, value: transferencia, set: setTransferencia, color: colors.primary[600], bg: colors.primary[50] },
    { key: 'Crédito', label: 'Crédito', icon: CreditCard, value: credito, set: setCredito, color: colors.warning[600], bg: colors.warning[50] },
  ];

  const handleConfirm = () => {
    if (!completo) {
      Alert.alert('Pago incompleto', `Faltan ${formatCurrency(diferencia)} por cubrir.`);
      return;
    }
    const pagosValidos: Pago[] = [];
    if (ef > 0) pagosValidos.push({ metodo: 'Efectivo', monto: ef });
    if (tr > 0) pagosValidos.push({ metodo: 'Transferencia', monto: tr });
    if (cr > 0) pagosValidos.push({ metodo: 'Crédito', monto: cr });
    setPagos(pagosValidos);
    router.push('/(tabs)/venta/confirmacion');
  };

  const nuevoSaldo = creditoActual + cr;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Pago" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>{formatCurrency(ventaTotal)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Métodos de pago (pago mixto)</Text>

        {metodos.map((m) => {
          const Icon = m.icon;
          return (
            <View key={m.key} style={styles.metodoCard}>
              <View style={[styles.metodoIcon, { backgroundColor: m.bg }]}>
                <Icon size={22} color={m.color} />
              </View>
              <View style={styles.metodoInfo}>
                <Text style={styles.metodoLabel}>{m.label}</Text>
                <View style={styles.metodoInputWrap}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.metodoInput}
                    placeholder="0"
                    placeholderTextColor={colors.neutral[300]}
                    value={m.value}
                    onChangeText={m.set}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Total pagado</Text>
            <Text style={[styles.resumenValue, { color: completo ? colors.success[600] : colors.neutral[900] }]}>{formatCurrency(totalPagado)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Diferencia</Text>
            <Text style={[styles.resumenValue, { color: Math.abs(diferencia) < 0.01 ? colors.success[600] : colors.error[600] }]}>
              {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
            </Text>
          </View>
        </View>

        {cr > 0 && cliente && (
          <View style={styles.creditoInfoCard}>
            <View style={styles.creditoInfoRow}>
              <Text style={styles.creditoInfoLabel}>Crédito actual</Text>
              <Text style={styles.creditoInfoValue}>{formatCurrency(creditoActual)}</Text>
            </View>
            <View style={styles.creditoInfoRow}>
              <Text style={styles.creditoInfoLabel}>Nuevo saldo</Text>
              <Text style={[styles.creditoInfoValue, { color: nuevoSaldo > cliente.limiteCredito ? colors.error[600] : colors.warning[600] }]}>
                {formatCurrency(nuevoSaldo)}
              </Text>
            </View>
            <View style={styles.creditoInfoRow}>
              <Text style={styles.creditoInfoLabel}>Límite de crédito</Text>
              <Text style={styles.creditoInfoValue}>{formatCurrency(cliente.limiteCredito)}</Text>
            </View>
            {nuevoSaldo > cliente.limiteCredito && (
              <View style={styles.alertRow}>
                <AlertCircle size={16} color={colors.error[600]} />
                <Text style={styles.alertText}>El nuevo saldo excede el límite de crédito</Text>
              </View>
            )}
          </View>
        )}

        {completo && (
          <View style={styles.completeBanner}>
            <Check size={20} color={colors.success[600]} />
            <Text style={styles.completeText}>Pago completo</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !completo && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!completo}
        >
          <Check size={22} color={colors.neutral[0]} />
          <Text style={styles.confirmBtnText}>Confirmar pago</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  totalCard: {
    backgroundColor: colors.primary[700],
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  totalValue: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  metodoCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  metodoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metodoInfo: {
    flex: 1,
  },
  metodoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.xs + 2,
  },
  metodoInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  currencySymbol: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[400],
    marginRight: spacing.xs,
  },
  metodoInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  resumenCard: {
    backgroundColor: colors.neutral[0],
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm - 2,
  },
  resumenLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  resumenValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  creditoInfoCard: {
    backgroundColor: colors.warning[50],
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  creditoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 1,
  },
  creditoInfoLabel: {
    fontSize: fontSize.sm,
    color: colors.warning[700],
  },
  creditoInfoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  alertText: {
    fontSize: fontSize.xs,
    color: colors.error[600],
    fontWeight: fontWeight.semibold,
  },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success[50],
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.md,
  },
  completeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success[700],
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.floating,
  },
  confirmBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
