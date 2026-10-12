import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
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
  Smartphone,
  X,
  Share2,
  CheckCircle2,
  ArrowRight,
  FileText,
  RotateCcw,
  Fuel,
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
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [platformTab, setPlatformTab] = useState<'ios' | 'android'>('ios');

  // Menú según rol requerido en el prompt
  const adminMenuItems: MenuItem[] = [
    { title: 'Detalle de Ventas', subtitle: 'Historial de ventas y tickets generados', icon: FileText, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/ventas' },
    { title: 'Devoluciones y Cambios', subtitle: 'Cambio de producto dañado/caducado a clientes', icon: RotateCcw, color: colors.error[600], bg: colors.error[50], route: '/(tabs)/mas/devoluciones' },
    { title: 'Gastos de Ruta', subtitle: 'Registrar gasolina, casetas y viáticos', icon: Fuel, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/gastos' },
    { title: 'Surtir Inventario PDF', subtitle: 'Cargar nota de compra diaria y aumentar stock', icon: FileSpreadsheet, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/surtido-nota' },
    { title: 'Trabajadores y Permisos', subtitle: 'Configurar 2 vendedores, PIN y permisos', icon: UserCheck, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/trabajadores' },
    { title: 'Catálogo de Productos', subtitle: 'Altas, bajas y catálogo por peso/pieza', icon: Boxes, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/productos' },
    { title: 'Categorías de Productos', subtitle: 'Administrar familias y emojis de productos', icon: Tag, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/categorias' },
    { title: 'Cartera de Clientes', subtitle: 'Altas, bajas y rutas en León, Guanajuato', icon: Users, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/clientes' },
    { title: 'Corte de Caja', subtitle: 'Arqueo en tiempo real y efectivo de inicio', icon: Scissors, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/corte' },
    { title: 'Cobranza', subtitle: 'Registrar y consultar abonos', icon: Wallet, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/cobranza' },
    { title: 'Rutas Asignadas', subtitle: 'Rutas semanales (Lunes a Sábado)', icon: MapPin, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/rutas' },
    { title: 'Rutas y Mapa', subtitle: 'Secuencia de paradas y mapa León, Gto', icon: MapPin, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/ruta' },
    { title: 'Revisión de Inventario', subtitle: 'Auditoría rápida física vs sistema', icon: ClipboardCheck, color: colors.success[700], bg: colors.success[50], route: '/(tabs)/mas/revision' },
    { title: 'Bitácora de Eventos', subtitle: 'Registro cronológico de todas las actividades', icon: ScrollText, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/bitacora' },
    { title: 'Configuración', subtitle: 'Sincronización y parámetros', icon: Settings, color: colors.neutral[700], bg: colors.neutral[100], route: '/(tabs)/mas/sincronizacion' },
  ];

  const vendedorMenuItems: MenuItem[] = [
    { title: 'Detalle de Ventas', subtitle: 'Mis ventas y tickets del día', icon: FileText, color: colors.primary[700], bg: colors.primary[50], route: '/(tabs)/mas/ventas' },
    { title: 'Devoluciones y Cambios', subtitle: 'Cambios de mercancía con clientes', icon: RotateCcw, color: colors.error[600], bg: colors.error[50], route: '/(tabs)/mas/devoluciones' },
    { title: 'Gastos de Ruta', subtitle: 'Registrar gasolina y viáticos', icon: Fuel, color: colors.warning[600], bg: colors.warning[50], route: '/(tabs)/mas/gastos' },
    { title: 'Cobranza', subtitle: 'Registrar abonos de clientes', icon: Wallet, color: colors.success[600], bg: colors.success[50], route: '/(tabs)/mas/cobranza' },
    { title: 'Corte de Caja', subtitle: 'Arqueo de mi camioneta', icon: Scissors, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/corte' },
    { title: 'Mi ruta', subtitle: 'Secuencia y mapa de visitas', icon: MapPin, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/ruta' },
    { title: 'Perfil y Sincronización', subtitle: 'Datos de la unidad y estado de sync', icon: User, color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/mas/sincronizacion' },
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

        {/* Acceso Directo PWA Móvil (iPhone y Android) */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeading}>Instalación en Celular:</Text>
          <TouchableOpacity activeOpacity={0.82} onPress={() => setShowShortcutModal(true)}>
            <View style={[styles.menuCard, styles.shortcutBanner, shadows.card]}>
              <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
                <Smartphone size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuTitle, { color: colors.primary[800] }]}>📲 Crear Acceso Directo</Text>
                <Text style={styles.menuSubtitle}>Cómo agregar el ícono a la pantalla de tu iPhone o Android</Text>
              </View>
              <ChevronRight size={20} color={colors.primary[600]} />
            </View>
          </TouchableOpacity>
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

      {/* Modal Guía de Acceso Directo Móvil */}
      <Modal visible={showShortcutModal} transparent animationType="slide" onRequestClose={() => setShowShortcutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowShortcutModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Smartphone size={22} color={colors.primary[600]} />
                <Text style={styles.modalTitle}>Acceso Directo en tu Celular</Text>
              </View>
              <TouchableOpacity onPress={() => setShowShortcutModal(false)} style={styles.closeBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Selector de Plataforma */}
            <View style={styles.platformTabs}>
              <TouchableOpacity
                onPress={() => setPlatformTab('ios')}
                style={[styles.platformTab, platformTab === 'ios' && styles.platformTabActive]}
              >
                <Text style={[styles.platformTabText, platformTab === 'ios' && styles.platformTabTextActive]}>
                  🍎 iPhone (Safari)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlatformTab('android')}
                style={[styles.platformTab, platformTab === 'android' && styles.platformTabActive]}
              >
                <Text style={[styles.platformTabText, platformTab === 'android' && styles.platformTabTextActive]}>
                  🤖 Android (Chrome)
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginTop: spacing.sm }}>
              {platformTab === 'ios' ? (
                <View style={styles.guideBlock}>
                  <Text style={styles.guideIntro}>
                    En iPhone puedes usar la app a pantalla completa sin barra de navegación:
                  </Text>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Abre esta página en Safari</Text>
                      <Text style={styles.stepDesc}>Asegúrate de estar en el navegador Safari oficial de tu iPhone.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Toca el botón Compartir</Text>
                      <Text style={styles.stepDesc}>Es el ícono cuadrado con una flecha hacia arriba [ ↑ ] en la barra inferior.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Selecciona "Agregar a inicio"</Text>
                      <Text style={styles.stepDesc}>Desliza hacia abajo en el menú y toca "Agregar a la pantalla de inicio" (o Add to Home Screen).</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Toca "Agregar" arriba a la derecha</Text>
                      <Text style={styles.stepDesc}>¡Listo! Tendrás el ícono de RutaVentas en tu pantalla de inicio y se abrirá como app instalada.</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.guideBlock}>
                  <Text style={styles.guideIntro}>
                    En Android puedes instalar el icono en tu pantalla principal en 2 toques:
                  </Text>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Abre esta página en Google Chrome</Text>
                      <Text style={styles.stepDesc}>Asegúrate de estar navegando desde Chrome en tu teléfono.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Toca los 3 puntos ( ⋮ )</Text>
                      <Text style={styles.stepDesc}>Están ubicados en la esquina superior derecha del navegador.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Toca "Instalar aplicación" o "Agregar a la pantalla principal"</Text>
                      <Text style={styles.stepDesc}>Aparecerá una ventana emergente para confirmar.</Text>
                    </View>
                  </View>

                  <View style={styles.stepRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Toca "Instalar"</Text>
                      <Text style={styles.stepDesc}>¡Listo! Tendrás la app en tus aplicaciones como app nativa.</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalBtnEntendido} onPress={() => setShowShortcutModal(false)}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.modalBtnEntendidoText}>Entendido</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  shortcutBanner: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f8faff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  closeBtn: {
    padding: 4,
  },
  platformTabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    padding: 3,
    gap: 4,
  },
  platformTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  platformTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  platformTabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[500],
  },
  platformTabTextActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.bold,
  },
  guideBlock: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  guideIntro: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  stepTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  stepDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 16,
  },
  modalBtnEntendido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  modalBtnEntendidoText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
