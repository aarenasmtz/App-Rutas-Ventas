import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boxes,
  Scissors,
  Wallet,
  MapPin,
  ClipboardCheck,
  ScrollText,
  Settings,
  User,
  ChevronRight,
  LogOut,
  Wifi,
  WifiOff,
  ShieldCheck,
  RefreshCw,
  Tag,
  Users,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { AppShell, PageHeader, RoleSwitcher } from '@/components/DesignSystem';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bg: string;
  route: string;
}

export default function MasScreen() {
  const router = useRouter();
  const { user, switchRole, logout, online, toggleOnline } = useApp();
  const isAdmin = user?.rol === 'Administrador';

  // Menú según rol requerido en el prompt
  const adminMenuItems: MenuItem[] = [
    { title: 'Surtir Inventario PDF', subtitle: 'Cargar nota de compra diaria y aumentar stock', icon: FileSpreadsheet, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/surtido-nota' },
    { title: 'Trabajadores y Permisos', subtitle: 'Configurar 2 vendedores, PIN y permisos', icon: UserCheck, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/trabajadores' },
    { title: 'Productos (ABC)', subtitle: 'Altas, bajas y catálogo por peso/pieza', icon: Boxes, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/productos' },
    { title: 'Categorías (ABC)', subtitle: 'Administrar familias y emojis de productos', icon: Tag, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/categorias' },
    { title: 'Clientes (ABC)', subtitle: 'Altas, bajas y rutas en León, Guanajuato', icon: Users, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/clientes' },
    { title: 'Cortes', subtitle: 'Cortes diarios por trabajador', icon: Scissors, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/corte' },
    { title: 'Cobranza', subtitle: 'Registrar y consultar abonos', icon: Wallet, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/cobranza' },
    { title: 'Rutas Asignadas (ABC)', subtitle: 'Cambiar nombres y zonas de distribución', icon: MapPin, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/rutas' },
    { title: 'Rutas y Mapa', subtitle: 'Secuencia de paradas y mapa León, Gto', icon: MapPin, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/ruta' },
    { title: 'Revisión', subtitle: 'Auditoría rápida física vs sistema', icon: ClipboardCheck, color: colors.success[700], bg: colors.success[50], route: '/(tabs)/mas/revision' },
    { title: 'Auditoría', subtitle: 'Bitácora de movimientos y accesos', icon: ScrollText, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/bitacora' },
    { title: 'Configuración', subtitle: 'Sincronización y parámetros', icon: Settings, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/sincronizacion' },
  ];

  const vendedorMenuItems: MenuItem[] = [
    { title: 'Cobranza', subtitle: 'Registrar abonos de clientes', icon: Wallet, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/cobranza' },
    { title: 'Mi ruta', subtitle: 'Secuencia y mapa de visitas', icon: MapPin, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/ruta' },
    { title: 'Perfil', subtitle: 'Datos de la unidad y turno', icon: User, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/sincronizacion' },
  ];

  const currentMenuItems = isAdmin ? adminMenuItems : vendedorMenuItems;

  return (
    <AppShell>
      <PageHeader
        title="Más Opciones"
        subtitle={isAdmin ? 'Módulos de Administrador' : 'Herramientas de Vendedor en Ruta'}
        right={
          <RoleSwitcher
            currentRole={user?.rol || 'Administrador'}
            onSwitch={switchRole}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Tarjeta de Perfil y Rol Actual */}
        <View style={[styles.profileCard, shadows.card]}>
          <View style={styles.profileAvatar}>
            <User size={28} color={colors.primary[600]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nombre || 'Miguel'}</Text>
            <View style={styles.roleBadgeRow}>
              {isAdmin ? (
                <ShieldCheck size={14} color={colors.primary[700]} />
              ) : (
                <User size={14} color={colors.neutral[600]} />
              )}
              <Text style={styles.profileRole}>{user?.rol || 'Administrador'}</Text>
            </View>
          </View>
        </View>

        {/* Lista de Módulos según Rol */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeading}>
            {isAdmin ? 'Módulos Administrativos (Miguel):' : 'Módulos de Ruta (Vendedor):'}
          </Text>

          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.82}
                onPress={() => router.push(item.route as never)}
              >
                <View style={[styles.menuCard, shadows.card]}>
                  <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                    <Icon size={22} color={item.color} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.neutral[300]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ajustes de Red / Demo */}
        <View style={styles.systemSection}>
          <Text style={styles.sectionHeading}>Herramientas de Red:</Text>

          <TouchableOpacity activeOpacity={0.82} onPress={toggleOnline}>
            <View style={[styles.menuCard, shadows.card]}>
              <View style={[styles.menuIcon, { backgroundColor: online ? colors.success[50] : colors.error[50] }]}>
                {online ? <Wifi size={22} color={colors.success[600]} /> : <WifiOff size={22} color={colors.error[500]} />}
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Modo {online ? 'En Línea (Online)' : 'Sin Conexión (Offline)'}</Text>
                <Text style={styles.menuSubtitle}>Cambiar estado para simulación en ruta</Text>
              </View>
              <ChevronRight size={20} color={colors.neutral[300]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.82} onPress={logout}>
            <View style={[styles.menuCard, shadows.card]}>
              <View style={[styles.menuIcon, { backgroundColor: colors.error[50] }]}>
                <LogOut size={22} color={colors.error[500]} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuTitle, { color: colors.error[600] }]}>Cerrar Sesión</Text>
                <Text style={styles.menuSubtitle}>Regresar a pantalla de acceso</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profileRole: {
    fontSize: fontSize.xs + 1,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  menuSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    marginBottom: spacing.xs + 2,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  systemSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
});
