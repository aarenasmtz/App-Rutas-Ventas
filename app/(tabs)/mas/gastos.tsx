import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Fuel,
  Plus,
  Utensils,
  Car,
  Wrench,
  Receipt,
  DollarSign,
  X,
  User,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';

export default function GastosScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal registrar gasto
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [categoria, setCategoria] = useState<'Gasolina' | 'Casetas' | 'Alimentos' | 'Mantenimiento' | 'Otros'>('Gasolina');
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  const loadGastos = async () => {
    setLoading(true);
    try {
      const data = await DataService.getGastos();
      setGastos(data || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGastos();
  }, []);

  const totalGastos = useMemo(() => {
    return gastos.reduce((s, g) => s + (g.importe || 0), 0);
  }, [gastos]);

  const totalGasolina = useMemo(() => {
    return gastos
      .filter((g) => g.concepto?.toLowerCase().includes('gasolina') || g.categoria === 'Gasolina')
      .reduce((s, g) => s + (g.importe || 0), 0);
  }, [gastos]);

  const totalEfectivo = useMemo(() => {
    return gastos
      .filter((g) => (g.metodoPago || 'Efectivo').toLowerCase().includes('efectivo'))
      .reduce((s, g) => s + (g.importe || 0), 0);
  }, [gastos]);

  const handleOpenNuevo = () => {
    setCategoria('Gasolina');
    setConcepto('Carga de gasolina');
    setImporte('');
    setMetodoPago('Efectivo');
    setObservaciones('');
    setModalVisible(true);
  };

  const handleGuardarGasto = async () => {
    const impNum = parseFloat(importe);
    if (isNaN(impNum) || impNum <= 0) {
      Alert.alert('Importe inválido', 'Ingresa un monto válido mayor a $0');
      return;
    }
    if (!concepto.trim()) {
      Alert.alert('Concepto requerido', 'Indica el motivo o descripción del gasto');
      return;
    }

    setIsSaving(true);
    try {
      const nuevoGasto = await DataService.registrarGasto({
        empleadoId: user?.id ? String(user.id) : '1',
        concepto: `${categoria}: ${concepto.trim()}`,
        importe: impNum,
        metodoPago,
        observaciones,
      });

      // Registrar en Bitácora
      await DataService.registrarBitacora({
        modulo: 'Gastos',
        accion: 'Gasto Registrado',
        detalle: `${categoria}: ${concepto.trim()} por ${formatCurrency(impNum)} pagado en ${metodoPago}`,
        usuario: user?.nombre || 'Miguel',
      });

      setGastos((prev) => [
        {
          id: nuevoGasto.id || Date.now(),
          empleadoId: user?.id ? String(user.id) : '1',
          empleadoNombre: user?.nombre || 'Miguel',
          categoria,
          concepto: `${categoria}: ${concepto.trim()}`,
          importe: impNum,
          metodoPago,
          observaciones,
          fechaHora: new Date().toISOString(),
        },
        ...prev,
      ]);

      setModalVisible(false);
      Alert.alert('Éxito', 'Gasto registrado correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el gasto');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('gasolina')) return <Fuel size={18} color={colors.warning[600]} />;
    if (c.includes('comida') || c.includes('alimento')) return <Utensils size={18} color={colors.primary[600]} />;
    if (c.includes('caseta') || c.includes('estacionamiento')) return <Car size={18} color={colors.neutral[600]} />;
    if (c.includes('mantenimiento')) return <Wrench size={18} color={colors.error[600]} />;
    return <Receipt size={18} color={colors.neutral[600]} />;
  };

  return (
    <AppShell>
      <PageHeader
        title="Gastos de Ruta"
        subtitle="Control de gasolina, casetas y viáticos"
        onBack={() => router.replace('/(tabs)/mas' as any)}
        right={
          <TouchableOpacity activeOpacity={0.8} onPress={handleOpenNuevo} style={styles.createBtnHeader}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createBtnHeaderText}>Nuevo Gasto</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* KPIs */}
        <View style={styles.kpisRow}>
          <View style={[styles.kpiCard, { borderLeftColor: colors.error[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Total Gastos</Text>
            <Text style={[styles.kpiValue, { color: colors.error[700] }]}>{formatCurrency(totalGastos)}</Text>
            <Text style={styles.kpiSub}>{gastos.length} comprobantes</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.warning[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Gasolina</Text>
            <Text style={[styles.kpiValue, { color: colors.warning[700] }]}>{formatCurrency(totalGasolina)}</Text>
            <Text style={styles.kpiSub}>Combustible ruta</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.primary[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>En Efectivo</Text>
            <Text style={styles.kpiValue}>{formatCurrency(totalEfectivo)}</Text>
            <Text style={styles.kpiSub}>Resta del corte de caja</Text>
          </View>
        </View>

        {/* Lista de Gastos */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Comprobantes Registrados Hoy</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Cargando gastos...</Text>
            </View>
          ) : gastos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Fuel size={40} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No hay gastos registrados hoy</Text>
              <Text style={styles.emptySub}>
                Registra cargas de gasolina o pagos en ruta con el botón superior.
              </Text>
            </View>
          ) : (
            gastos.map((g) => {
              const fechaStr = new Date(g.fechaHora || Date.now()).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={g.id} style={[styles.gastoCard, shadows.card]}>
                  <View style={styles.gastoIconWrap}>{getCategoryIcon(g.concepto)}</View>

                  <View style={{ flex: 1, paddingHorizontal: spacing.sm }}>
                    <Text style={styles.gastoConcepto}>{g.concepto}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.gastoMetodoBadge}>{g.metodoPago || 'Efectivo'}</Text>
                      <Text style={styles.gastoUser}>👤 {g.empleadoNombre || 'Miguel'}</Text>
                    </View>
                    {g.observaciones ? (
                      <Text style={styles.gastoObs}>Nota: {g.observaciones}</Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.gastoImporte}>-{formatCurrency(g.importe)}</Text>
                    <Text style={styles.gastoHora}>{fechaStr}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal Registrar Gasto */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.floating]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar Gasto de Ruta</Text>
                <Text style={styles.modalSubtitle}>Resta del efectivo de caja física</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Categoría */}
              <Text style={styles.inputLabel}>Categoría:</Text>
              <View style={styles.catsRow}>
                {(['Gasolina', 'Casetas', 'Alimentos', 'Mantenimiento', 'Otros'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategoria(cat);
                      if (cat === 'Gasolina') setConcepto('Carga de gasolina');
                      else if (cat === 'Casetas') setConcepto('Peaje de caseta');
                      else if (cat === 'Alimentos') setConcepto('Comida de ruta');
                      else if (cat === 'Mantenimiento') setConcepto('Reparación / Mantenimiento');
                      else setConcepto('');
                    }}
                    style={[styles.catBtn, categoria === cat && styles.catBtnActive]}
                  >
                    <Text style={[styles.catBtnText, categoria === cat && styles.catBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Importe */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Monto del gasto ($ MXN):</Text>
              <TextInput
                value={importe}
                onChangeText={setImporte}
                keyboardType="numeric"
                style={[styles.textInput, { fontSize: fontSize.lg, fontWeight: '700' }]}
                placeholder="0.00"
              />

              {/* Concepto */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Concepto o detalle:</Text>
              <TextInput
                value={concepto}
                onChangeText={setConcepto}
                style={styles.textInput}
                placeholder="Ej. Carga de Magna gasolinera Blvd. Aeropuerto"
              />

              {/* Método de Pago */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Pagado con:</Text>
              <View style={styles.catsRow}>
                {(['Efectivo', 'Tarjeta', 'Transferencia'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMetodoPago(m)}
                    style={[styles.catBtn, metodoPago === m && styles.catBtnActive]}
                  >
                    <Text style={[styles.catBtnText, metodoPago === m && styles.catBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Observaciones */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Notas u observaciones:</Text>
              <TextInput
                value={observaciones}
                onChangeText={setObservaciones}
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Folio de ticket o referencia de factura..."
                multiline
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGuardarGasto}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Gasto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  createBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  createBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  kpisRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9,
    color: colors.neutral[400],
    marginTop: 1,
  },
  listSection: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  gastoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  gastoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gastoConcepto: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  gastoMetodoBadge: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  gastoUser: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  gastoObs: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
    fontStyle: 'italic',
  },
  gastoImporte: {
    fontSize: fontSize.base,
    fontWeight: '900',
    color: colors.error[600],
  },
  gastoHora: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xxl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  catsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catBtn: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  catBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  catBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  catBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  saveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
});
