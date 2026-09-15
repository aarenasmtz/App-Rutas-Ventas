import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, ShoppingCart, Wallet, RotateCcw, Navigation, Phone, Calendar } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { clientes, productos } from '@/constants/mockData';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getEstadoColor } from '@/utils/helpers';

type Tab = 'resumen' | 'sugerido' | 'historial' | 'cuenta';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cliente = clientes.find((c) => c.id === id);
  const [tab, setTab] = useState<Tab>('resumen');

  if (!cliente) {
    return (
      <View style={styles.center}>
        <Text>Cliente no encontrado</Text>
      </View>
    );
  }

  const creditoDisponible = cliente.limiteCredito - cliente.saldo;

  return (
    <View style={styles.container}>
      <ScreenHeader title={cliente.nombre} subtitle={cliente.propietario} onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{cliente.nombre.charAt(0)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{cliente.nombre}</Text>
              <Text style={styles.owner}>Propietario: {cliente.propietario}</Text>
              <View style={styles.diasRow}>
                <Calendar size={14} color={colors.neutral[400]} />
                <Text style={styles.diasText}>Visita: {cliente.diasVisita.join(' - ')}</Text>
              </View>
              <View style={styles.addressRow}>
                <MapPin size={14} color={colors.neutral[400]} />
                <Text style={styles.addressText}>{cliente.direccion}</Text>
              </View>
            </View>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Saldo actual</Text>
              <Text style={[styles.balanceValue, { color: cliente.saldo > 0 ? colors.error[600] : colors.success[600] }]}>
                {formatCurrency(cliente.saldo)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Crédito disponible</Text>
              <Text style={styles.balanceValue}>{formatCurrency(creditoDisponible)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Límite</Text>
              <Text style={styles.balanceValue}>{formatCurrency(cliente.limiteCredito)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/venta')}>
            <View style={styles.actionIcon}><ShoppingCart size={22} color={colors.primary[600]} /></View>
            <Text style={styles.actionText}>Nueva venta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/mas/cobranza')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.success[50] }]}><Wallet size={22} color={colors.success[600]} /></View>
            <Text style={styles.actionText}>Cobrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/mas/devoluciones')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.warning[50] }]}><RotateCcw size={22} color={colors.warning[600]} /></View>
            <Text style={styles.actionText}>Devolución</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/ruta/mapa')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary[50] }]}><Navigation size={22} color={colors.primary[600]} /></View>
            <Text style={styles.actionText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {(['resumen', 'sugerido', 'historial', 'cuenta'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'sugerido' ? 'Pedido sugerido' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'resumen' && <ResumenTab cliente={cliente} />}
          {tab === 'sugerido' && <SugeridoTab cliente={cliente} />}
          {tab === 'historial' && <HistorialTab cliente={cliente} />}
          {tab === 'cuenta' && <CuentaTab cliente={cliente} />}
        </View>
      </ScrollView>
    </View>
  );
}

function ResumenTab({ cliente }: { cliente: typeof clientes[0] }) {
  return (
    <View style={styles.tabInner}>
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Estado del cliente</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estado de visita</Text>
          <Badge label={cliente.estado} color={getEstadoColor(cliente.estado)} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Última visita</Text>
          <Text style={styles.summaryValue}>{cliente.ultimaVisita}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Días de visita</Text>
          <Text style={styles.summaryValue}>{cliente.diasVisita.join(' - ')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ruta asignada</Text>
          <Text style={styles.summaryValue}>{cliente.ruta}</Text>
        </View>
      </Card>

      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen financiero</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total ventas (últimas 5)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(cliente.historial.reduce((s, h) => s + h.total, 0))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas al crédito</Text>
          <Text style={styles.summaryValue}>{cliente.historial.filter((h) => h.estado === 'Crédito').length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas pagadas</Text>
          <Text style={[styles.summaryValue, { color: colors.success[600] }]}>{cliente.historial.filter((h) => h.estado === 'Pagado').length}</Text>
        </View>
      </Card>
    </View>
  );
}

function SugeridoTab({ cliente }: { cliente: typeof clientes[0] }) {
  if (cliente.sugerido.length === 0) {
    return (
      <Card style={styles.emptyTab}>
        <Text style={styles.emptyText}>No hay productos sugeridos para este cliente.</Text>
      </Card>
    );
  }
  return (
    <View style={styles.tabInner}>
      <Text style={styles.sugeridoTitle}>Sugerido para hoy</Text>
      {cliente.sugerido.map((s) => {
        const producto = productos.find((p) => p.id === s.productoId);
        if (!producto) return null;
        return (
          <Card key={s.productoId} style={styles.sugeridoCard}>
            <View style={styles.sugeridoLeft}>
              <View style={styles.sugeridoIcon}>
                <Text style={styles.sugeridoIconText}>{producto.categoria.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.sugeridoName}>{producto.nombre}</Text>
                <Text style={styles.sugeridoFreq}>{s.frecuencia}</Text>
                <Text style={styles.sugeridoQty}>{s.cantidad} {producto.unidad}</Text>
              </View>
            </View>
            <Text style={styles.sugeridoPrice}>{formatCurrency(producto.precioBase * s.cantidad)}</Text>
          </Card>
        );
      })}
      <TouchableOpacity style={styles.agregarSugeridosBtn}>
        <Text style={styles.agregarSugeridosText}>Agregar sugeridos al pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

function HistorialTab({ cliente }: { cliente: typeof clientes[0] }) {
  if (cliente.historial.length === 0) {
    return (
      <Card style={styles.emptyTab}>
        <Text style={styles.emptyText}>Sin historial de ventas.</Text>
      </Card>
    );
  }
  return (
    <View style={styles.tabInner}>
      {cliente.historial.map((h) => (
        <Card key={h.id} style={styles.historialCard}>
          <View style={styles.historialTop}>
            <Text style={styles.historialDate}>{h.fecha}</Text>
            <Badge label={h.estado} color={getEstadoColor(h.estado)} />
          </View>
          <View style={styles.historialItems}>
            {h.items.map((item, i) => (
              <Text key={i} style={styles.historialItem}>• {item.cantidad} {item.unidad} {item.productoNombre}</Text>
            ))}
          </View>
          <Text style={styles.historialTotal}>Total: {formatCurrency(h.total)}</Text>
        </Card>
      ))}
    </View>
  );
}

function CuentaTab({ cliente }: { cliente: typeof clientes[0] }) {
  const movimientos = [
    { fecha: '2026-09-15', concepto: 'Abono en efectivo', monto: -500, tipo: 'abono' },
    { fecha: '2026-09-11', concepto: 'Venta a crédito', monto: 2350, tipo: 'cargo' },
    { fecha: '2026-09-08', concepto: 'Abono en efectivo', monto: -1820, tipo: 'abono' },
    { fecha: '2026-09-04', concepto: 'Venta a crédito', monto: 2150, tipo: 'cargo' },
    { fecha: '2026-09-01', concepto: 'Abono en efectivo', monto: -3200, tipo: 'abono' },
    { fecha: '2026-08-28', concepto: 'Venta a crédito', monto: 1950, tipo: 'cargo' },
  ];
  return (
    <View style={styles.tabInner}>
      <Card style={styles.cuentaCard}>
        <View style={styles.cuentaHeader}>
          <Text style={styles.cuentaTitle}>Estado de cuenta</Text>
          <Text style={[styles.cuentaSaldo, { color: cliente.saldo > 0 ? colors.error[600] : colors.success[600] }]}>
            {formatCurrency(cliente.saldo)}
          </Text>
        </View>
        {movimientos.map((m, i) => (
          <View key={i} style={styles.cuentaRow}>
            <View>
              <Text style={styles.cuentaConcepto}>{m.concepto}</Text>
              <Text style={styles.cuentaFecha}>{m.fecha}</Text>
            </View>
            <Text style={[styles.cuentaMonto, { color: m.tipo === 'cargo' ? colors.error[600] : colors.success[600] }]}>
              {m.tipo === 'cargo' ? '+' : '-'}{formatCurrency(Math.abs(m.monto))}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: colors.neutral[0],
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  owner: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  diasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  diasText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  addressText: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    flex: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  balanceValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.neutral[0],
  },
  tabContent: {
    paddingHorizontal: spacing.md,
  },
  tabInner: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  summaryCard: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md - 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  emptyTab: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  sugeridoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  sugeridoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  sugeridoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sugeridoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugeridoIconText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  sugeridoName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  sugeridoFreq: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    marginTop: 2,
  },
  sugeridoQty: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sugeridoPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  agregarSugeridosBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  agregarSugeridosText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  historialCard: {
    padding: spacing.md,
  },
  historialTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historialDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  historialItems: {
    gap: 3,
    marginBottom: spacing.sm,
  },
  historialItem: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  historialTotal: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.sm,
  },
  cuentaCard: {
    padding: spacing.md,
  },
  cuentaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    marginBottom: spacing.sm,
  },
  cuentaTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  cuentaSaldo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  cuentaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  cuentaConcepto: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  cuentaFecha: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
  cuentaMonto: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
