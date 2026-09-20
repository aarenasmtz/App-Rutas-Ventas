import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Banknote, Smartphone, Check } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

export default function CobranzaScreen() {
  const router = useRouter();
  const { clientes, registrarAbono } = useApp();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [abonoRegistrado, setAbonoRegistrado] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId);
  const montoNum = parseFloat(monto) || 0;
  const nuevoSaldo = cliente ? cliente.saldo - montoNum : 0;

  const handleRegistrar = () => {
    if (!cliente) { Alert.alert('Selecciona un cliente'); return; }
    if (montoNum <= 0) { Alert.alert('Ingresa un monto válido'); return; }
    registrarAbono(cliente.id, montoNum, metodo);
    setAbonoRegistrado(true);
  };

  const handleReset = () => {
    setClienteId(null);
    setMonto('');
    setAbonoRegistrado(false);
  };

  if (abonoRegistrado && cliente) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Cobranza" onBack={() => router.back()} />
        <View style={styles.confirmContent}>
          <View style={styles.successIcon}>
            <Check size={56} color={colors.success[600]} />
          </View>
          <Text style={styles.confirmTitle}>¡Abono registrado!</Text>
          <Text style={styles.confirmClient}>{cliente.nombre}</Text>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Abono</Text>
              <Text style={styles.confirmValue}>{formatCurrency(montoNum)}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Método</Text>
              <Text style={styles.confirmValue}>{metodo}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Saldo anterior</Text>
              <Text style={styles.confirmValue}>{formatCurrency(cliente.saldo)}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.confirmLabelNuevo}>Nuevo saldo</Text>
              <Text style={[styles.confirmValueNuevo, { color: nuevoSaldo > 0 ? colors.warning[600] : colors.success[600] }]}>
                {formatCurrency(Math.max(0, nuevoSaldo))}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleReset}>
            <Text style={styles.confirmBtnText}>Registrar otro abono</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Cobranza" subtitle="Registrar abono" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.sectionLabel}>Selecciona cliente</Text>
        {clientes.filter((c) => c.saldo > 0).map((c) => (
          <TouchableOpacity key={c.id} onPress={() => { setClienteId(c.id); setAbonoRegistrado(false); }}>
            <View style={[styles.clientCard, clienteId === c.id && styles.clientCardActive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{c.nombre}</Text>
                <Text style={styles.clientOwner}>{c.propietario}</Text>
              </View>
              <Text style={[styles.clientSaldo, { color: colors.error[600] }]}>{formatCurrency(c.saldo)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {cliente && (
          <>
            <View style={styles.saldoCard}>
              <Text style={styles.saldoLabel}>Saldo pendiente</Text>
              <Text style={[styles.saldoValue, { color: colors.error[600] }]}>{formatCurrency(cliente.saldo)}</Text>
            </View>

            <Text style={styles.sectionLabel}>Monto recibido</Text>
            <View style={styles.montoInputWrap}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0"
                placeholderTextColor={colors.neutral[300]}
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.sectionLabel}>Método de pago</Text>
            <View style={styles.metodosRow}>
              <TouchableOpacity style={[styles.metodoBtn, metodo === 'Efectivo' && styles.metodoBtnActive]} onPress={() => setMetodo('Efectivo')}>
                <Banknote size={22} color={metodo === 'Efectivo' ? colors.neutral[0] : colors.neutral[400]} />
                <Text style={[styles.metodoText, metodo === 'Efectivo' && styles.metodoTextActive]}>Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.metodoBtn, metodo === 'Transferencia' && styles.metodoBtnActive]} onPress={() => setMetodo('Transferencia')}>
                <Smartphone size={22} color={metodo === 'Transferencia' ? colors.neutral[0] : colors.neutral[400]} />
                <Text style={[styles.metodoText, metodo === 'Transferencia' && styles.metodoTextActive]}>Transferencia</Text>
              </TouchableOpacity>
            </View>

            {montoNum > 0 && (
              <View style={styles.nuevoSaldoCard}>
                <Text style={styles.nuevoSaldoLabel}>Nuevo saldo después del abono</Text>
                <Text style={[styles.nuevoSaldoValue, { color: nuevoSaldo > 0 ? colors.warning[600] : colors.success[600] }]}>
                  {formatCurrency(Math.max(0, nuevoSaldo))}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.registrarBtn} onPress={handleRegistrar}>
              <Text style={styles.registrarBtnText}>Registrar abono</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, padding: spacing.md, borderWidth: 2, borderColor: 'transparent', ...shadows.card },
  clientCardActive: { borderColor: colors.primary[600] },
  clientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  clientOwner: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  clientSaldo: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  saldoCard: { backgroundColor: colors.error[50], marginHorizontal: spacing.md, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  saldoLabel: { fontSize: fontSize.sm, color: colors.error[700] },
  saldoValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  montoInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 2, borderColor: colors.primary[600], ...shadows.card },
  currencySymbol: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[400], marginRight: spacing.sm },
  montoInput: { flex: 1, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  metodosRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md },
  metodoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.neutral[100], borderRadius: radius.md, paddingVertical: spacing.md },
  metodoBtnActive: { backgroundColor: colors.primary[600] },
  metodoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  metodoTextActive: { color: colors.neutral[0] },
  nuevoSaldoCard: { backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadows.card },
  nuevoSaldoLabel: { fontSize: fontSize.sm, color: colors.neutral[500], flex: 1 },
  nuevoSaldoValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  registrarBtn: { backgroundColor: colors.success[600], marginHorizontal: spacing.md, marginTop: spacing.lg, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
  registrarBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
  confirmContent: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  successIcon: { marginBottom: spacing.md },
  confirmTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  confirmClient: { fontSize: fontSize.md, color: colors.neutral[500], marginTop: spacing.xs },
  confirmCard: { backgroundColor: colors.neutral[0], width: '100%', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm - 2, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  confirmLabel: { fontSize: fontSize.sm, color: colors.neutral[500] },
  confirmValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  confirmLabelNuevo: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  confirmValueNuevo: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  confirmBtn: { backgroundColor: colors.primary[600], width: '100%', borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  confirmBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
