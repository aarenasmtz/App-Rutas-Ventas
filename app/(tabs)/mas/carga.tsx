import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { cargaInicial, totalCargaInicial } from '@/constants/mockData';
import { Card, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import { DataService } from '@/services/mockDataService';
import type { Producto } from '@/types';

export default function CargaScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmada, setConfirmada] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const prs = await DataService.getProductos();
        if (isMounted && prs && prs.length > 0) setProductosList(prs);
      } catch { }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const items = productosList.length > 0 
    ? productosList.map(p => ({
        productoId: p.id,
        producto: p.nombre,
        cantidad: p.existencia,
        unidad: 'pzas',
        costo: p.precioCompra || Math.round(p.precioBase * 0.72),
        importe: p.existencia * (p.precioCompra || Math.round(p.precioBase * 0.72)),
      }))
    : cargaInicial;

  const totalCarga = items.reduce((s, it) => s + it.importe, 0);

  const handleConfirmarCarga = async () => {
    setConfirmando(true);
    try {
      await DataService.confirmarCargaInicial({
        empleadoId: user?.id || '1',
        ubicacionDestino: user?.rutaNombre ? `Camioneta (${user.rutaNombre})` : 'Camioneta 1',
        esEntradaMercancia: false, // Verificación matutina de checklist en ruta, NO incremento de existencias globales
        lotes: items.map(it => ({
          productoId: (it as any).productoId || 'p1',
          piezas: it.cantidad,
        })),
      });
      setConfirmada(true);
      Alert.alert('Verificación completada', 'Inventario en camioneta auditado y verificado para la ruta de hoy.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo confirmar la carga');
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Carga del día" subtitle="Mercancía en camioneta" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}><Truck size={28} color={colors.neutral[0]} /></View>
          <View>
            <Text style={styles.headerLabel}>Costo total de inventario en ruta</Text>
            <Text style={styles.headerValue}>{formatCurrency(totalCarga)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Producto</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Costo</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>Importe</Text>
        </View>

        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCellName, { flex: 2 }]}>{item.producto}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.cantidad} {item.unidad}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.costo)}</Text>
            <Text style={[styles.tableCellBold, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(item.importe)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalCarga)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, confirmada && { backgroundColor: colors.success[600] }]} 
          onPress={handleConfirmarCarga}
          disabled={confirmando || confirmada}
        >
          {confirmando ? (
            <ActivityIndicator color={colors.neutral[0]} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color={colors.neutral[0]} />
              <Text style={styles.confirmBtnText}>
                {confirmada ? '✓ Inventario en ruta auditado' : 'Verificar inventario en camioneta'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary[700], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  headerIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  headerValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.xs },
  tableHeader: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: colors.neutral[200] },
  tableHeaderText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.neutral[500] },
  tableRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, borderBottomWidth: 1, borderBottomColor: colors.neutral[100], backgroundColor: colors.neutral[0] },
  tableCellName: { fontSize: fontSize.sm, color: colors.neutral[700], flex: 2 },
  tableCell: { fontSize: fontSize.sm, color: colors.neutral[500] },
  tableCellBold: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primary[50], paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary[700] },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary[700] },
  confirmBtn: { backgroundColor: colors.primary[600], margin: spacing.md, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
