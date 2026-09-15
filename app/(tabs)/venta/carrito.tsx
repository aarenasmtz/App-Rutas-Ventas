import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Edit3, ChevronRight, Tag } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import type { ItemCarrito } from '@/types';

export default function CarritoScreen() {
  const router = useRouter();
  const { carrito, updateCarritoItem, removeFromCarrito, clearCarrito, setVentaTotal, clienteActivoId } = useApp();

  const subtotal = carrito.reduce((s, i) => s + i.cantidad * i.precioLista, 0);
  const descuentoTotal = carrito.reduce((s, i) => s + i.descuento * i.cantidad, 0);
  const total = carrito.reduce((s, i) => s + i.subtotal, 0);

  const handleCheckout = () => {
    setVentaTotal(total);
    router.push('/(tabs)/venta/pago');
  };

  const handleEditPrice = (index: number) => {
    const item = carrito[index];
    Alert.prompt(
      'Modificar precio',
      `Precio actual: ${formatCurrency(item.precioFinal)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: (value: string | undefined) => {
            const newPrice = parseFloat(value || '0');
            if (newPrice > 0) {
              updateCarritoItem(index, {
                ...item,
                precioFinal: newPrice,
                descuento: item.precioLista - newPrice,
                subtotal: item.cantidad * newPrice,
              });
            }
          },
        },
      ],
      'plain-text',
      item.precioFinal.toString(),
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Carrito" subtitle={`${carrito.length} productos`} onBack={() => router.back()} right={
        <TouchableOpacity onPress={() => clearCarrito()} style={styles.clearBtn}>
          <Trash2 size={20} color={colors.error[500]} />
        </TouchableOpacity>
      } />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {carrito.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Carrito vacío</Text>
            <Text style={styles.emptySubtitle}>Agrega productos desde la pantalla de venta</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace('/(tabs)/venta')}>
              <Text style={styles.emptyBtnText}>Ir a vender</Text>
            </TouchableOpacity>
          </View>
        ) : (
          carrito.map((item, i) => (
            <CartItem
              key={i}
              item={item}
              onEditPrice={() => handleEditPrice(i)}
              onRemove={() => removeFromCarrito(i)}
            />
          ))
        )}
      </ScrollView>

      {carrito.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {descuentoTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Descuento</Text>
              <Text style={[styles.summaryValue, { color: colors.success[600] }]}>-{formatCurrency(descuentoTotal)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Cobrar / Finalizar venta</Text>
            <ChevronRight size={20} color={colors.neutral[0]} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CartItem({ item, onEditPrice, onRemove }: { item: ItemCarrito; onEditPrice: () => void; onRemove: () => void }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={styles.itemIcon}>
          <Text style={styles.itemIconText}>{item.producto.categoria.charAt(0)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.producto.nombre}</Text>
          <Text style={styles.itemQty}>{item.cantidad} {item.producto.unidad}</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Lista</Text>
              <Text style={styles.priceValue}>{formatCurrency(item.precioLista)}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Desc.</Text>
              <Text style={[styles.priceValue, { color: colors.success[600] }]}>-{formatCurrency(item.descuento)}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Final</Text>
              <Text style={[styles.priceValue, { fontWeight: fontWeight.bold, color: colors.neutral[900] }]}>{formatCurrency(item.precioFinal)}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={onEditPrice} style={styles.itemActionBtn}>
            <Tag size={16} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={styles.itemActionBtn}>
            <Trash2 size={16} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  clearBtn: {
    padding: spacing.xs,
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.md,
  },
  emptyBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  itemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  itemLeft: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  itemQty: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  priceCol: {},
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  priceValue: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    marginTop: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemSubtotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  itemActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.floating,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 1,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  totalValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  checkoutBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkoutBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
