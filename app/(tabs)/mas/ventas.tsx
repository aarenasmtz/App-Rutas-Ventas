import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  Search,
  Calendar,
  User,
  ShoppingBag,
  DollarSign,
  ChevronRight,
  Printer,
  Share2,
  X,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Clock,
  Boxes,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader, MoneyDisplay, SearchBar } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';
import { ticketPrinter } from '@/services/ticketPrinterService';
import { ticketImageService } from '@/services/ticketImageService';

export default function VentasScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'Hoy' | 'Semana' | 'Todas'>('Hoy');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('Todos');
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null);

  const loadVentas = async () => {
    setLoading(true);
    try {
      const data = await DataService.getVentas(100);
      setVentas(data || []);
    } catch {
      // Fallback handled in mockDataService
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, []);

  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      const clienteNombre = v.cliente?.nombre || v.clienteNombre || '';
      const folio = v.folio || '';
      const matchesSearch =
        clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
        folio.toLowerCase().includes(search.toLowerCase());

      const matchesVendedor =
        filtroVendedor === 'Todos' ||
        (v.usuario?.nombre || 'Miguel').toLowerCase() === filtroVendedor.toLowerCase();

      let matchesFecha = true;
      if (filtroPeriodo === 'Hoy') {
        const fechaVenta = new Date(v.fechaHora).toDateString();
        matchesFecha = fechaVenta === new Date().toDateString();
      }

      return matchesSearch && matchesVendedor && matchesFecha;
    });
  }, [ventas, search, filtroPeriodo, filtroVendedor]);

  // Cálculos de KPIs
  const totalVendido = useMemo(
    () => filteredVentas.reduce((s, v) => s + (v.total || 0), 0),
    [filteredVentas]
  );

  const totalEfectivo = useMemo(() => {
    return filteredVentas.reduce((acc, v) => {
      const pagosEf = (v.pagos || []).filter(
        (p: any) => p.metodo?.toLowerCase().includes('efectivo')
      );
      return acc + pagosEf.reduce((s: number, p: any) => s + p.monto, 0);
    }, 0);
  }, [filteredVentas]);

  const totalCredito = useMemo(() => {
    return filteredVentas.reduce((acc, v) => {
      const pagosCr = (v.pagos || []).filter(
        (p: any) => p.metodo?.toLowerCase().includes('crédito') || p.metodo?.toLowerCase().includes('credito')
      );
      return acc + pagosCr.reduce((s: number, p: any) => s + p.monto, 0);
    }, 0);
  }, [filteredVentas]);

  const handleShareWhatsApp = async (venta: any) => {
    const ticketData = {
      folio: venta.folio,
      fecha: new Date(venta.fechaHora).toLocaleString('es-MX'),
      clienteNombre: venta.cliente?.nombre || 'Cliente General',
      clientePropietario: venta.cliente?.propietario || '',
      clienteDireccion: venta.cliente?.direccion || 'Ruta León',
      vendedorNombre: venta.usuario?.nombre || 'Miguel',
      rutaNombre: venta.cliente?.ruta || 'Ruta Lunes',
      items: (venta.detalles || []).map((d: any) => ({
        productoNombre: d.presentacionNombre ? `${d.presentacionNombre}` : `Producto #${d.productoId}`,
        cantidad: d.cantidadPresentaciones || d.piezasTotales || 1,
        unidad: 'pza',
        precioUnitario: d.precioUnitario || 0,
        subtotal: d.subtotal || 0,
      })),
      total: venta.total,
      pagos: venta.pagos || [{ metodo: 'Efectivo', monto: venta.total }],
      saldoPendiente: 0,
    };

    try {
      await ticketPrinter.shareTicketWhatsAppText(ticketData as any, venta.cliente?.telefono);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const handlePrintPdf = (venta: any) => {
    const ticketData = {
      folio: venta.folio,
      fecha: new Date(venta.fechaHora).toLocaleString('es-MX'),
      clienteNombre: venta.cliente?.nombre || 'Cliente General',
      clientePropietario: venta.cliente?.propietario || '',
      clienteDireccion: venta.cliente?.direccion || 'Ruta León',
      vendedorNombre: venta.usuario?.nombre || 'Miguel',
      rutaNombre: venta.cliente?.ruta || 'Ruta Lunes',
      items: (venta.detalles || []).map((d: any) => ({
        productoNombre: d.presentacionNombre ? `${d.presentacionNombre}` : `Producto #${d.productoId}`,
        cantidad: d.cantidadPresentaciones || d.piezasTotales || 1,
        unidad: 'pza',
        precioUnitario: d.precioUnitario || 0,
        subtotal: d.subtotal || 0,
      })),
      total: venta.total,
      pagos: venta.pagos || [{ metodo: 'Efectivo', monto: venta.total }],
      saldoPendiente: 0,
    };
    ticketPrinter.openPdfPrintTicket(ticketData as any);
  };

  return (
    <AppShell>
      <PageHeader
        title="Detalle de Ventas"
        subtitle="Registro histórico de ventas realizadas"
        onBack={() => router.replace('/(tabs)/mas' as any)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* KPIs Financieros */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: colors.primary[600], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Total Vendido</Text>
            <Text style={styles.kpiValue}>{formatCurrency(totalVendido)}</Text>
            <Text style={styles.kpiSub}>{filteredVentas.length} tickets emitidos</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.success[600], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Cobrado Efectivo</Text>
            <Text style={[styles.kpiValue, { color: colors.success[700] }]}>{formatCurrency(totalEfectivo)}</Text>
            <Text style={styles.kpiSub}>En caja física</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: colors.warning[600], borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>Crédito Colocado</Text>
            <Text style={[styles.kpiValue, { color: colors.warning[700] }]}>{formatCurrency(totalCredito)}</Text>
            <Text style={styles.kpiSub}>Cuentas por cobrar</Text>
          </View>
        </View>

        {/* Buscador */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por cliente, folio (#FOL)..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Filtros de Período y Vendedor */}
        <View style={styles.filterSection}>
          <View style={styles.chipsRow}>
            {(['Hoy', 'Semana', 'Todas'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setFiltroPeriodo(p)}
                style={[styles.filterChip, filtroPeriodo === p && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filtroPeriodo === p && styles.filterChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRowVendedores}>
            {(['Todos', 'Miguel', 'Juan Pérez', 'Pedro Ramírez'] as const).map((vend) => (
              <TouchableOpacity
                key={vend}
                onPress={() => setFiltroVendedor(vend)}
                style={[styles.vendChip, filtroVendedor === vend && styles.vendChipActive]}
              >
                <User size={12} color={filtroVendedor === vend ? '#FFFFFF' : colors.neutral[600]} />
                <Text style={[styles.vendChipText, filtroVendedor === vend && styles.vendChipTextActive]}>
                  {vend}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Ventas */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Cargando historial de ventas...</Text>
          </View>
        ) : filteredVentas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Receipt size={44} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No hay ventas registradas</Text>
            <Text style={styles.emptySub}>
              {search ? 'No se encontraron resultados con ese filtro.' : 'Las ventas realizadas aparecerán aquí automáticamente.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ventasList}>
            {filteredVentas.map((v) => {
              const fechaStr = new Date(v.fechaHora).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
              const vendedorNombre = v.usuario?.nombre || 'Miguel';
              const itemsCount = v.detalles?.length || 0;

              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedVenta(v)}
                  style={[styles.ventaCard, shadows.card]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.folioBadge}>{v.folio || `#${v.id}`}</Text>
                        <Text style={styles.vendedorBadge}>👤 {vendedorNombre}</Text>
                      </View>
                      <Text style={styles.clienteNombre}>{v.cliente?.nombre || 'Cliente General'}</Text>
                      {v.cliente?.propietario ? (
                        <Text style={styles.clienteProp}>{v.cliente.propietario}</Text>
                      ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.totalText}>{formatCurrency(v.total)}</Text>
                      <Text style={styles.horaText}>{fechaStr}</Text>
                    </View>
                  </View>

                  {/* Resumen de items y método de pago */}
                  <View style={styles.cardFooter}>
                    <View style={styles.itemsSummary}>
                      <Boxes size={13} color={colors.neutral[500]} />
                      <Text style={styles.itemsSummaryText}>
                        {itemsCount} {itemsCount === 1 ? 'partida' : 'partidas'}
                      </Text>
                    </View>

                    <View style={styles.pagosBadges}>
                      {(v.pagos || []).map((p: any, idx: number) => {
                        const isCredito = p.metodo?.toLowerCase().includes('cred');
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.pagoBadge,
                              isCredito ? styles.pagoBadgeCredito : styles.pagoBadgeEfectivo,
                            ]}
                          >
                            <Text
                              style={[
                                styles.pagoBadgeText,
                                isCredito ? styles.pagoBadgeTextCredito : styles.pagoBadgeTextEfectivo,
                              ]}
                            >
                              {p.metodo}: {formatCurrency(p.monto)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalle de Ticket */}
      {selectedVenta && (
        <Modal
          visible={Boolean(selectedVenta)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedVenta(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.floating]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFolio}>{selectedVenta.folio}</Text>
                  <Text style={styles.modalCliente}>{selectedVenta.cliente?.nombre || 'Cliente General'}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedVenta(null)} style={styles.modalCloseBtn}>
                  <X size={20} color={colors.neutral[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                {/* Metadatos de la venta */}
                <View style={styles.ticketMetaRow}>
                  <Text style={styles.ticketMetaLabel}>Fecha y hora:</Text>
                  <Text style={styles.ticketMetaVal}>
                    {new Date(selectedVenta.fechaHora).toLocaleString('es-MX')}
                  </Text>
                </View>
                <View style={styles.ticketMetaRow}>
                  <Text style={styles.ticketMetaLabel}>Vendedor:</Text>
                  <Text style={styles.ticketMetaVal}>{selectedVenta.usuario?.nombre || 'Miguel'}</Text>
                </View>
                <View style={styles.ticketMetaRow}>
                  <Text style={styles.ticketMetaLabel}>Ruta:</Text>
                  <Text style={styles.ticketMetaVal}>{selectedVenta.cliente?.ruta || 'Ruta Lunes'}</Text>
                </View>

                {/* Lista de productos desglosada */}
                <Text style={styles.detallesHeader}>Artículos Vendidos:</Text>
                <View style={styles.detallesBox}>
                  {(selectedVenta.detalles || []).map((d: any, idx: number) => (
                    <View key={idx} style={styles.detalleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detalleProdNombre}>
                          {d.presentacionNombre || `Producto #${d.productoId}`}
                        </Text>
                        <Text style={styles.detalleProdSub}>
                          {d.cantidadPresentaciones} x {formatCurrency(d.precioUnitario)}
                        </Text>
                      </View>
                      <Text style={styles.detalleSubtotal}>{formatCurrency(d.subtotal)}</Text>
                    </View>
                  ))}
                </View>

                {/* Totales y pagos */}
                <View style={styles.totalesBox}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total de Venta:</Text>
                    <Text style={styles.totalAmount}>{formatCurrency(selectedVenta.total)}</Text>
                  </View>

                  {(selectedVenta.pagos || []).map((p: any, idx: number) => (
                    <View key={idx} style={styles.pagoRow}>
                      <Text style={styles.pagoLabel}>{p.metodo}:</Text>
                      <Text style={styles.pagoVal}>{formatCurrency(p.monto)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Botones de acción del ticket */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => handleShareWhatsApp(selectedVenta)}
                  style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePrintPdf(selectedVenta)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary[700] }]}
                >
                  <Printer size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Imprimir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  kpiGrid: {
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
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[700],
  },
  filterChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },
  chipsRowVendedores: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
  },
  vendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  vendChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  vendChipText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  vendChipTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
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
    paddingVertical: 60,
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
  ventasList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  ventaCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  folioBadge: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  vendedorBadge: {
    fontSize: 10,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  clienteNombre: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 2,
  },
  clienteProp: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  totalText: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: colors.primary[700],
  },
  horaText: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  itemsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemsSummaryText: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
  pagosBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  pagoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pagoBadgeEfectivo: {
    backgroundColor: colors.success[50],
  },
  pagoBadgeCredito: {
    backgroundColor: colors.warning[50],
  },
  pagoBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  pagoBadgeTextEfectivo: {
    color: colors.success[700],
  },
  pagoBadgeTextCredito: {
    color: colors.warning[700],
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
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalFolio: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    textTransform: 'uppercase',
  },
  modalCliente: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalCloseBtn: {
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
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketMetaLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  ticketMetaVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
  },
  detallesHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  detallesBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  detalleProdNombre: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  detalleProdSub: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  detalleSubtotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  totalesBox: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.primary[700],
  },
  pagoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  pagoLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  pagoVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
