import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  Layers,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  Truck,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  X,
  ChevronRight,
  Info,
  DollarSign,
  Barcode,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { mockProductos, mockCategorias, DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';
import { desglosarInventario, desglosarInventarioParts } from '@/utils/multipresentacion';
import {
  AppShell,
  PageHeader,
  SearchBar,
  StockBadge,
  MoneyDisplay,
  RoleSwitcher,
} from '@/components/DesignSystem';
import type { Producto, Categoria } from '@/types';

type FiltroStock = 'Todos' | 'Stock bajo' | 'Agotados';

export default function InventarioScreen() {
  const router = useRouter();
  const { user, switchRole } = useApp();
  const isAdmin = user?.rol === 'Administrador';

  // Estados comunes
  const [search, setSearch] = useState('');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('Todos');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas');
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const live = await DataService.getProductos();
        if (isMounted) {
          setProductosList(live ?? []);
        }
      } catch {
        // Fallback
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Estados Admin
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<'Bodega' | 'Trabajador 1' | 'Trabajador 2' | 'Trabajador 3'>('Bodega');

  const filtered = useMemo(() => {
    return productosList.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.marca?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase());

      const matchCat = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;

      let matchStock = true;
      if (filtroStock === 'Stock bajo') matchStock = p.existencia > 0 && p.existencia <= 10;
      if (filtroStock === 'Agotados') matchStock = p.existencia <= 0;

      return matchSearch && matchCat && matchStock;
    });
  }, [productosList, search, categoriaActiva, filtroStock]);

  const totalPiezas = productosList.reduce((s, p) => s + p.existencia, 0);
  const bajos = productosList.filter((p) => p.existencia > 0 && p.existencia <= 10).length;
  const agotados = productosList.filter((p) => p.existencia <= 0).length;

  return (
    <AppShell>
      <PageHeader
        title={isAdmin ? 'Control de Inventario' : 'Mi Inventario'}
        subtitle={isAdmin ? 'Gestión de bodega y unidades' : 'Existencias actuales en camioneta'}
        right={
          <RoleSwitcher
            currentRole={user?.rol || 'Administrador'}
            onSwitch={switchRole}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Selector de ubicaciones para Administrador */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionHeading}>Almacén o Unidad seleccionada:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationsRow}>
              {(['Bodega', 'Trabajador 1', 'Trabajador 2', 'Trabajador 3'] as const).map((loc) => {
                const isSelected = ubicacionSeleccionada === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    activeOpacity={0.8}
                    onPress={() => setUbicacionSeleccionada(loc)}
                    style={[styles.locationChip, isSelected && styles.locationChipActive]}
                  >
                    {loc === 'Bodega' ? (
                      <Building2 size={16} color={isSelected ? colors.neutral[0] : colors.primary[600]} />
                    ) : (
                      <Truck size={16} color={isSelected ? colors.neutral[0] : colors.neutral[600]} />
                    )}
                    <Text style={[styles.locationChipText, isSelected && styles.locationChipTextActive]}>
                      {loc === 'Bodega' ? 'Bodega Central' : loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Acciones de Miguel (Admin): Revisar rutas y auditar inventario */}
            <View style={styles.adminActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/mas/surtido-nota' as any)}
                style={[styles.adminBtnPrimary, { backgroundColor: colors.secondary[600] }]}
              >
                <FileSpreadsheet size={16} color={colors.neutral[0]} />
                <Text style={styles.adminBtnPrimaryText}>Surtir Inventario (PDF)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/ruta')}
                style={styles.adminBtnSecondary}
              >
                <Truck size={16} color={colors.primary[700]} />
                <Text style={styles.adminBtnSecondaryText}>Rutas de trabajadores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/mas/revision')}
                style={styles.adminBtnSecondary}
              >
                <FileSpreadsheet size={16} color={colors.primary[700]} />
                <Text style={styles.adminBtnSecondaryText}>Auditar inventario</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resumen de Existencias */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: colors.primary[500], borderLeftWidth: 4 }]}>
            <Text style={styles.metricVal}>{totalPiezas}</Text>
            <Text style={styles.metricLabel}>Total Piezas</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: colors.warning[500], borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: colors.warning[600] }]}>{bajos}</Text>
            <Text style={styles.metricLabel}>Stock bajo</Text>
          </View>

          <View style={[styles.metricCard, { borderLeftColor: colors.error[500], borderLeftWidth: 4 }]}>
            <Text style={[styles.metricVal, { color: colors.error[600] }]}>{agotados}</Text>
            <Text style={styles.metricLabel}>Agotados</Text>
          </View>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por producto, marca o SKU..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Filtros de Stock */}
        <View style={styles.filtersRow}>
          {(['Todos', 'Stock bajo', 'Agotados'] as FiltroStock[]).map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.8}
              onPress={() => setFiltroStock(f)}
              style={[styles.filterChip, filtroStock === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filtroStock === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chips de Categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCategoriaActiva('Todas')}
            style={[styles.catChip, categoriaActiva === 'Todas' && styles.catChipActive]}
          >
            <Text style={[styles.catChipText, categoriaActiva === 'Todas' && styles.catChipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {mockCategorias.map((c) => (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.8}
              onPress={() => setCategoriaActiva(c.nombre)}
              style={[styles.catChip, categoriaActiva === c.nombre && styles.catChipActive]}
            >
              <Text style={styles.catChipEmoji}>{c.icono}</Text>
              <Text style={[styles.catChipText, categoriaActiva === c.nombre && styles.catChipTextActive]}>
                {c.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Productos con equivalencias */}
        <View style={styles.listContainer}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color={colors.neutral[400]} />
              <Text style={styles.emptyTitle}>No hay productos que coincidan</Text>
              <Text style={styles.emptySubtitle}>Intenta con otro término de búsqueda o filtro</Text>
            </View>
          ) : (
            filtered.map((p) => {
              const isMultipres = Boolean(
                p.manejaMultiplesPresentaciones ||
                (p.presentaciones && p.presentaciones.length > 1)
              );
              const desgloseTexto = isMultipres
                ? desglosarInventario(p.existencia, p.presentaciones, p.unidad)
                : null;

              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.82}
                  onPress={() => setSelectedProducto(p)}
                  style={[styles.inventoryCard, shadows.card]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.invLeft}>
                        <View style={styles.invDetails}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            {p.marca ? <Text style={styles.invBrand}>{p.marca}</Text> : null}
                            <Text style={styles.invCatBadge}>{p.categoria}</Text>
                            {isMultipres && (
                              <View style={styles.multipresTag}>
                                <Boxes size={11} color={colors.primary[700]} />
                                <Text style={styles.multipresTagText}>Multipresentación</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.invName}>{p.nombre}</Text>
                        </View>
                      </View>

                      <View style={styles.invRight}>
                        <StockBadge stockPiezas={p.existencia} />
                        <Text style={styles.invPriceText}>
                          {formatCurrency(p.precioBase)} / {p.unidad || 'pza'}
                        </Text>
                      </View>
                    </View>

                    {/* Desglose jerárquico de inventario unificado (Req 6) */}
                    {isMultipres && desgloseTexto && (
                      <View style={styles.breakdownBox}>
                        <View style={styles.breakdownHeader}>
                          <Package size={13} color={colors.primary[700]} />
                          <Text style={styles.breakdownTitle}>Desglose en presentaciones:</Text>
                        </View>
                        <Text style={styles.breakdownContent}>{desgloseTexto}</Text>
                        <Text style={styles.breakdownSub}>
                          Total unificado: {p.existencia} {p.unidad || 'paquete'}{p.existencia === 1 ? '' : 's'}
                        </Text>
                      </View>
                    )}

                    {/* Indicador de acción para ver detalle */}
                    <View style={styles.cardTouchHint}>
                      <Text style={styles.cardTouchHintText}>Toca para ver detalle de piezas y presentaciones</Text>
                      <ChevronRight size={14} color={colors.primary[600]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de Detalle de Piezas e Inventario */}
      {selectedProducto && (
        <Modal
          visible={Boolean(selectedProducto)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedProducto(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.floating]}>
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {selectedProducto.marca ? (
                      <Text style={styles.modalBrandBadge}>{selectedProducto.marca}</Text>
                    ) : null}
                    <Text style={styles.modalCatBadge}>{selectedProducto.categoria}</Text>
                    {selectedProducto.sku ? (
                      <Text style={styles.modalSkuBadge}>SKU: {selectedProducto.sku}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedProducto.nombre}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedProducto(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={colors.neutral[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* Banner de Existencia General */}
                <View style={styles.modalStockBanner}>
                  <View style={styles.modalStockLeft}>
                    <Text style={styles.modalStockNumber}>{selectedProducto.existencia}</Text>
                    <Text style={styles.modalStockUnit}>
                      {selectedProducto.unidad || 'piezas'} totales
                    </Text>
                    <Text style={styles.modalStockLocation}>
                      📍 {isAdmin ? (ubicacionSeleccionada === 'Bodega' ? 'Bodega Central' : ubicacionSeleccionada) : 'Camioneta en Ruta'}
                    </Text>
                  </View>
                  <View style={styles.modalStockRight}>
                    <StockBadge stockPiezas={selectedProducto.existencia} />
                    <Text style={styles.modalUnitPrice}>
                      {formatCurrency(selectedProducto.precioBase)}
                    </Text>
                    <Text style={styles.modalUnitPriceSub}>Precio base venta</Text>
                  </View>
                </View>

                {/* Desglose Físico de Piezas */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Boxes size={18} color={colors.primary[700]} />
                    <Text style={styles.modalSectionTitle}>Desglose Físico en Piezas</Text>
                  </View>
                  <Text style={styles.modalSectionDesc}>
                    Conteo exacto agrupado según el factor de cada empaque:
                  </Text>

                  {(() => {
                    const parts = desglosarInventarioParts(
                      selectedProducto.existencia,
                      selectedProducto.presentaciones,
                      selectedProducto.unidad || 'pieza'
                    );

                    if (parts.length === 0) {
                      return (
                        <View style={styles.emptyPartBox}>
                          <Text style={styles.emptyPartText}>
                            Producto agotado (0 {selectedProducto.unidad || 'piezas'})
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <View style={styles.partsContainer}>
                        {parts.map((part, idx) => (
                          <View key={idx} style={styles.partItemCard}>
                            <View style={styles.partItemIconWrap}>
                              {part.factor > 10 ? (
                                <Package size={18} color={colors.primary[700]} />
                              ) : (
                                <Layers size={18} color={colors.primary[600]} />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.partItemTitle}>
                                {part.cantidad} {part.nombre}{part.cantidad === 1 ? '' : (part.nombre.endsWith('r') || part.nombre.endsWith('l') ? 'es' : 's')}
                              </Text>
                              <Text style={styles.partItemSubtitle}>
                                {part.factor > 1
                                  ? `Factor: 1 ${part.nombre} = ${part.factor} ${selectedProducto.unidad || 'pzas'}`
                                  : `Piezas sueltas individuales`}
                              </Text>
                            </View>
                            <View style={styles.partItemSubtotal}>
                              <Text style={styles.partItemPieces}>
                                {part.cantidad * part.factor}
                              </Text>
                              <Text style={styles.partItemPiecesLabel}>piezas</Text>
                            </View>
                          </View>
                        ))}

                        <View style={styles.partsTotalBar}>
                          <Text style={styles.partsTotalLabel}>Suma total verificada:</Text>
                          <Text style={styles.partsTotalValue}>
                            {selectedProducto.existencia} {selectedProducto.unidad || 'piezas'}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Presentaciones y Factores de Empaque */}
                {selectedProducto.presentaciones && selectedProducto.presentaciones.length > 0 && (
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionHeader}>
                      <Package size={18} color={colors.secondary[700]} />
                      <Text style={styles.modalSectionTitle}>Catálogo de Presentaciones</Text>
                    </View>
                    <View style={styles.presTable}>
                      {selectedProducto.presentaciones.map((pres, idx) => {
                        const unitEquiv = pres.piezasEquivalentes > 0 ? (pres.precio / pres.piezasEquivalentes) : pres.precio;
                        return (
                          <View key={idx} style={styles.presTableRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.presTableName}>{pres.nombre}</Text>
                              <Text style={styles.presTableEquiv}>
                                Contiene {pres.piezasEquivalentes} {selectedProducto.unidad || 'piezas'}
                              </Text>
                              {pres.codigoBarras ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <Barcode size={12} color={colors.neutral[500]} />
                                  <Text style={styles.presTableBarcode}>{pres.codigoBarras}</Text>
                                </View>
                              ) : null}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.presTablePrice}>{formatCurrency(pres.precio)}</Text>
                              <Text style={styles.presTableUnitPrice}>
                                ({formatCurrency(unitEquiv)}/pza)
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Ficha Comercial & Datos */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <DollarSign size={18} color={colors.success[700]} />
                    <Text style={styles.modalSectionTitle}>Valores Comerciales y Costos</Text>
                  </View>
                  <View style={styles.pricingGrid}>
                    <View style={styles.pricingCol}>
                      <Text style={styles.pricingLabel}>Precio Venta Base</Text>
                      <Text style={styles.pricingVal}>
                        {formatCurrency(selectedProducto.precioBase)}
                      </Text>
                    </View>
                    <View style={styles.pricingCol}>
                      <Text style={styles.pricingLabel}>Costo Compra</Text>
                      <Text style={styles.pricingVal}>
                        {selectedProducto.precioCompra
                          ? formatCurrency(selectedProducto.precioCompra)
                          : 'No registrado'}
                      </Text>
                    </View>
                    {selectedProducto.precioCompra && selectedProducto.precioCompra > 0 && (
                      <View style={styles.pricingCol}>
                        <Text style={styles.pricingLabel}>Margen Estimado</Text>
                        <Text style={[styles.pricingVal, { color: colors.success[700] }]}>
                          +{formatCurrency(selectedProducto.precioBase - selectedProducto.precioCompra)} ({(((selectedProducto.precioBase - selectedProducto.precioCompra) / selectedProducto.precioBase) * 100).toFixed(0)}%)
                        </Text>
                      </View>
                    )}
                    <View style={styles.pricingCol}>
                      <Text style={styles.pricingLabel}>Tipo de Venta</Text>
                      <Text style={styles.pricingVal}>
                        {selectedProducto.precioPorPeso ? 'Báscula (Kg/Peso)' : 'Conteo por pieza'}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Botón Cerrar */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedProducto(null)}
                  style={styles.modalCloseActionBtn}
                >
                  <Text style={styles.modalCloseActionBtnText}>Cerrar Detalle</Text>
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
  adminSection: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs + 2,
  },
  locationsRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  locationChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  locationChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  locationChipTextActive: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
  adminActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  adminBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  adminBtnPrimaryText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  adminBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  adminBtnSecondaryText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  metricVal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.neutral[900],
  },
  filterChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.neutral[0],
  },
  catsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  catChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  catChipEmoji: {
    fontSize: 14,
  },
  catChipText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    fontWeight: fontWeight.medium,
  },
  catChipTextActive: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inventoryCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  invLeft: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    flex: 1,
  },
  invIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  invDetails: {
    flex: 1,
  },
  invBrand: {
    fontSize: fontSize.xs - 1,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  invName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  invSku: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginTop: 1,
  },
  equivalenciasWrap: {
    marginTop: spacing.xs,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  equivText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    fontWeight: fontWeight.semibold,
  },
  equivHighlight: {
    color: colors.primary[700],
    fontWeight: fontWeight.bold,
  },
  equivSub: {
    color: colors.neutral[500],
  },
  invCatBadge: {
    fontSize: 10,
    color: colors.neutral[500],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  invPriceText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary[700],
    marginTop: 3,
  },
  invRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  multipresTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  multipresTagText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  breakdownBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownContent: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  breakdownSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  priceRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
  },
  cardTouchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cardTouchHintText: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
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
    maxWidth: 520,
    maxHeight: '90%',
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
  modalBrandBadge: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    textTransform: 'uppercase',
  },
  modalCatBadge: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  modalSkuBadge: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    lineHeight: 22,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalStockBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  modalStockLeft: {
    flex: 1,
  },
  modalStockNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary[700],
  },
  modalStockUnit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  modalStockLocation: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },
  modalStockRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  modalUnitPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 4,
  },
  modalUnitPriceSub: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  modalSection: {
    marginBottom: spacing.md + 4,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalSectionDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginBottom: spacing.sm,
  },
  emptyPartBox: {
    padding: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  emptyPartText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  partsContainer: {
    gap: spacing.xs + 2,
  },
  partItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  partItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  partItemTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  partItemSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  partItemSubtotal: {
    alignItems: 'flex-end',
  },
  partItemPieces: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  partItemPiecesLabel: {
    fontSize: 9,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  partsTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  partsTotalLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary[800],
  },
  partsTotalValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
  },
  presTable: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  presTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  presTableName: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  presTableEquiv: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  presTableBarcode: {
    fontSize: 10,
    color: colors.neutral[400],
    fontFamily: 'monospace',
  },
  presTablePrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  presTableUnitPrice: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pricingCol: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pricingLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  pricingVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  modalCloseActionBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseActionBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
