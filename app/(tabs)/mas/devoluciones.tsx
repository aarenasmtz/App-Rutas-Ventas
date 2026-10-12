import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, RotateCcw } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getEstadoColor } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import { DataService, mockClientes, mockProductos } from '@/services/mockDataService';
import type { Cliente, Producto } from '@/types';

const motivos = ['Producto dañado', 'Caducidad', 'Cambio', 'Pedido incorrecto', 'Otro'];
const destinos = ['Inventario', 'Merma', 'Cambio'] as const;

export default function DevolucionesScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [step, setStep] = useState<'lista' | 'nueva'>('lista');
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [devolucionesList, setDevolucionesList] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [productoId, setProductoId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [destino, setDestino] = useState<typeof destinos[number] | null>(null);
  const [registrada, setRegistrada] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const devs = await DataService.getDevoluciones();
      if (devs) setDevolucionesList(devs);
      const cls = await DataService.getClientes();
      if (cls && cls.length > 0) setClientesList(cls);
      const prs = await DataService.getProductos();
      if (prs && prs.length > 0) setProductosList(prs);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reset = () => {
    setStep('lista');
    setClienteId(null);
    setProductoId(null);
    setCantidad('');
    setMotivo(null);
    setDestino(null);
    setRegistrada(false);
  };

  const handleRegistrar = async () => {
    if (!clienteId || !productoId || !motivo || !destino) {
      Alert.alert('Completa todos los campos');
      return;
    }
    const cant = parseFloat(cantidad) || 0;
    if (cant <= 0) {
      Alert.alert('Ingresa una cantidad válida');
      return;
    }

    const prod = productosList.find((p) => p.id === productoId);
    const cli = clientesList.find((c) => c.id === clienteId);
    const precio = prod?.precioBase || 0;

    setLoading(true);
    try {
      await DataService.registrarDevolucion({
        clienteId,
        empleadoId: user?.id || '1',
        productoId,
        cantidad: cant,
        presentacionTipo: 'pieza',
        precioUnitario: precio,
        total: cant * precio,
        motivo,
        destino,
        metodoReembolso: 'SaldoAFavor',
        observaciones: `Devolución de ${cli?.nombre || ''}`,
      });
      await loadData();
      setRegistrada(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar la devolución');
    } finally {
      setLoading(false);
    }
  };

  if (registrada) {
    const cliente = clientesList.find((c) => c.id === clienteId);
    const producto = productosList.find((p) => p.id === productoId);
    return (
      <View style={styles.container}>
        <ScreenHeader title="Devolución" onBack={() => router.back()} />
        <View style={styles.confirmContent}>
          <View style={styles.successIcon}><Check size={56} color={colors.success[600]} /></View>
          <Text style={styles.confirmTitle}>¡Devolución registrada en base de datos!</Text>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Cliente</Text><Text style={styles.confirmValue}>{cliente?.nombre}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Producto</Text><Text style={styles.confirmValue}>{producto?.nombre}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Cantidad</Text><Text style={styles.confirmValue}>{cantidad} {producto?.unidad || 'piezas'}</Text></View>
            <View style={styles.confirmRow}><Text style={styles.confirmLabel}>Motivo</Text><Text style={styles.confirmValue}>{motivo}</Text></View>
            <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}><Text style={styles.confirmLabel}>Destino</Text><Text style={styles.confirmValue}>{destino}</Text></View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={reset}>
            <Text style={styles.confirmBtnText}>Registrar otra devolución</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'nueva') {
    const cliente = clientesList.find((c) => c.id === clienteId);
    const producto = productosList.find((p) => p.id === productoId);
    return (
      <View style={styles.container}>
        <ScreenHeader title="Nueva devolución" onBack={() => setStep('lista')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.sectionLabel}>1. Cliente</Text>
          {cliente ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedText}>{cliente.nombre}</Text>
              <TouchableOpacity onPress={() => setClienteId(null)}><Text style={styles.changeText}>Cambiar</Text></TouchableOpacity>
            </View>
          ) : (
            clientesList.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setClienteId(c.id)}>
                <View style={styles.optionCard}><Text style={styles.optionText}>{c.nombre}</Text></View>
              </TouchableOpacity>
            ))
          )}

          {cliente && (
            <>
              <Text style={styles.sectionLabel}>2. Producto</Text>
              {producto ? (
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedText}>{producto.nombre}</Text>
                  <TouchableOpacity onPress={() => setProductoId(null)}><Text style={styles.changeText}>Cambiar</Text></TouchableOpacity>
                </View>
              ) : (
                productosList.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => setProductoId(p.id)}>
                    <View style={styles.optionCard}>
                      <Text style={styles.optionText}>{p.nombre}</Text>
                      <Text style={styles.optionSub}>{p.existencia} {p.unidad || 'pzas'} disp.</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {producto && (
            <>
              <Text style={styles.sectionLabel}>3. Cantidad ({producto.unidad || 'piezas'})</Text>
              <View style={styles.qtyInputWrap}>
                <TextInput style={styles.qtyInput} placeholder="0" placeholderTextColor={colors.neutral[300]} value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />
                <Text style={styles.qtyUnit}>{producto.unidad || 'piezas'}</Text>
              </View>

              <Text style={styles.sectionLabel}>4. Motivo</Text>
              <View style={styles.optionsWrap}>
                {motivos.map((m) => (
                  <TouchableOpacity key={m} style={[styles.optChip, motivo === m && styles.optChipActive]} onPress={() => setMotivo(m)}>
                    <Text style={[styles.optChipText, motivo === m && styles.optChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>5. Destino</Text>
              <View style={styles.destinosRow}>
                {destinos.map((d) => (
                  <TouchableOpacity key={d} style={[styles.destinoBtn, destino === d && styles.destinoBtnActive]} onPress={() => setDestino(d)}>
                    <Text style={[styles.destinoText, destino === d && styles.destinoTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.registrarBtn} onPress={handleRegistrar}>
                <RotateCcw size={20} color={colors.neutral[0]} />
                <Text style={styles.registrarBtnText}>Registrar devolución</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  const itemsToRender = devolucionesList;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Devoluciones" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity style={styles.nuevaBtn} onPress={() => setStep('nueva')}>
          <RotateCcw size={20} color={colors.neutral[0]} />
          <Text style={styles.nuevaBtnText}>Nueva devolución</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Historial de devoluciones</Text>
        {itemsToRender.map((d: any) => {
          const clienteNombre = d.clienteNombre || d.cliente || 'Cliente';
          const productoNombre = d.productoNombre || d.producto || 'Producto';
          const destinoLabel = d.destino || 'Merma';
          const fechaStr = d.fechaHora ? new Date(d.fechaHora).toLocaleDateString() : d.fecha || 'Hoy';

          return (
            <Card key={d.id || d.folio} style={styles.devCard}>
              <View style={styles.devTop}>
                <Text style={styles.devCliente}>{clienteNombre}</Text>
                <Badge label={destinoLabel} color={destinoLabel === 'Merma' ? 'rojo' : destinoLabel === 'Cambio' ? 'amber' : 'verde'} />
              </View>
              <Text style={styles.devProducto}>{d.cantidad} {d.presentacionTipo || d.unidad || 'pzas'} · {productoNombre}</Text>
              <View style={styles.devBottom}>
                <Text style={styles.devMotivo}>{d.motivo}</Text>
                <Text style={styles.devFecha}>{fechaStr}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  nuevaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary[600], margin: spacing.md, borderRadius: radius.md, paddingVertical: spacing.md + 2 },
  nuevaBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, padding: spacing.md, ...shadows.card },
  optionText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  optionSub: { fontSize: fontSize.xs, color: colors.neutral[400] },
  selectedCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary[50], marginHorizontal: spacing.md, borderRadius: radius.md, padding: spacing.md, borderWidth: 2, borderColor: colors.primary[600] },
  selectedText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.primary[700] },
  changeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary[600] },
  qtyInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderWidth: 2, borderColor: colors.primary[600], ...shadows.card },
  qtyInput: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  qtyUnit: { fontSize: fontSize.sm, color: colors.neutral[400] },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  optChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.neutral[100] },
  optChipActive: { backgroundColor: colors.primary[600] },
  optChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  optChipTextActive: { color: colors.neutral[0] },
  destinosRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md },
  destinoBtn: { flex: 1, backgroundColor: colors.neutral[100], borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  destinoBtnActive: { backgroundColor: colors.primary[600] },
  destinoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  destinoTextActive: { color: colors.neutral[0] },
  registrarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.error[500], marginHorizontal: spacing.md, marginTop: spacing.lg, borderRadius: radius.md, paddingVertical: spacing.md + 2 },
  registrarBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
  devCard: { marginBottom: spacing.sm },
  devTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs + 2 },
  devCliente: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  devProducto: { fontSize: fontSize.sm, color: colors.neutral[600] },
  devBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.neutral[100], paddingTop: spacing.sm },
  devMotivo: { fontSize: fontSize.xs, color: colors.neutral[500] },
  devFecha: { fontSize: fontSize.xs, color: colors.neutral[400] },
  confirmContent: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  successIcon: { marginBottom: spacing.md },
  confirmTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  confirmCard: { backgroundColor: colors.neutral[0], width: '100%', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.card },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm - 2, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  confirmLabel: { fontSize: fontSize.sm, color: colors.neutral[500] },
  confirmValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  confirmBtn: { backgroundColor: colors.primary[600], width: '100%', borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  confirmBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
