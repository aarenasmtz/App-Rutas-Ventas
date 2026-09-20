import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ShoppingCart, MapPin, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatCurrency, todayStr } from '@/utils/helpers';

export default function ConfirmacionScreen() {
  const router = useRouter();
  const { ventaTotal, pagos, carrito, clearCarrito, clienteActivoId, clientes, registrarVenta } = useApp();
  const cliente = clientes.find((c) => c.id === clienteActivoId);

  const handleFinish = () => {
    if (clienteActivoId && carrito.length > 0) {
      registrarVenta({
        clienteId: clienteActivoId,
        items: carrito,
        total: ventaTotal,
        pagos,
        fecha: todayStr(),
      });
    }
    clearCarrito();
    router.replace('/(tabs)');
  };

  const handleNextClient = () => {
    if (clienteActivoId && carrito.length > 0) {
      registrarVenta({
        clienteId: clienteActivoId,
        items: carrito,
        total: ventaTotal,
        pagos,
        fecha: todayStr(),
      });
    }
    clearCarrito();
    router.replace('/(tabs)/ruta');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={64} color={colors.success[600]} />
        </View>
        <Text style={styles.title}>¡Venta completada!</Text>
        <Text style={styles.subtitle}>
          {cliente ? cliente.nombre : 'Cliente'} · {carrito.length} productos
        </Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total de la venta</Text>
          <Text style={styles.totalValue}>{formatCurrency(ventaTotal)}</Text>
        </View>

        <View style={styles.pagosCard}>
          <Text style={styles.cardTitle}>Métodos de pago</Text>
          {pagos.map((p, i) => (
            <View key={i} style={styles.pagoRow}>
              <Text style={styles.pagoMetodo}>{p.metodo}</Text>
              <Text style={styles.pagoMonto}>{formatCurrency(p.monto)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.pagoRow}>
            <Text style={styles.pagoTotalLabel}>Total</Text>
            <Text style={styles.pagoTotalValue}>{formatCurrency(ventaTotal)}</Text>
          </View>
        </View>

        {cliente && (
          <View style={styles.saldoCard}>
            <Text style={styles.saldoLabel}>Saldo del cliente</Text>
            <Text style={[styles.saldoValue, { color: cliente.saldo > 0 ? colors.error[600] : colors.success[600] }]}>
              {formatCurrency(cliente.saldo)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextClient}>
          <View style={styles.nextBtnLeft}>
            <MapPin size={20} color={colors.primary[600]} />
            <View>
              <Text style={styles.nextBtnTitle}>Siguiente cliente</Text>
              <Text style={styles.nextBtnSubtitle}>Continuar ruta</Text>
            </View>
          </View>
          <ChevronRight size={22} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={handleFinish}>
          <Text style={styles.homeBtnText}>Ir al inicio</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  totalCard: {
    backgroundColor: colors.success[600],
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
    marginTop: spacing.xs,
  },
  pagosCard: {
    backgroundColor: colors.neutral[0],
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md - 2,
  },
  pagoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm - 2,
  },
  pagoMetodo: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
  },
  pagoMonto: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.sm,
  },
  pagoTotalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  pagoTotalValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  saldoCard: {
    backgroundColor: colors.neutral[0],
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.card,
  },
  saldoLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  saldoValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  nextBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextBtnTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  nextBtnSubtitle: {
    fontSize: fontSize.xs,
    color: colors.primary[500],
    marginTop: 1,
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
  },
  homeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[500],
  },
});
