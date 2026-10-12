import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, ShoppingCart, Wallet, RotateCcw, Navigation, Phone, Calendar, FileText, Clock, ExternalLink } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockClientes, mockProductos, DataService } from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getEstadoColor, getRutaDiaActual } from '@/utils/helpers';
import type { Cliente } from '@/types';

type Tab = 'resumen' | 'sugerido' | 'historial' | 'cuenta';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setClienteActivoId } = useApp();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(() => {
    return mockClientes.find((c) => c.id === id) || null;
  });
  const [tab, setTab] = useState<Tab>('resumen');

  useEffect(() => {
    const fetchLiveCliente = async () => {
      try {
        setLoading(true);
        const live = await DataService.getClienteById(id);
        if (live) {
          setCliente(live);
        } else {
          const list = await DataService.getClientes();
          const found = list.find((c) => c.id === id);
          if (found) setCliente(found);
        }
      } catch {
        // Keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchLiveCliente();
  }, [id]);

  if (loading && !cliente) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={{ marginTop: spacing.md, color: colors.neutral[600] }}>Cargando cliente...</Text>
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Cliente no encontrado" onBack={() => router.back()} />
        <View style={[styles.center, { padding: spacing.xl }]}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: colors.neutral[800], marginBottom: spacing.sm }}>
            No se encontró el registro
          </Text>
          <Text style={{ color: colors.neutral[500], textAlign: 'center', marginBottom: spacing.lg }}>
            El cliente solicitado no existe o fue dado de baja.
          </Text>
          <TouchableOpacity
            style={[styles.agregarSugeridosBtn, { backgroundColor: colors.primary[600] }]}
            onPress={() => router.back()}
          >
            <Text style={styles.agregarSugeridosText}>Volver a la lista</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const saldo = cliente.saldo ?? 0;
  const limiteCredito = cliente.limiteCredito ?? 0;
  const creditoDisponible = Math.max(0, limiteCredito - saldo);
  const diasVisitaTexto = Array.isArray(cliente.diasVisita) && cliente.diasVisita.length > 0
    ? cliente.diasVisita.join(' - ')
    : 'Lunes a Viernes';

  const handleVender = () => {
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/venta');
  };

  const handleCobrar = () => {
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/mas/cobranza');
  };

  const handleOpenGpsNavegacion = () => {
    const lat = cliente.latitud;
    const lng = cliente.longitud;
    if (lat && lng) {
      // Abre navegación directa punto por punto a este cliente
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    } else {
      const query = encodeURIComponent(`${cliente.nombre}, ${cliente.direccion}, ${cliente.colonia || 'León'}, Guanajuato`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={cliente.nombre}
        subtitle={cliente.propietario || cliente.colonia || 'León, Gto'}
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(cliente.nombre || 'C').charAt(0)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{cliente.nombre}</Text>
              <Text style={styles.owner}>Propietario: {cliente.propietario || 'No especificado'}</Text>
              {cliente.telefono ? (
                <View style={styles.addressRow}>
                  <Phone size={13} color={colors.primary[600]} />
                  <Text style={[styles.addressText, { color: colors.primary[700], fontWeight: '600' }]}>{cliente.telefono}</Text>
                </View>
              ) : null}
              <View style={styles.diasRow}>
                <Calendar size={13} color={colors.neutral[400]} />
                <Text style={styles.diasText}>Visita: {diasVisitaTexto}</Text>
              </View>
              <View style={styles.addressRow}>
                <MapPin size={13} color={colors.neutral[400]} />
                <Text style={styles.addressText}>
                  {cliente.direccion}
                  {cliente.colonia ? ` · Col. ${cliente.colonia}` : ''}
                </Text>
              </View>
              {cliente.latitud && cliente.longitud && (
                <View style={[styles.addressRow, { marginTop: 4 }]}>
                  <Navigation size={12} color={colors.success[600]} />
                  <Text style={[styles.addressText, { color: colors.success[700], fontSize: 11, fontWeight: '600' }]}>
                    GPS: {cliente.latitud.toFixed(5)}, {cliente.longitud.toFixed(5)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Saldo actual</Text>
              <Text style={[styles.balanceValue, { color: saldo > 0 ? colors.error[600] : colors.success[600] }]}>
                {formatCurrency(saldo)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Crédito disponible</Text>
              <Text style={styles.balanceValue}>{formatCurrency(creditoDisponible)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Límite crédito</Text>
              <Text style={styles.balanceValue}>{formatCurrency(limiteCredito)}</Text>
            </View>
          </View>

          {/* Última compra y último pago */}
          <View style={styles.recentActivityRow}>
            <View style={styles.activityItem}>
              <Clock size={12} color={colors.neutral[400]} />
              <Text style={styles.activityText}>Última compra: <Text style={{ fontWeight: '600', color: colors.neutral[800] }}>{cliente.ultimaCompra || 'Sin registro'}</Text></Text>
            </View>
            <View style={styles.activityItem}>
              <Wallet size={12} color={colors.success[600]} />
              <Text style={styles.activityText}>Último pago: <Text style={{ fontWeight: '600', color: colors.success[700] }}>{cliente.ultimoPago || 'Sin registro'}</Text></Text>
            </View>
          </View>
        </View>

        {/* Acciones principales: Vender, Cobrar, Navegar GPS, Estado de cuenta */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleVender}>
            <View style={styles.actionIcon}><ShoppingCart size={22} color={colors.neutral[0]} /></View>
            <Text style={[styles.actionText, { color: colors.primary[700], fontWeight: 'bold' }]}>Vender</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleCobrar}>
            <View style={[styles.actionIcon, { backgroundColor: colors.success[600] }]}><Wallet size={22} color={colors.neutral[0]} /></View>
            <Text style={[styles.actionText, { color: colors.success[700], fontWeight: 'bold' }]}>Cobrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleOpenGpsNavegacion}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary[600] }]}><Navigation size={22} color={colors.neutral[0]} /></View>
            <Text style={[styles.actionText, { color: colors.primary[700], fontWeight: 'bold' }]}>Ir en GPS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/ruta/mapa')}>
            <View style={[styles.actionIcon, { backgroundColor: colors.neutral[700] }]}><MapPin size={22} color={colors.neutral[0]} /></View>
            <Text style={styles.actionText}>Ver Mapa</Text>
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

function ResumenTab({ cliente }: { cliente: Cliente }) {
  const diasTexto = Array.isArray(cliente.diasVisita) && cliente.diasVisita.length > 0
    ? cliente.diasVisita.join(' - ')
    : 'Lunes a Viernes';
  const historial = Array.isArray(cliente.historial) ? cliente.historial : [];
  const totalVentasHistorial = historial.reduce((s: number, h) => s + (h.total || 0), 0);

  return (
    <View style={styles.tabInner}>
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Estado del cliente</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estado de visita</Text>
          <Badge label={cliente.estado || 'Pendiente'} color={getEstadoColor(cliente.estado || 'Pendiente')} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Última visita</Text>
          <Text style={styles.summaryValue}>{cliente.ultimaVisita || 'Hoy'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Días de visita</Text>
          <Text style={styles.summaryValue}>{diasTexto}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ruta asignada</Text>
          <Text style={styles.summaryValue}>{cliente.ruta || getRutaDiaActual()}</Text>
        </View>
      </Card>

      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen financiero</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total ventas registradas</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalVentasHistorial)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas al crédito</Text>
          <Text style={styles.summaryValue}>{historial.filter((h) => h.estado === 'Crédito').length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas pagadas</Text>
          <Text style={[styles.summaryValue, { color: colors.success[600] }]}>{historial.filter((h) => h.estado === 'Pagado').length}</Text>
        </View>
      </Card>
    </View>
  );
}

function SugeridoTab({ cliente }: { cliente: Cliente }) {
  const sugeridos = Array.isArray(cliente.sugerido) ? cliente.sugerido : [];

  if (sugeridos.length === 0) {
    return (
      <Card style={styles.emptyTab}>
        <Text style={styles.emptyText}>No hay productos sugeridos configurados para este cliente.</Text>
      </Card>
    );
  }
  return (
    <View style={styles.tabInner}>
      <Text style={styles.sugeridoTitle}>Sugerido para hoy</Text>
      {sugeridos.map((s) => {
        const producto = mockProductos.find((p) => p.id === s.productoId);
        if (!producto) return null;
        return (
          <Card key={s.productoId} style={styles.sugeridoCard}>
            <View style={styles.sugeridoLeft}>
              <View style={styles.sugeridoIcon}>
                <Text style={styles.sugeridoIconText}>{(producto.categoria || 'G').charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.sugeridoName}>{producto.nombre}</Text>
                <Text style={styles.sugeridoFreq}>{s.frecuencia}</Text>
                <Text style={styles.sugeridoQty}>{s.cantidad} {producto.unidad}</Text>
              </View>
            </View>
            <Text style={styles.sugeridoPrice}>{formatCurrency((producto.precioBase || 0) * s.cantidad)}</Text>
          </Card>
        );
      })}
      <TouchableOpacity style={styles.agregarSugeridosBtn}>
        <Text style={styles.agregarSugeridosText}>Agregar sugeridos al pedido</Text>
      </TouchableOpacity>
    </View>
  );
}

function HistorialTab({ cliente }: { cliente: Cliente }) {
  const historial = Array.isArray(cliente.historial) ? cliente.historial : [];

  if (historial.length === 0) {
    return (
      <Card style={styles.emptyTab}>
        <Text style={styles.emptyText}>Sin historial de ventas registradas.</Text>
      </Card>
    );
  }
  return (
    <View style={styles.tabInner}>
      {historial.map((h) => (
        <Card key={h.id} style={styles.historialCard}>
          <View style={styles.historialTop}>
            <Text style={styles.historialDate}>{h.fecha}</Text>
            <Badge label={h.estado} color={getEstadoColor(h.estado)} />
          </View>
          <View style={styles.historialItems}>
            {(h.items || []).map((item, i) => (
              <Text key={i} style={styles.historialItem}>• {item.cantidad} {item.unidad} {item.productoNombre}</Text>
            ))}
          </View>
          <Text style={styles.historialTotal}>Total: {formatCurrency(h.total || 0)}</Text>
        </Card>
      ))}
    </View>
  );
}

function CuentaTab({ cliente }: { cliente: Cliente }) {
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
  recentActivityRow: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activityText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
});
