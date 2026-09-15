import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Scissors } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { Card, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

export default function CorteScreen() {
  const router = useRouter();
  const [efectivoContado, setEfectivoContado] = useState('');
  const [corteRealizado, setCorteRealizado] = useState(false);

  const datos = [
    { label: 'Ventas totales', value: 8450, sign: '+' },
    { label: 'Efectivo', value: 4250, sign: '+' },
    { label: 'Transferencias', value: 1200, sign: '+' },
    { label: 'Crédito', value: 3000, sign: '+' },
    { label: 'Cobranza', value: 3200, sign: '+' },
    { label: 'Devoluciones', value: 480, sign: '-' },
    { label: 'Gastos', value: 515, sign: '-' },
    { label: 'Mermas', value: 210, sign: '-' },
  ];

  const efectivoInicial = 500;
  const ventasEfectivo = 4250;
  const cobranza = 3200;
  const gastos = 515;
  const devoluciones = 480;
  const efectivoEsperado = efectivoInicial + ventasEfectivo + cobranza - gastos - devoluciones;
  const contado = parseFloat(efectivoContado) || 0;
  const diferencia = contado - efectivoEsperado;

  const handleCorte = () => {
    if (contado <= 0) { Alert.alert('Ingresa el efectivo contado'); return; }
    setCorteRealizado(true);
  };

  if (corteRealizado) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Corte diario" onBack={() => router.back()} />
        <View style={styles.confirmContent}>
          <View style={styles.successIcon}><Check size={56} color={colors.success[600]} /></View>
          <Text style={styles.confirmTitle}>¡Corte realizado!</Text>
          <Text style={styles.confirmSubtitle}>Lunes 15 de septiembre, 2026</Text>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Efectivo esperado</Text><Text style={styles.confirmValue}>{formatCurrency(efectivoEsperado)}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Efectivo contado</Text><Text style={styles.confirmValue}>{formatCurrency(contado)}</Text></View>
            <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.confirmLabelDiff}>Diferencia</Text>
              <Text style={[styles.confirmValueDiff, { color: Math.abs(diferencia) < 0.01 ? colors.success[600] : colors.error[600] }]}>
                {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.confirmBtnText}>Ir al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Corte diario" subtitle="15 de septiembre, 2026" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}><Scissors size={24} color={colors.neutral[0]} /></View>
          <Text style={styles.headerTitle}>Resumen del día</Text>
        </View>

        <Card style={styles.datosCard}>
          {datos.map((d, i) => (
            <View key={i} style={styles.datosRow}>
              <Text style={styles.datosLabel}>{d.label}</Text>
              <Text style={[styles.datosValue, { color: d.sign === '+' ? colors.success[600] : colors.error[500] }]}>
                {d.sign}{formatCurrency(d.value)}
              </Text>
            </View>
          ))}
        </Card>

        <View style={styles.esperadoCard}>
          <Text style={styles.esperadoLabel}>Efectivo esperado</Text>
          <Text style={styles.esperadoValue}>{formatCurrency(efectivoEsperado)}</Text>
        </View>

        <Text style={styles.sectionLabel}>Efectivo contado</Text>
        <View style={styles.contadoWrap}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput style={styles.contadoInput} placeholder="0" placeholderTextColor={colors.neutral[300]} value={efectivoContado} onChangeText={setEfectivoContado} keyboardType="decimal-pad" />
        </View>

        {contado > 0 && (
          <View style={[styles.diferenciaCard, { backgroundColor: Math.abs(diferencia) < 0.01 ? colors.success[50] : colors.error[50] }]}>
            <Text style={[styles.diferenciaLabel, { color: Math.abs(diferencia) < 0.01 ? colors.success[700] : colors.error[700] }]}>Diferencia</Text>
            <Text style={[styles.diferenciaValue, { color: Math.abs(diferencia) < 0.01 ? colors.success[600] : colors.error[600] }]}>
              {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.corteBtn} onPress={handleCorte}>
          <Text style={styles.corteBtnText}>Realizar corte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary[700], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  headerIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.neutral[0] },
  datosCard: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  datosRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  datosLabel: { fontSize: fontSize.sm, color: colors.neutral[600] },
  datosValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  esperadoCard: { backgroundColor: colors.primary[600], marginHorizontal: spacing.md, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  esperadoLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  esperadoValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.xs },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  contadoWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 2, borderColor: colors.primary[600], ...shadows.card },
  currencySymbol: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[400], marginRight: spacing.sm },
  contadoInput: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  diferenciaCard: { marginHorizontal: spacing.md, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  diferenciaLabel: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  diferenciaValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  corteBtn: { backgroundColor: colors.primary[600], marginHorizontal: spacing.md, marginTop: spacing.lg, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
  corteBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
  confirmContent: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  successIcon: { marginBottom: spacing.md },
  confirmTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  confirmSubtitle: { fontSize: fontSize.base, color: colors.neutral[500], marginTop: spacing.xs },
  confirmCard: { backgroundColor: colors.neutral[0], width: '100%', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm - 2, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  confirmLabel: { fontSize: fontSize.sm, color: colors.neutral[500] },
  confirmValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  confirmLabelDiff: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  confirmValueDiff: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  confirmBtn: { backgroundColor: colors.primary[600], width: '100%', borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  confirmBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
