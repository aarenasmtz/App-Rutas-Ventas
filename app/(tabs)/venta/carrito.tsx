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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trash2,
  ChevronRight,
  Plus,
  Minus,
  ArrowLeft,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/helpers';
import { DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import type { ItemCarrito, Cliente, MetodoPago, Pago } from '@/types';

const defaultCliente: Cliente = {
  id: 'general',
  nombre: 'Venta de Mostrador / General',
  propietario: 'Cliente General',
  direccion: 'Venta directa en ruta',
  ruta: 'Ruta General',
  diasVisita: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  saldo: 0,
  limiteCredito: 0,
  estado: 'Pendiente',
  ultimaVisita: '',
  telefono: '',
  activo: true,
  distanciaMock: '0m',
  historial: [],
  sugerido: [],
};

export default function CarritoScreen() {
  const router = useRouter();
  const {
    carrito,
    updateCarritoItem,
    removeFromCarrito,
    clearCarrito,
    setVentaTotal,
    clienteActivoId,
    setPagos,
    setUltimoFolioVenta,
    user,
  } = useApp();

  const [rawCliente, setRawCliente] = useState<Cliente | null>(null);
  const cliente = rawCliente || defaultCliente;

  useEffect(() => {
    if (clienteActivoId && clienteActivoId !== 'general') {
      DataService.getClienteById(clienteActivoId).then((c: Cliente | undefined) => {
        if (c) setRawCliente(c);
      });
    }
  }, [clienteActivoId]);

  // Cálculos de totales
  const total = carrito.reduce((s, i) => s + i.subtotal, 0);
  const totalPiezas = carrito.reduce(
    (s, i) => s + (i.piezasTotales || i.cantidad * (i.factorConversion || 1)),
    0
  );

  // Estados de pago
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | 'Combinado'>('Efectivo');
  const [efectivo, setEfectivo] = useState(total.toString());
  const [transferencia, setTransferencia] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [credito, setCredito] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar montos al cambiar total o método rápido
  useEffect(() => {
    if (metodoSeleccionado === 'Efectivo') {
      setEfectivo(total.toString());
      setTransferencia('');
      setTarjeta('');
      setCredito('');
    } else if (metodoSeleccionado === 'Transferencia') {
      setTransferencia(total.toString());
      setEfectivo('');
      setTarjeta('');
      setCredito('');
    } else if (metodoSeleccionado === 'Tarjeta') {
      setTarjeta(total.toString());
      setEfectivo('');
      setTransferencia('');
      setCredito('');
    } else if (metodoSeleccionado === 'Crédito') {
      setCredito(total.toString());
      setEfectivo('');
      setTransferencia('');
      setTarjeta('');
    }
  }, [total, metodoSeleccionado]);

  const ef = parseFloat(efectivo) || 0;
  const tr = parseFloat(transferencia) || 0;
  const tj = parseFloat(tarjeta) || 0;
  const cr = parseFloat(credito) || 0;

  const totalPagado = ef + tr + tj + cr;
  const diferencia = total - totalPagado;
  const pagoCompleto = Math.abs(diferencia) < 0.01;

  // Validación de crédito
  const saldoActual = cliente?.saldo || 0;
  const limiteCredito = cliente?.limiteCredito || 0;
  const nuevoSaldo = saldoActual + cr;
  const excedeCredito = cr > 0 && limiteCredito > 0 && nuevoSaldo > limiteCredito;

  // Modificar cantidades
  const handleIncrement = (index: number) => {
    const item = carrito[index];
    const newQty = item.cantidad + 1;
    const factor = item.presentacion?.piezasEquivalentes || item.factorConversion || 1;
    const reqPiezas = newQty * factor;

    if (item.producto.existencia !== undefined && reqPiezas > item.producto.existencia) {
      Alert.alert(
        'Stock insuficiente',
        `Disponible en camioneta: ${item.producto.existencia} ${item.producto.unidad || 'unidad'}(s).`
      );
      return;
    }

    updateCarritoItem(index, {
      ...item,
      cantidad: newQty,
      piezasTotales: reqPiezas,
      subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
    });
  };

  const handleDecrement = (index: number) => {
    const item = carrito[index];
    if (item.cantidad <= 1) {
      removeFromCarrito(index);
    } else {
      const newQty = item.cantidad - 1;
      const factor = item.presentacion?.piezasEquivalentes || item.factorConversion || 1;
      updateCarritoItem(index, {
        ...item,
        cantidad: newQty,
        piezasTotales: newQty * factor,
        subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
      });
    }
  };

  // Confirmar Venta Final
  const handleConfirmarVenta = async () => {
    if (isSubmitting) return;

    if (carrito.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de confirmar.');
      return;
    }

    if (!pagoCompleto) {
      Alert.alert(
        'Pago incompleto',
        `Aún faltan ${formatCurrency(diferencia)} por cubrir del total (${formatCurrency(total)}).`
      );
      return;
    }

    if (excedeCredito) {
      Alert.alert(
        'Límite de crédito excedido',
        `El nuevo saldo (${formatCurrency(nuevoSaldo)}) excede el límite del cliente (${formatCurrency(limiteCredito)}).`
      );
      return;
    }

    // Validar existencias acumuladas de todos los items
    const requerimientoPorProducto: Record<string, { nombre: string; requerido: number; disponible: number; unidad: string }> = {};
    for (const it of carrito) {
      const pId = it.producto.id;
      const factor = it.presentacion?.piezasEquivalentes || it.factorConversion || 1;
      const unidades = it.piezasTotales || Math.round(it.cantidad * factor);

      if (!requerimientoPorProducto[pId]) {
        requerimientoPorProducto[pId] = {
          nombre: it.producto.nombre,
          requerido: 0,
          disponible: it.producto.existencia,
          unidad: it.producto.unidad || 'unidad',
        };
      }
      requerimientoPorProducto[pId].requerido += unidades;
    }

    for (const pId in requerimientoPorProducto) {
      const req = requerimientoPorProducto[pId];
      if (req.disponible !== undefined && req.requerido > req.disponible) {
        Alert.alert(
          'Inventario insuficiente',
          `Se solicitan ${req.requerido} ${req.unidad}s de "${req.nombre}", pero solo hay ${req.disponible} disponibles en inventario.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    const pagosValidos: Pago[] = [];
    if (ef > 0) pagosValidos.push({ metodo: 'Efectivo', monto: ef });
    if (tr > 0) pagosValidos.push({ metodo: 'Transferencia', monto: tr });
    if (tj > 0) pagosValidos.push({ metodo: 'Tarjeta', monto: tj });
    if (cr > 0) pagosValidos.push({ metodo: 'Crédito', monto: cr });

    setPagos(pagosValidos);
    setVentaTotal(total);

    try {
      const res = await DataService.registrarVenta({
        clienteId: cliente.id,
        empleadoId: user?.id || '1',
        total,
        items: carrito.map((i) => ({
          productoId: i.producto.id,
          presentacionTipo: i.presentacion?.tipo || 'pieza',
          presentacionNombre: i.presentacion?.nombre || i.presentacionNombre,
          factorConversion: i.presentacion?.piezasEquivalentes || i.factorConversion || 1,
          cantidadPresentaciones: i.cantidad,
          piezasTotalesCalculadas:
            i.piezasTotales || i.cantidad * (i.presentacion?.piezasEquivalentes || 1),
          precioUnitario: i.precioFinal,
          subtotal: i.subtotal,
        })),
        pagos: pagosValidos.map((p) => ({ metodo: p.metodo, monto: p.monto })),
      });

      if (res && res.folio) {
        setUltimoFolioVenta(res.folio);
      }
      router.push('/(tabs)/venta/confirmacion');
    } catch (err: any) {
      Alert.alert(
        'Error al registrar venta',
        'No se pudo confirmar la venta. Verifica tu conexión o reintenta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Volver al catálogo"
        >
          <ArrowLeft size={20} color={colors.neutral[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Revisar y Confirmar</Text>
          <Text style={styles.headerSubtitle}>
            {carrito.length} productos · {totalPiezas} piezas/paq
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Vaciar carrito', '¿Deseas descartar los productos agregados?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Vaciar', style: 'destructive', onPress: () => clearCarrito() },
            ]);
          }}
          style={styles.trashCartBtn}
        >
          <Trash2 size={18} color={colors.error[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tarjeta de Cliente */}
        <View style={[styles.clientCard, shadows.card]}>
          <View style={styles.clientAvatar}>
            <User size={18} color={colors.primary[700]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{cliente.nombre}</Text>
            <Text style={styles.clientSub}>
              {cliente.propietario ? `${cliente.propietario} · ` : ''}
              Saldo: {formatCurrency(cliente.saldo || 0)}
              {cliente.limiteCredito ? ` · Límite: ${formatCurrency(cliente.limiteCredito)}` : ''}
            </Text>
          </View>
        </View>

        {/* Lista de Productos Agregados */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeading}>Productos en la nota</Text>

          {carrito.map((item, idx) => {
            const factor = item.presentacion?.piezasEquivalentes || item.factorConversion || 1;
            const presName = item.presentacion?.nombre || item.presentacionNombre || item.unidad;

            return (
              <View key={item.producto.id + (item.presentacion?.tipo || '') + idx} style={[styles.itemRow, shadows.card]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.producto.nombre}
                  </Text>
                  <Text style={styles.itemDetail}>
                    {presName} {factor > 1 ? `(${factor} u. base)` : ''} · {formatCurrency(item.precioFinal)} c/u
                  </Text>
                  <Text style={styles.itemSubtotal}>
                    Subtotal: <Text style={styles.itemSubtotalBold}>{formatCurrency(item.subtotal)}</Text>
                  </Text>
                </View>

                {/* Stepper y eliminar */}
                <View style={styles.itemActions}>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      onPress={() => handleDecrement(idx)}
                      style={styles.stepBtn}
                    >
                      <Minus size={14} color={colors.primary[700]} strokeWidth={2.8} />
                    </TouchableOpacity>
                    <View style={styles.stepQtyBox}>
                      <Text style={styles.stepQtyText}>{item.cantidad}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleIncrement(idx)}
                      style={styles.stepBtn}
                    >
                      <Plus size={14} color={colors.primary[700]} strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeFromCarrito(idx)}
                    style={styles.deleteItemBtn}
                  >
                    <Trash2 size={16} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {carrito.length === 0 && (
            <View style={styles.emptyCartWrap}>
              <Text style={styles.emptyCartText}>No hay productos en el carrito.</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.emptyCartBackBtn}
              >
                <Text style={styles.emptyCartBackBtnText}>← Volver al catálogo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {carrito.length > 0 && (
          <>
            {/* Método de Pago Rápido (Un Toque) */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionHeading}>Forma de pago</Text>

              <View style={styles.paymentChipsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMetodoSeleccionado('Efectivo')}
                  style={[
                    styles.paymentChip,
                    metodoSeleccionado === 'Efectivo' && styles.paymentChipActive,
                  ]}
                >
                  <Banknote
                    size={16}
                    color={
                      metodoSeleccionado === 'Efectivo'
                        ? colors.neutral[0]
                        : colors.success[700]
                    }
                  />
                  <Text
                    style={[
                      styles.paymentChipText,
                      metodoSeleccionado === 'Efectivo' && styles.paymentChipTextActive,
                    ]}
                  >
                    Efectivo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMetodoSeleccionado('Transferencia')}
                  style={[
                    styles.paymentChip,
                    metodoSeleccionado === 'Transferencia' && styles.paymentChipActive,
                  ]}
                >
                  <Smartphone
                    size={16}
                    color={
                      metodoSeleccionado === 'Transferencia'
                        ? colors.neutral[0]
                        : colors.primary[700]
                    }
                  />
                  <Text
                    style={[
                      styles.paymentChipText,
                      metodoSeleccionado === 'Transferencia' && styles.paymentChipTextActive,
                    ]}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMetodoSeleccionado('Tarjeta')}
                  style={[
                    styles.paymentChip,
                    metodoSeleccionado === 'Tarjeta' && styles.paymentChipActive,
                  ]}
                >
                  <CreditCard
                    size={16}
                    color={
                      metodoSeleccionado === 'Tarjeta'
                        ? colors.neutral[0]
                        : colors.neutral[700]
                    }
                  />
                  <Text
                    style={[
                      styles.paymentChipText,
                      metodoSeleccionado === 'Tarjeta' && styles.paymentChipTextActive,
                    ]}
                  >
                    Tarjeta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMetodoSeleccionado('Crédito')}
                  style={[
                    styles.paymentChip,
                    metodoSeleccionado === 'Crédito' && styles.paymentChipActive,
                  ]}
                >
                  <CreditCard
                    size={16}
                    color={
                      metodoSeleccionado === 'Crédito'
                        ? colors.neutral[0]
                        : colors.warning[700]
                    }
                  />
                  <Text
                    style={[
                      styles.paymentChipText,
                      metodoSeleccionado === 'Crédito' && styles.paymentChipTextActive,
                    ]}
                  >
                    Crédito
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMetodoSeleccionado('Combinado')}
                  style={[
                    styles.paymentChip,
                    metodoSeleccionado === 'Combinado' && styles.paymentChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentChipText,
                      metodoSeleccionado === 'Combinado' && styles.paymentChipTextActive,
                    ]}
                  >
                    Combinado
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Si es Combinado, mostrar inputs para desglosar */}
              {metodoSeleccionado === 'Combinado' && (
                <View style={styles.combinedBox}>
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Efectivo ($)</Text>
                    <TextInput
                      style={styles.splitInput}
                      keyboardType="numeric"
                      value={efectivo}
                      onChangeText={setEfectivo}
                      placeholder="0.00"
                    />
                  </View>
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Transferencia ($)</Text>
                    <TextInput
                      style={styles.splitInput}
                      keyboardType="numeric"
                      value={transferencia}
                      onChangeText={setTransferencia}
                      placeholder="0.00"
                    />
                  </View>
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Tarjeta ($)</Text>
                    <TextInput
                      style={styles.splitInput}
                      keyboardType="numeric"
                      value={tarjeta}
                      onChangeText={setTarjeta}
                      placeholder="0.00"
                    />
                  </View>
                  <View style={styles.splitRow}>
                    <Text style={styles.splitLabel}>Crédito ($)</Text>
                    <TextInput
                      style={styles.splitInput}
                      keyboardType="numeric"
                      value={credito}
                      onChangeText={setCredito}
                      placeholder="0.00"
                    />
                  </View>
                </View>
              )}

              {/* Mensajes de advertencia de pago */}
              {!pagoCompleto && (
                <View style={styles.paymentAlertRow}>
                  <AlertCircle size={15} color={colors.error[600]} />
                  <Text style={styles.paymentAlertText}>
                    Faltan {formatCurrency(diferencia)} por cubrir
                  </Text>
                </View>
              )}

              {excedeCredito && (
                <View style={styles.paymentAlertRow}>
                  <AlertCircle size={15} color={colors.warning[700]} />
                  <Text style={styles.paymentAlertText}>
                    Excede límite de crédito ({formatCurrency(limiteCredito)})
                  </Text>
                </View>
              )}
            </View>

            {/* Resumen Total */}
            <View style={[styles.totalCard, shadows.card]}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL DE LA VENTA</Text>
                <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
              </View>
              <Text style={styles.totalSub}>
                Método: <Text style={{ fontWeight: '700' }}>{metodoSeleccionado}</Text>
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Botón Flotante Confirmar Venta */}
      {carrito.length > 0 && (
        <View style={styles.confirmBottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleConfirmarVenta}
            disabled={isSubmitting || !pagoCompleto || excedeCredito}
            style={[
              styles.confirmBtn,
              (isSubmitting || !pagoCompleto || excedeCredito) && styles.confirmBtnDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.neutral[0]} size="small" />
            ) : (
              <>
                <CheckCircle2 size={20} color={colors.neutral[0]} strokeWidth={2.4} />
                <Text style={styles.confirmBtnText}>Confirmar venta ({formatCurrency(total)})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 14 : 12,
    paddingBottom: 10,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 1,
  },
  trashCartBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 14,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  clientSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 18,
  },
  itemDetail: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 11.5,
    color: colors.neutral[600],
    marginTop: 4,
  },
  itemSubtotalBold: {
    fontWeight: '800',
    color: colors.primary[700],
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
  },
  stepQtyBox: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary[900],
  },
  deleteItemBtn: {
    padding: 4,
  },
  emptyCartWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyCartText: {
    fontSize: 13,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  emptyCartBackBtn: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  emptyCartBackBtnText: {
    color: colors.neutral[0],
    fontWeight: '700',
    fontSize: 12.5,
  },

  /* Sección Pagos */
  paymentSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 14,
  },
  paymentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  paymentChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  paymentChipTextActive: {
    color: colors.neutral[0],
  },
  combinedBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  splitInput: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 100,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  paymentAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  paymentAlertText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.error[600],
  },

  /* Total */
  totalCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.neutral[700],
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary[800],
  },
  totalSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },

  /* Barra inferior de confirmación */
  confirmBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success[600],
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.neutral[400],
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutral[0],
  },
});
