import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Banknote, Smartphone } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { Card, ScreenHeader, BottomSheet } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import { DataService } from '@/services/mockDataService';
import type { Gasto, MetodoPago } from '@/types';

const conceptos = ['Gasolina', 'Comida', 'Estacionamiento', 'Mantenimiento', 'Otro'] as const;

export default function GastosScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gastos, setGastos] = useState<any[]>([]);
  const [concepto, setConcepto] = useState<typeof conceptos[number]>('Gasolina');
  const [importe, setImporte] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  const loadGastos = async () => {
    try {
      const data = await DataService.getGastos();
      if (data) setGastos(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadGastos();
  }, []);

  const totalHoy = gastos.reduce((s, g) => s + (g.importe || 0), 0);

  const handleGuardar = async () => {
    const imp = parseFloat(importe) || 0;
    if (imp <= 0) { Alert.alert('Ingresa un importe válido'); return; }
    
    setLoading(true);
    try {
      await DataService.registrarGasto({
        empleadoId: user?.id || '1',
        concepto,
        importe: imp,
        metodoPago: metodo,
        observaciones,
      });
      await loadGastos();
      setShowForm(false);
      setImporte('');
      setObservaciones('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gastos" onBack={() => router.back()} right={
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Plus size={22} color={colors.primary[600]} />
        </TouchableOpacity>
      } />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Gastos de hoy</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalHoy)}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.sectionLabel}>Historial</Text>
        {gastos.map((g) => (
          <Card key={g.id} style={styles.gastoCard}>
            <View style={styles.gastoLeft}>
              <View style={styles.gastoIcon}><Text style={styles.gastoIconText}>{g.concepto.charAt(0)}</Text></View>
              <View>
                <Text style={styles.gastoConcepto}>{g.concepto}</Text>
                <Text style={styles.gastoFecha}>{g.fecha}</Text>
                {g.observaciones ? <Text style={styles.gastoObs}>{g.observaciones}</Text> : null}
                <Text style={styles.gastoMetodo}>{g.metodo}</Text>
              </View>
            </View>
            <Text style={styles.gastoImporte}>{formatCurrency(g.importe)}</Text>
          </Card>
        ))}
      </ScrollView>

      <BottomSheet visible={showForm} onClose={() => setShowForm(false)} title="Nuevo gasto">
        <Text style={styles.fieldLabel}>Concepto</Text>
        <View style={styles.conceptosRow}>
          {conceptos.map((c) => (
            <TouchableOpacity key={c} style={[styles.conceptoChip, concepto === c && styles.conceptoChipActive]} onPress={() => setConcepto(c)}>
              <Text style={[styles.conceptoText, concepto === c && styles.conceptoTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Importe</Text>
        <View style={styles.importeWrap}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput style={styles.importeInput} placeholder="0" placeholderTextColor={colors.neutral[300]} value={importe} onChangeText={setImporte} keyboardType="decimal-pad" />
        </View>

        <Text style={styles.fieldLabel}>Método de pago</Text>
        <View style={styles.metodosRow}>
          <TouchableOpacity style={[styles.metodoBtn, metodo === 'Efectivo' && styles.metodoBtnActive]} onPress={() => setMetodo('Efectivo')}>
            <Banknote size={20} color={metodo === 'Efectivo' ? colors.neutral[0] : colors.neutral[400]} />
            <Text style={[styles.metodoText, metodo === 'Efectivo' && styles.metodoTextActive]}>Efectivo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.metodoBtn, metodo === 'Transferencia' && styles.metodoBtnActive]} onPress={() => setMetodo('Transferencia')}>
            <Smartphone size={20} color={metodo === 'Transferencia' ? colors.neutral[0] : colors.neutral[400]} />
            <Text style={[styles.metodoText, metodo === 'Transferencia' && styles.metodoTextActive]}>Transferencia</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Observaciones</Text>
        <TextInput style={styles.obsInput} placeholder="Notas (opcional)" placeholderTextColor={colors.neutral[300]} value={observaciones} onChangeText={setObservaciones} multiline />

        <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardar}>
          <Text style={styles.guardarBtnText}>Guardar gasto</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  addBtn: { padding: spacing.xs },
  totalCard: { backgroundColor: colors.warning[600], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  totalLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  totalValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.xs },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  gastoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  gastoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  gastoIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.warning[50], alignItems: 'center', justifyContent: 'center' },
  gastoIconText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.warning[600] },
  gastoConcepto: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  gastoFecha: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  gastoObs: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },
  gastoMetodo: { fontSize: fontSize.xs, color: colors.primary[600], marginTop: 2, fontWeight: fontWeight.semibold },
  gastoImporte: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600], marginBottom: spacing.sm, marginTop: spacing.md },
  conceptosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  conceptoChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.neutral[100] },
  conceptoChipActive: { backgroundColor: colors.warning[600] },
  conceptoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  conceptoTextActive: { color: colors.neutral[0] },
  importeWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderWidth: 2, borderColor: colors.warning[600] },
  currencySymbol: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[400], marginRight: spacing.sm },
  importeInput: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  metodosRow: { flexDirection: 'row', gap: spacing.md },
  metodoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.neutral[100], borderRadius: radius.md, paddingVertical: spacing.md },
  metodoBtnActive: { backgroundColor: colors.warning[600] },
  metodoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  metodoTextActive: { color: colors.neutral[0] },
  obsInput: { backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: colors.neutral[900], minHeight: 60, fontFamily: 'Inter-Regular' },
  guardarBtn: { backgroundColor: colors.warning[600], borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
  guardarBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
