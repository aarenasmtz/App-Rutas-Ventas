import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ShoppingCart,
  ChevronRight,
  Clock,
  Flame,
  User,
  Check,
  X,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import {
  mockProductos,
  mockCategorias,
  mockClientes,
  DataService,
} from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import { Card, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, getStockEstado } from '@/utils/helpers';
import type { Producto, Cliente, ItemCarrito } from '@/types';

// Helper para detectar productos que se venden por kilo (Carnes frías, quesos, embutidos)
export function isProductoPorKilo(p: Producto): boolean {
  if (p.precioPorPeso === true) return true;
  if (p.unidad?.toLowerCase() === 'kg' || p.unidad?.toLowerCase() === 'kilo') return true;
  const cat = (p.categoria || '').toLowerCase();
  const kiloCategorias = [
    'jamón',
    'jamon',
    'salchicha',
    'chorizo',
    'quesos',
    'queso',
    'carnes frías',
    'carnes frias',
  ];
  if (kiloCategorias.includes(cat)) return true;
  const nom = (p.nombre || '').toLowerCase();
  if (
    nom.includes('jamón') ||
    nom.includes('jamon') ||
    nom.includes('queso') ||
    nom.includes('salchicha') ||
    nom.includes('chorizo') ||
    nom.includes('tocino') ||
    nom.includes('pepperoni')
  ) {
    return true;
  }
  return false;
}

export default function VentaScreen() {
  const router = useRouter();
  const {
    carrito,
    addToCarrito,
    clienteActivoId,
    setClienteActivoId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [showQtyModal, setShowQtyModal] = useState<Producto | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Estados de datos vivos (VPS / fallback local)
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadLiveData = async () => {
      try {
        const [cls, prs, cats] = await Promise.all([
          DataService.getClientes(),
          DataService.getProductos(),
          DataService.getCategorias(),
        ]);
        if (mounted) {
          if (cls && cls.length > 0) setClientesList(cls);
          if (prs && prs.length > 0) setProductosList(prs);
          if (cats && cats.length > 0) setCategoriasList(cats);
        }
      } catch (err) {
        console.warn('Error loading live data in VentaScreen:', err);
      }
    };
    loadLiveData();
    return () => {
      mounted = false;
    };
  }, []);

  const effectiveClientes = clientesList.length > 0 ? clientesList : mockClientes;
  const effectiveProductos = productosList.length > 0 ? productosList : mockProductos;

  // Lista unificada de categorías
  const categorias = useMemo(() => {
    const defaultCats = [
      'Todas',
      'Jamón',
      'Salchicha',
      'Chorizo',
      'Quesos',
      'Carnes frías',
      'Abarrotes',
      'Enlatados',
      'Mantequillas',
      'Mayonesas',
    ];
    if (categoriasList.length > 0) {
      const liveNames = categoriasList.map((c) => c.nombre);
      return ['Todas', ...Array.from(new Set([...defaultCats.slice(1), ...liveNames]))];
    }
    return defaultCats;
  }, [categoriasList]);

  // Cliente activo
  const cliente = useMemo(() => {
    return (
      effectiveClientes.find((c) => c.id === clienteActivoId) ||
      effectiveClientes[0] ||
      null
    );
  }, [effectiveClientes, clienteActivoId]);

  // Productos frecuentes del cliente seleccionado
  const productosFrecuentes = useMemo(() => {
    if (!cliente || !cliente.sugerido) return [];
    return cliente.sugerido
      .map((s) => effectiveProductos.find((p) => p.id === s.productoId))
      .filter(Boolean) as Producto[];
  }, [cliente, effectiveProductos]);

  // Filtrado de productos por texto y categoría
  const filtered = useMemo(() => {
    return effectiveProductos.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q);

      const matchCat =
        categoriaActiva === 'Todas' ||
        p.categoria.toLowerCase() === categoriaActiva.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [effectiveProductos, search, categoriaActiva]);

  // Totales de carrito
  const cartTotal = carrito.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = carrito.length;

  // Precio final según cliente (respeta precios especiales pactados por Don Juan / Miguel)
  const getPrecio = (producto: Producto): number => {
    if (cliente?.precioEspecial?.[producto.id]) {
      return cliente.precioEspecial[producto.id];
    }
    return producto.precioBase;
  };

  // Agregar al carrito según el flujo de venta rápida de Miguel
  const handleAddProduct = (producto: Producto, cantidad: number) => {
    const isWeight = isProductoPorKilo(producto);
    const precioLista = getPrecio(producto);
    const precioFinal = precioLista;
    const subtotal = Math.round(cantidad * precioFinal * 100) / 100;

    const item: ItemCarrito = {
      producto: {
        ...producto,
        unidad: isWeight ? 'kg' : (producto.unidad || 'pieza'),
        precioPorPeso: isWeight,
      },
      cantidad,
      unidad: isWeight ? 'kg' : (producto.unidad || 'pieza'),
      precioLista,
      descuento: 0,
      precioFinal,
      subtotal,
      piezasTotales: isWeight ? cantidad : Math.round(cantidad),
    };

    addToCarrito(item);
    setShowQtyModal(null);
  };

  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* ENCABEZADO DE VENTA                                       */}
      {/* ========================================================= */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Nueva venta</Text>
            {cliente ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsClientModalOpen(true)}
                style={styles.clientSelectorRow}
              >
                <Text style={styles.subtitle}>
                  Cliente: <Text style={styles.clientNameHighlight}>{cliente.nombre}</Text>
                </Text>
                <ChevronRight size={14} color={colors.primary[600]} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.subtitle}>Selecciona productos para vender</Text>
            )}
          </View>
          <ConnectivityIndicator />
        </View>

        {/* Buscador de productos */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categorías deslizables */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catsRow}
        >
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoriaActiva === cat && styles.catChipActive]}
              onPress={() => setCategoriaActiva(cat)}
            >
              <Text
                style={[
                  styles.catChipText,
                  categoriaActiva === cat && styles.catChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ========================================================= */}
      {/* LISTADO DE PRODUCTOS                                      */}
      {/* ========================================================= */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Frecuentes del cliente */}
        {productosFrecuentes.length > 0 && !search && categoriaActiva === 'Todas' && (
          <>
            <View style={styles.sectionLabelRow}>
              <Flame size={15} color={colors.warning[600]} />
              <Text style={styles.sectionLabel}>Frecuentes del cliente</Text>
            </View>
            {productosFrecuentes.map((p) => (
              <ProductRow
                key={'freq-' + p.id}
                producto={p}
                precio={getPrecio(p)}
                onPress={() => setShowQtyModal(p)}
              />
            ))}
          </>
        )}

        {/* Catálogo completo */}
        <View style={styles.sectionLabelRow}>
          <Clock size={15} color={colors.neutral[400]} />
          <Text style={styles.sectionLabel}>Productos</Text>
        </View>
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            producto={p}
            precio={getPrecio(p)}
            onPress={() => setShowQtyModal(p)}
          />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No se encontraron productos.</Text>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* BARRA FLOTANTE DE CARRITO (CUANDO HAY ARTÍCULOS)          */}
      {/* ========================================================= */}
      {cartCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push('/(tabs)/venta/carrito')}
          style={styles.cartBar}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>
              {cartCount} {cartCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarTotal}>{formatCurrency(cartTotal)}</Text>
            <View style={styles.cartBarBtn}>
              <Text style={styles.cartBarBtnText}>Ver carrito</Text>
              <ChevronRight size={18} color={colors.neutral[0]} />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CANTIDAD (FLUJO RÁPIDO EXACTO DE MIGUEL)         */}
      {/* ========================================================= */}
      {showQtyModal && (
        <QtyModal
          producto={showQtyModal}
          precio={getPrecio(showQtyModal)}
          onClose={() => setShowQtyModal(null)}
          onConfirm={handleAddProduct}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL PARA CAMBIAR CLIENTE ACTIVO                         */}
      {/* ========================================================= */}
      <Modal
        visible={isClientModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClientModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsClientModalOpen(false)}
        >
          <View style={styles.clientPickerCard}>
            <Text style={styles.clientPickerTitle}>Seleccionar cliente</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {effectiveClientes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.clientItem,
                    cliente?.id === c.id && styles.clientItemActive,
                  ]}
                  onPress={() => {
                    setClienteActivoId(c.id);
                    setIsClientModalOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientItemName}>{c.nombre}</Text>
                    <Text style={styles.clientItemSub}>
                      {c.propietario} · {c.direccion}
                    </Text>
                  </View>
                  {cliente?.id === c.id && <Check size={18} color={colors.primary[600]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// =========================================================
// FILA DE PRODUCTO INDIVIDUAL
// =========================================================
function ProductRow({
  producto,
  precio,
  onPress,
}: {
  producto: Producto;
  precio: number;
  onPress: () => void;
}) {
  const isWeight = isProductoPorKilo(producto);
  const stockEstado = getStockEstado(producto.existencia, isWeight);
  const stockColor =
    stockEstado === 'Normal'
      ? colors.success[600]
      : stockEstado === 'Bajo'
      ? colors.warning[600]
      : colors.error[500];

  const displayUnit = isWeight ? 'kg' : producto.unidad || 'pieza';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.productCard}>
        <View style={styles.productIcon}>
          <Text style={styles.productIconText}>
            {producto.categoria ? producto.categoria.charAt(0).toUpperCase() : 'P'}
          </Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.productCat}>{producto.categoria}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>
              <Text style={{ color: stockColor, fontWeight: fontWeight.semibold }}>
                {isWeight ? producto.existencia.toFixed(1) : producto.existencia} {displayUnit}
              </Text>
              {' · '}
              <Text style={{ color: stockColor }}>{stockEstado}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>{formatCurrency(precio)}</Text>
          <Text style={styles.productUnit}>/{displayUnit}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// =========================================================
// MODAL DE VENTA DE MIGUEL (POR KILOS Y POR PIEZAS)
// =========================================================
function QtyModal({
  producto,
  precio,
  onClose,
  onConfirm,
}: {
  producto: Producto;
  precio: number;
  onClose: () => void;
  onConfirm: (p: Producto, c: number) => void;
}) {
  const isWeight = isProductoPorKilo(producto);

  // Valor inicial: 0.500 kg para productos de peso, 1 para productos de pieza
  const [qty, setQty] = useState(isWeight ? 0.5 : 1);

  // Chips de selección rápida
  const pesos = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
  const piezas = [1, 2, 3, 6, 12, 24];
  const opciones = isWeight ? pesos : piezas;

  const displayUnit = isWeight ? 'kg' : producto.unidad || 'pieza';

  const handleMinus = () => {
    if (isWeight) {
      setQty((q) => Math.max(0.25, Math.round((q - 0.25) * 1000) / 1000));
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handlePlus = () => {
    if (isWeight) {
      setQty((q) => Math.round((q + 0.25) * 1000) / 1000);
    } else {
      setQty((q) => q + 1);
    }
  };

  const subtotal = Math.round(qty * precio * 100) / 100;

  return (
    <View style={modalStyles.overlay}>
      <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />

        <Text style={modalStyles.title}>{producto.nombre}</Text>
        <Text style={modalStyles.subtitle}>
          {formatCurrency(precio)} / {displayUnit}
        </Text>

        <Text style={modalStyles.label}>Cantidad</Text>

        {/* Stepper principal [-]  0.500 kg  [+] */}
        <View style={modalStyles.qtyRow}>
          <TouchableOpacity
            style={modalStyles.qtyBtn}
            activeOpacity={0.7}
            onPress={handleMinus}
          >
            <Text style={modalStyles.qtyBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={modalStyles.qtyDisplay}>
            {isWeight ? `${qty.toFixed(3)} kg` : `${qty} ${displayUnit}`}
          </Text>

          <TouchableOpacity
            style={modalStyles.qtyBtn}
            activeOpacity={0.7}
            onPress={handlePlus}
          >
            <Text style={modalStyles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Opciones rápidas de un toque */}
        <View style={modalStyles.opcionesRow}>
          {opciones.map((o) => (
            <TouchableOpacity
              key={o}
              style={[modalStyles.opcionChip, qty === o && modalStyles.opcionChipActive]}
              onPress={() => setQty(o)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  modalStyles.opcionText,
                  qty === o && modalStyles.opcionTextActive,
                ]}
              >
                {isWeight ? o.toFixed(3) : o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subtotal en tiempo real */}
        <View style={modalStyles.totalRow}>
          <Text style={modalStyles.totalLabel}>Subtotal</Text>
          <Text style={modalStyles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>

        {/* Botón de confirmar */}
        <TouchableOpacity
          style={modalStyles.addBtn}
          activeOpacity={0.88}
          onPress={() => onConfirm(producto, qty)}
        >
          <ShoppingCart size={20} color={colors.neutral[0]} />
          <Text style={modalStyles.addBtnText}>Agregar al carrito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.neutral[0],
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  clientSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientNameHighlight: {
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.neutral[900],
  },
  catsRow: {
    gap: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  catChipActive: {
    backgroundColor: colors.primary[600],
  },
  catChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  catChipTextActive: {
    color: colors.neutral[0],
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  productCat: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 1,
  },
  productMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  productStock: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  productUnit: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.neutral[400],
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 22,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadows.floating,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  cartBarText: {
    fontSize: fontSize.base,
    color: colors.neutral[300],
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartBarTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  cartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  cartBarBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  clientPickerCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    ...shadows.floating,
  },
  clientPickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  clientItemActive: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
  },
  clientItemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  clientItemSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  qtyDisplay: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    minWidth: 140,
    textAlign: 'center',
  },
  opcionesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  opcionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  opcionChipActive: {
    backgroundColor: colors.primary[600],
  },
  opcionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  opcionTextActive: {
    color: colors.neutral[0],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  addBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
