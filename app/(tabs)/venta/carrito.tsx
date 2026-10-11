import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trash2,
  ChevronRight,
  Plus,
  Minus,
  ArrowRight,
  Package,
  User,
  ShoppingBag,
  CreditCard,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/helpers';
import { mockClientes } from '@/services/mockDataService';
import { AppShell, PageHeader, MoneyDisplay } from '@/components/DesignSystem';
import type { ItemCarrito } from '@/types';

export default function CarritoScreen() {
  const router = useRouter();
  const {
    carrito,
    updateCarritoItem,
    removeFromCarrito,
    clearCarrito,
    setVentaTotal,
    clienteActivoId,
  } = useApp();

  const cliente = mockClientes.find((c) => c.id === clienteActivoId) || mockClientes[0];

  const subtotal = carrito.reduce((s, i) => s + i.cantidad * i.precioLista, 0);
  const total = carrito.reduce((s, i) => s + i.subtotal, 0);
  const totalPiezas = carrito.reduce((s, i) => s + (i.piezasTotales || i.cantidad), 0);

  const saldoActual = cliente?.saldo || 0;
  const limiteCredito = cliente?.limiteCredito || 0;
  const saldoProyectado = saldoActual + total;

  const handleCheckout = () => {
    if (carrito.length === 0) return;
    setVentaTotal(total);
    router.push('/(tabs)/venta/pago');
  };

  const handleIncrement = (index: number) => {
    const item = carrito[index];
    const isWeight = item.producto.precioPorPeso || item.producto.unidad === 'kg';
    const step = isWeight ? 0.250 : 1;
    const newQty = parseFloat((item.cantidad + step).toFixed(3));
    const factor = item.presentacion?.piezasEquivalentes || 1;
    updateCarritoItem(index, {
      ...item,
      cantidad: newQty,
      piezasTotales: isWeight ? newQty : newQty * factor,
      subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
    });
  };

  const handleDecrement = (index: number) => {
    const item = carrito[index];
    const isWeight = item.producto.precioPorPeso || item.producto.unidad === 'kg';
    const step = isWeight ? 0.250 : 1;
    if (item.cantidad <= step) {
      removeFromCarrito(index);
      return;
    }
    const newQty = parseFloat((item.cantidad - step).toFixed(3));
    const factor = item.presentacion?.piezasEquivalentes || 1;
    updateCarritoItem(index, {
      ...item,
      cantidad: newQty,
      piezasTotales: isWeight ? newQty : newQty * factor,
      subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Carrito de Venta"
        subtitle={`${carrito.length} presentaciones · ${totalPiezas} piezas`}
        onBack={() => router.back()}
        right={
          carrito.length > 0 ? (
            <TouchableOpacity activeOpacity={0.7} onPress={clearCarrito} style={styles.clearBtn}>
              <Trash2 size={18} color={colors.error[500]} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Tarjeta del Cliente en el Carrito */}
        <View style={[styles.clientCard, shadows.card]}>
          <View style={styles.clientLeft}>
            <View style={styles.clientAvatar}>
              <User size={18} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.clientLabel}>CLIENTE DE ESTA VENTA</Text>
              <Text style={styles.clientName}>{cliente.nombre}</Text>
              <Text style={styles.clientOwner}>{cliente.propietario} · {cliente.direccion}</Text>
            </View>
          </View>

          <View style={styles.clientRight}>
            <Text style={styles.saldoLabel}>Saldo actual</Text>
            <MoneyDisplay
              amount={saldoActual}
              size="sm"
              color={saldoActual > 0 ? colors.error[600] : colors.success[600]}
            />
          </View>
        </View>

        {/* Lista de Items con Presentaciones y Stepper */}
        {carrito.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ShoppingBag size={48} color={colors.neutral[300]} />
            </View>
            <Text style={styles.emptyTitle}>El carrito está vacío</Text>
            <Text style={styles.emptySubtitle}>Agrega productos seleccionando presentación para comenzar la venta</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.goToSellBtn}
              onPress={() => router.replace('/(tabs)/venta')}
            >
              <Text style={styles.goToSellBtnText}>Ir al catálogo de productos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {carrito.map((item, index) => {
              const pres = item.presentacion;
              const piezasEquiv = item.piezasTotales || item.cantidad;

              return (
                <View key={index} style={[styles.cartItemCard, shadows.card]}>
                  {/* Encabezado del producto */}
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleBlock}>
                      {item.producto.marca && (
                        <Text style={styles.itemBrand}>{item.producto.marca}</Text>
                      )}
                      <Text style={styles.itemName}>{item.producto.nombre}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => removeFromCarrito(index)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  </View>

                  {/* Presentación seleccionada y equivalencia en piezas */}
                  <View style={styles.presBadgeRow}>
                    <View style={styles.presTag}>
                      <Package size={12} color={colors.primary[700]} />
                      <Text style={styles.presTagText}>
                        {pres ? pres.nombre : (item.producto.precioPorPeso || item.producto.unidad === 'kg' ? 'Venta por peso' : 'Pieza individual')}
                      </Text>
                    </View>

                    {item.producto.precioPorPeso || item.producto.unidad === 'kg' ? (
                      <Text style={styles.equivCalcText}>
                        <Text style={{ fontWeight: 'bold', color: colors.primary[800] }}>{item.cantidad.toFixed(3)} kg</Text> a {formatCurrency(item.precioFinal)}/kg
                      </Text>
                    ) : (
                      <Text style={styles.equivCalcText}>
                        {item.cantidad} {pres?.tipo || 'pza'}{item.cantidad > 1 ? 's' : ''} = <Text style={{ fontWeight: 'bold', color: colors.primary[800] }}>{piezasEquiv} piezas</Text>
                      </Text>
                    )}
                  </View>

                  {/* Stepper y Precio final */}
                  <View style={styles.itemFooter}>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDecrement(index)}
                        style={styles.stepBtn}
                      >
                        <Minus size={16} color={colors.neutral[700]} />
                      </TouchableOpacity>
                      <Text style={styles.stepCount}>
                        {item.producto.precioPorPeso || item.producto.unidad === 'kg' ? `${item.cantidad.toFixed(3)} kg` : item.cantidad}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleIncrement(index)}
                        style={[styles.stepBtn, styles.stepBtnPlus]}
                      >
                        <Plus size={16} color={colors.neutral[0]} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemPrices}>
                      <Text style={styles.unitPriceText}>
                        {formatCurrency(item.precioFinal)} c/u
                      </Text>
                      <MoneyDisplay amount={item.subtotal} size="md" color={colors.primary[700]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Resumen Financiero y Botón de Cobro */}
      {carrito.length > 0 && (
        <View style={[styles.bottomCheckoutBar, shadows.floating]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalPiezas} piezas en total)</Text>
            <MoneyDisplay amount={subtotal} size="sm" color={colors.neutral[800]} />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Saldo actual del cliente</Text>
            <MoneyDisplay amount={saldoActual} size="sm" color={saldoActual > 0 ? colors.error[600] : colors.success[600]} />
          </View>

          {saldoActual > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.neutral[500] }]}>Saldo total proyectado si es a crédito</Text>
              <MoneyDisplay amount={saldoProyectado} size="sm" color={colors.error[600]} />
            </View>
          )}

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL A COBRAR</Text>
              <Text style={styles.totalSub}>{carrito.length} líneas de venta</Text>
            </View>
            <MoneyDisplay amount={total} size="xl" color={colors.primary[700]} />
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={handleCheckout} style={styles.checkoutBtn}>
            <Text style={styles.checkoutBtnText}>CONTINUAR AL COBRO</Text>
            <ArrowRight size={20} color={colors.neutral[0]} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 220,
  },
  clearBtn: {
    padding: spacing.sm,
    backgroundColor: colors.error[50],
    borderRadius: radius.md,
  },
  clientCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary[700],
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  clientOwner: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  clientRight: {
    alignItems: 'flex-end',
  },
  saldoLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  itemsList: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cartItemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleBlock: {
    flex: 1,
  },
  itemBrand: {
    fontSize: fontSize.xs - 1,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  presBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs + 2,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  presTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presTagText: {
    fontSize: fontSize.xs,
    color: colors.primary[800],
    fontWeight: fontWeight.semibold,
  },
  equivCalcText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    padding: 3,
    gap: spacing.sm,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPlus: {
    backgroundColor: colors.primary[600],
  },
  stepCount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrices: {
    alignItems: 'flex-end',
  },
  unitPriceText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 1.5,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 20,
  },
  goToSellBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  goToSellBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[500],
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
  },
  checkoutBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkoutBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
});
