import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  CreditCard, Wallet, RotateCcw, Package, Truck, Receipt,
  DollarSign, Scissors, Box, BarChart3, Users, ScrollText,
  RefreshCw, ChevronRight, LogOut, Wifi, WifiOff, User,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Card, ConnectivityIndicator } from '@/components/shared';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: typeof CreditCard;
  color: string;
  bg: string;
  route: string;
}

const menuItems: MenuItem[] = [
  { title: 'Créditos', subtitle: 'Cartera de clientes y saldos', icon: CreditCard, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/creditos' },
  { title: 'Cobranza', subtitle: 'Registrar abonos', icon: Wallet, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/cobranza' },
  { title: 'Devoluciones', subtitle: 'Cambios y mermas', icon: RotateCcw, color: colors.error[500], bg: colors.error[50], route: '/(tabs)/mas/devoluciones' },
  { title: 'Inventario', subtitle: 'Existencias en camioneta', icon: Package, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/inventario' },
  { title: 'Carga del día', subtitle: 'Mercancía inicial', icon: Truck, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/carga' },
  { title: 'Gastos', subtitle: 'Gasolina, comida y más', icon: Receipt, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/gastos' },
  { title: 'Caja', subtitle: 'Flujo de efectivo', icon: DollarSign, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/caja' },
  { title: 'Corte diario', subtitle: 'Resumen del día', icon: Scissors, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/corte' },
  { title: 'Productos', subtitle: 'Catálogo y precios', icon: Box, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/productos' },
  { title: 'Reportes', subtitle: 'Análisis y exportación', icon: BarChart3, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/reportes' },
  { title: 'Empleados', subtitle: 'Vendedores y rutas', icon: Users, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/empleados' },
  { title: 'Bitácora', subtitle: 'Registro de actividad', icon: ScrollText, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/bitacora' },
  { title: 'Sincronización', subtitle: 'Estado de datos', icon: RefreshCw, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/sincronizacion' },
];

export default function MasScreen() {
  const router = useRouter();
  const { user, logout, online, toggleOnline } = useApp();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <User size={28} color={colors.neutral[0]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nombre}</Text>
            <Text style={styles.profileRole}>{user?.rol}</Text>
          </View>
          <ConnectivityIndicator />
        </View>
      </View>

      <View style={styles.body}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={item.title} activeOpacity={0.85} onPress={() => router.push(item.route as never)}>
              <Card style={styles.menuCard}>
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Icon size={22} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={22} color={colors.neutral[300]} />
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />

        <TouchableOpacity activeOpacity={0.85} onPress={toggleOnline}>
          <Card style={styles.menuCard}>
            <View style={[styles.menuIcon, { backgroundColor: online ? colors.success[50] : colors.error[50] }]}>
              {online ? <Wifi size={22} color={colors.success[600]} /> : <WifiOff size={22} color={colors.error[500]} />}
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Modo {online ? 'Online' : 'Offline'}</Text>
              <Text style={styles.menuSubtitle}>Cambiar estado de conexión (DEMO)</Text>
            </View>
            <ChevronRight size={22} color={colors.neutral[300]} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={logout}>
          <Card style={[styles.menuCard, { marginBottom: 0 }]}>
            <View style={[styles.menuIcon, { backgroundColor: colors.error[50] }]}>
              <LogOut size={22} color={colors.error[500]} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: colors.error[600] }]}>Cerrar sesión</Text>
              <Text style={styles.menuSubtitle}>Salir de la aplicación</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.version}>Ruta Ventas v1.0.0 · Demo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.primary[700],
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  profileRole: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  body: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: spacing.lg,
  },
});
