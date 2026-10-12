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
  RotateCcw,
  Plus,
  Search,
  Package,
  User,
  AlertTriangle,
  CheckCircle2,
  X,
  Boxes,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader, MoneyDisplay, SearchBar } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import type { Cliente, Producto } from '@/types';

export default function DevolucionesScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Modal de registro
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState<'Caducado' | 'Producto dañado' | 'Cambio' | 'Otro'>('Producto dañado');
  const [destino, setDestino] = useState<'Merma' | 'Inventario' | 'Cambio'>('Merma');
  const [metodoReembolso, setMetodoReembolso] = useState<'CambioFisico' | 'SaldoAFavor' | 'Efectivo'>('CambioFisico');
  const [observaciones, setObservaciones] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [devs, clis, prods] = await Promise.all([
        DataService.getDevoluciones(),
        DataService.getClientes(),
        DataService.getProductos(),
      ]);
      setDevoluciones(devs || []);
      setClientes(clis || []);
      setProductos(prods || []);
      if (clis && clis.length > 0) setSelectedClienteId(clis[0].id);
      if (prods && prods.length > 0) setSelectedProductoId(prods[0].id);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPiezasDevueltas = useMemo(() => {
    return devoluciones.reduce((s, d) => s + (d.cantidad || 0), 0);
  }, [devoluciones]);

  const totalValorDevuelto = useMemo(() => {
    return devoluciones.reduce((s, d) => s + (d.total || 0), 0);
  }, [devoluciones]);

  const handleOpenNuevo = () => {
    if (clientes.length > 0 && !selectedClienteId) setSelectedClienteId(clientes[0].id);
    if (productos.length > 0 && !selectedProductoId) setSelectedProductoId(productos[0].id);
    setCantidad('1');
    setObservaciones('');
    setModalVisible(true);
  };

  const handleGuardarDevolucion = async () => {
    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa una cantidad mayor a 0');
      return;
    }

    const prod = productos.find((p) => p.id === selectedProductoId);
    const cli = clientes.find((c) => c.id === selectedClienteId);
    const precioU = prod ? prod.precioBase : 0;
    const totalCalc = precioU * cantNum;

    setIsSaving(true);
    try {
      const nuevaDev = await DataService.registrarDevolucion({
        clienteId: selectedClienteId,
        empleadoId: user?.id ? String(user.id) : '1',
        productoId: selectedProductoId,
        cantidad: cantNum,
        presentacionTipo: prod?.unidad || 'pieza',
        precioUnitario: precioU,
        total: totalCalc,
        motivo,
        destino,
        metodoReembolso,
        observaciones,
      });

      // Registrar en Bitácora de eventos
      await DataService.registrarBitacora({
        modulo: 'Devoluciones',
        accion: 'Devolución Registrada',
        detalle: `${cantNum} pzas de ${prod?.nombre || 'Producto'} devuelto por ${cli?.nombre || 'Cliente'} (${motivo})`,
        usuario: user?.nombre || 'Miguel',
      });

      setDevoluciones((prev) => [
        {
          id: nuevaDev.id || Date.now(),
          folio: nuevaDev.folio || `DEV-${Date.now().toString().slice(-4)}`,
          clienteId: selectedClienteId,
          clienteNombre: cli?.nombre || 'Cliente',
          productoId: selectedProductoId,
          productoNombre: prod?.nombre || 'Producto',
          cantidad: cantNum,
          total: totalCalc,
          motivo,
          destino,
          metodoReembolso,
          fechaHora: new Date().toISOString(),
          observaciones,
        },
        ...prev,
      ]);

      setModalVisible(false);
      Alert.alert('Éxito', 'La devolución se ha registrado correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la devolución');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Devoluciones y Cambios"
        subtitle="Registro de mermas y cambios de mercancía"
        onBack={() => router.replace('/(tabs)/mas' as any)}
        right={
          <TouchableOpacity activeOpacity={0.8} onPress={handleOpenNuevo} style={styles.createBtnHeader}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createBtnHeaderText}>Registrar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* KPIs */}
        <View style={styles.kpisRow}>
          <View style={[styles.kpiCard, { borderLeftColor: colors.error[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Piezas Devueltas</Text>
            <Text style={[styles.kpiValue, { color: colors.error[700] }]}>{totalPiezasDevueltas}</Text>
            <Text style={styles.kpiSub}>En camioneta / ruta</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.warning[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Valor Estimado</Text>
            <Text style={[styles.kpiValue, { color: colors.warning[700] }]}>{formatCurrency(totalValorDevuelto)}</Text>
            <Text style={styles.kpiSub}>Costo de mercancía</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.primary[500], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Incidencias</Text>
            <Text style={styles.kpiValue}>{devoluciones.length}</Text>
            <Text style={styles.kpiSub}>Registros del día</Text>
          </View>
        </View>

        {/* Lista de devoluciones */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Historial de Devoluciones del Día</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Cargando devoluciones...</Text>
            </View>
          ) : devoluciones.length === 0 ? (
            <View style={styles.emptyBox}>
              <RotateCcw size={40} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No hay devoluciones registradas</Text>
              <Text style={styles.emptySub}>
                Cuando un cliente cambie producto por caducidad o daño, regístralo con el botón superior.
              </Text>
            </View>
          ) : (
            devoluciones.map((dev) => {
              const fechaStr = new Date(dev.fechaHora || Date.now()).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={dev.id} style={[styles.devCard, shadows.card]}>
                  <View style={styles.devCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.motivoBadge}>{dev.motivo}</Text>
                        <Text style={styles.destinoBadge}>Destino: {dev.destino || 'Merma'}</Text>
                      </View>
                      <Text style={styles.devCliente}>{dev.clienteNombre || dev.cliente}</Text>
                      <Text style={styles.devProd}>{dev.productoNombre || dev.producto}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cantText}>
                        {dev.cantidad} {dev.cantidad === 1 ? 'pieza' : 'piezas'}
                      </Text>
                      <Text style={styles.devTotal}>{formatCurrency(dev.total || 0)}</Text>
                      <Text style={styles.horaText}>{fechaStr}</Text>
                    </View>
                  </View>

                  {dev.observaciones ? (
                    <Text style={styles.observacionesText}>Nota: {dev.observaciones}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal Registrar Devolución */}
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
                <Text style={styles.modalTitle}>Registrar Devolución / Cambio</Text>
                <Text style={styles.modalSubtitle}>Recepción de producto del cliente</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Seleccionar Cliente */}
              <Text style={styles.inputLabel}>Cliente:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {clientes.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedClienteId(c.id)}
                    style={[styles.selectorChip, selectedClienteId === c.id && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, selectedClienteId === c.id && styles.selectorChipTextActive]}>
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Seleccionar Producto */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Producto devuelto:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {productos.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProductoId(p.id)}
                    style={[styles.selectorChip, selectedProductoId === p.id && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, selectedProductoId === p.id && styles.selectorChipTextActive]}>
                      {p.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Cantidad */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Cantidad de piezas:</Text>
              <TextInput
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                style={styles.textInput}
                placeholder="1"
              />

              {/* Motivo */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Motivo de la devolución:</Text>
              <View style={styles.optionsRow}>
                {(['Producto dañado', 'Caducado', 'Cambio', 'Otro'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMotivo(m)}
                    style={[styles.optionBtn, motivo === m && styles.optionBtnActive]}
                  >
                    <Text style={[styles.optionBtnText, motivo === m && styles.optionBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Destino físico */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Destino físico de la pieza:</Text>
              <View style={styles.optionsRow}>
                {(['Merma', 'Inventario', 'Cambio'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDestino(d)}
                    style={[styles.optionBtn, destino === d && styles.optionBtnActive]}
                  >
                    <Text style={[styles.optionBtnText, destino === d && styles.optionBtnTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Resolución con el cliente */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Resolución con el cliente:</Text>
              <View style={styles.optionsRow}>
                {[
                  { id: 'CambioFisico', label: 'Cambio Físico' },
                  { id: 'SaldoAFavor', label: 'Saldo a Favor' },
                  { id: 'Efectivo', label: 'Efectivo' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setMetodoReembolso(r.id as any)}
                    style={[styles.optionBtn, metodoReembolso === r.id && styles.optionBtnActive]}
                  >
                    <Text style={[styles.optionBtnText, metodoReembolso === r.id && styles.optionBtnTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Observaciones */}
              <Text style={[styles.inputLabel, { marginTop: spacing.sm }]}>Observaciones (opcional):</Text>
              <TextInput
                value={observaciones}
                onChangeText={setObservaciones}
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Detalles del lote, daño o acuerdo..."
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
                onPress={handleGuardarDevolucion}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Devolución</Text>
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
  devCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  devCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  motivoBadge: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.error[700],
    backgroundColor: colors.error[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  destinoBadge: {
    fontSize: 10,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  devCliente: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 2,
  },
  devProd: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 1,
  },
  cantText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  devTotal: {
    fontSize: fontSize.sm,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  horaText: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  observacionesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.neutral[500],
    marginTop: spacing.xs + 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
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
    maxWidth: 500,
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
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  selectorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  selectorChipActive: {
    backgroundColor: colors.primary[700],
    borderColor: colors.primary[700],
  },
  selectorChipText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    fontWeight: fontWeight.medium,
  },
  selectorChipTextActive: {
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionBtn: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  optionBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  optionBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  optionBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
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
