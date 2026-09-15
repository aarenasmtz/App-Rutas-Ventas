import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ShoppingCart, ChevronRight, Clock, Flame } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { productos, categorias, clientes } from '@/constants/mockData';
import { useApp } from '@/context/AppContext';
import { Card, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, getStockEstado } from '@/utils/helpers';
import type { Producto, ItemCarrito } from '@/types';

export default function VentaScreen() {
  const router = useRouter();
  const { carrito, addToCarrito, clienteActivoId } = useApp();
  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [showQtyModal, setShowQtyModal] = useState<Producto | null>(null);

  const cliente = clientes.find((c) => c.id === clienteActivoId);
  const productosFrecuentes = useMemo(() => {
    if (!cliente) return [];
    return cliente.sugerido.map((s) => productos.find((p) => p.id === s.productoId)).filter(Boolean) as Producto[];
  }, [cliente]);

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
      return matchSearch && matchCat;
    });
  }, [search, categoriaActiva]);

  const cartTotal = carrito.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = carrito.length;

  const getPrecio = (producto: Producto): number => {
    if (cliente?.precioEspecial?.[producto.id]) return cliente.precioEspecial[producto.id];
    return producto.precioBase;
  };

  const handleAddProduct = (producto: Producto, cantidad: number) => {
    const precioLista = getPrecio(producto);
    const precioFinal = precioLista;
    const item: ItemCarrito = {
      producto,
      cantidad,
      precioLista,
      descuento: 0,
      precioFinal,
      subtotal: cantidad * precioFinal,
    };
    addToCarrito(item);
    setShowQtyModal(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Nueva venta</Text>
            {cliente ? (
              <Text style={styles.subtitle}>Cliente: {cliente.nombre}</Text>
            ) : (
              <Text style={styles.subtitle}>Selecciona productos para vender</Text>
            )}
          </View>
          <ConnectivityIndicator />
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoriaActiva === cat && styles.catChipActive]}
              onPress={() => setCategoriaActiva(cat)}
            >
              <Text style={[styles.catChipText, categoriaActiva === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {productosFrecuentes.length > 0 && !search && categoriaActiva === 'Todas' && (
          <>
            <Text style={styles.sectionLabel}><Flame size={14} color={colors.warning[600]} /> Frecuentes del cliente</Text>
            {productosFrecuentes.map((p) => (
              <ProductRow key={'freq-' + p.id} producto={p} precio={getPrecio(p)} onPress={() => setShowQtyModal(p)} />
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}><Clock size={14} color={colors.neutral[400]} /> Productos</Text>
        {filtered.map((p) => (
          <ProductRow key={p.id} producto={p} precio={getPrecio(p)} onPress={() => setShowQtyModal(p)} />
        ))}
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/venta/carrito')} style={styles.cartBar}>
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</Text>
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

      {showQtyModal && (
        <QtyModal producto={showQtyModal} precio={getPrecio(showQtyModal)} onClose={() => setShowQtyModal(null)} onConfirm={handleAddProduct} />
      )}
    </View>
  );
}

function ProductRow({ producto, precio, onPress }: { producto: Producto; precio: number; onPress: () => void }) {
  const stockEstado = getStockEstado(producto.existencia, producto.precioPorPeso);
  const stockColor = stockEstado === 'Normal' ? colors.success[600] : stockEstado === 'Bajo' ? colors.warning[600] : colors.error[500];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.productCard}>
        <View style={styles.productIcon}>
          <Text style={styles.productIconText}>{producto.categoria.charAt(0)}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.productCat}>{producto.categoria}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>
              <Text style={{ color: stockColor, fontWeight: fontWeight.semibold }}>{producto.existencia} {producto.unidad}</Text>
              {' · '}<Text style={{ color: stockColor }}>{stockEstado}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>{formatCurrency(precio)}</Text>
          <Text style={styles.productUnit}>/{producto.unidad}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function QtyModal({ producto, precio, onClose, onConfirm }: { producto: Producto; precio: number; onClose: () => void; onConfirm: (p: Producto, c: number) => void }) {
  const [qty, setQty] = useState(producto.precioPorPeso ? 0.5 : 1);
  const pesos = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const piezas = [1, 2, 3, 6, 12, 24];
  const opciones = producto.precioPorPeso ? pesos : piezas;

  return (
    <View style={modalStyles.overlay}>
      <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <Text style={modalStyles.title}>{producto.nombre}</Text>
        <Text style={modalStyles.subtitle}>{formatCurrency(precio)} / {producto.unidad}</Text>

        <Text style={modalStyles.label}>Cantidad</Text>
        <View style={modalStyles.qtyRow}>
          <TouchableOpacity style={modalStyles.qtyBtn} onPress={() => setQty((q) => Math.max(0.25, q - (producto.precioPorPeso ? 0.25 : 1)))}>
            <Text style={modalStyles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={modalStyles.qtyDisplay}>
            {producto.precioPorPeso ? qty.toFixed(3) : qty.toString()} {producto.unidad}
          </Text>
          <TouchableOpacity style={modalStyles.qtyBtn} onPress={() => setQty((q) => q + (producto.precioPorPeso ? 0.25 : 1))}>
            <Text style={modalStyles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={modalStyles.opcionesRow}>
          {opciones.map((o) => (
            <TouchableOpacity
              key={o}
              style={[modalStyles.opcionChip, qty === o && modalStyles.opcionChipActive]}
              onPress={() => setQty(o)}
            >
              <Text style={[modalStyles.opcionText, qty === o && modalStyles.opcionTextActive]}>
                {producto.precioPorPeso ? o.toFixed(3) : o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={modalStyles.totalRow}>
          <Text style={modalStyles.totalLabel}>Subtotal</Text>
          <Text style={modalStyles.totalValue}>{formatCurrency(qty * precio)}</Text>
        </View>

        <TouchableOpacity style={modalStyles.addBtn} onPress={() => onConfirm(producto, qty)}>
          <ShoppingCart size={20} color={colors.neutral[0]} />
          <Text style={modalStyles.addBtnText}>Agregar al carrito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    fontFamily: 'Inter-Regular',
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    paddingBottom: 18,
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
    minWidth: 120,
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
