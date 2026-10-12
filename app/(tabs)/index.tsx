import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShoppingBag,
  Users,
  Package,
  MapPin,
  Wallet,
  Scissors,
  ClipboardCheck,
  Boxes,
  Settings,
  TrendingUp,
  CreditCard,
  Truck,
  ArrowRight,
  LogOut,
  Bell,
  Database,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/helpers';
import {
  AppShell,
  DashboardTile,
  RoleSwitcher,
  MoneyDisplay,
} from '@/components/DesignSystem';
import { mockClientes, DataService } from '@/services/mockDataService';

export default function HomeScreen() {
  const router = useRouter();
  const { user, switchRole, logout, setClienteActivoId } = useApp();
  const isAdmin = user?.rol === 'Administrador';

  const [resumen, setResumen] = useState({
    ventasHoy: 0,
    cobranzaHoy: 0,
    creditoColocadoHoy: 0,
    efectivoEnCaja: 0,
    clientesVisitados: 0,
    clientesTotalRuta: 0,
    totalPiezasVendidas: 0,
    clienteCercano: null as any,
  });
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fecha dinámica real en español
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const fechaHoyFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const live = await DataService.getDashboardResumen();
        if (isMounted && live) {
          setResumen((prev) => ({
            ...prev,
            ...live,
            clienteCercano: live.clienteCercano || prev.clienteCercano,
          }));
          setIsLiveConnected(true);
        }
      } catch {
        // Fallback
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  // Siguiente cliente o cercano para venta rápida
  const clienteCercano = resumen.clienteCercano || null;

  const handleVenderACercano = () => {
    if (clienteCercano?.id) {
      setClienteActivoId(clienteCercano.id);
    }
    router.push('/(tabs)/venta');
  };

  return (
    <AppShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cabecera Principal */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hola, {user?.nombre || 'Miguel'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={styles.date}>{fechaHoyFormateada} · {user?.rutaNombre || 'Ruta Centro'}</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: isLiveConnected ? colors.success[100] : colors.neutral[200],
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isLiveConnected ? colors.success[600] : colors.neutral[500]
                  }} />
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isLiveConnected ? colors.success[700] : colors.neutral[600]
                  }}>
                    {isLiveConnected ? 'API .NET 9' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={logout} style={styles.logoutBtn}>
              <LogOut size={18} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Selector interactivo de Rol para pruebas de UX */}
          <View style={styles.roleWrap}>
            <Text style={styles.roleHelpLabel}>Vista activa:</Text>
            <RoleSwitcher
              currentRole={user?.rol || 'Administrador'}
              onSwitch={switchRole}
            />
          </View>
        </View>

        {/* Indicadores rápidos (KPIs conectados a base de datos) */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, shadows.card]}>
            <View style={styles.kpiHeader}>
              <TrendingUp size={16} color={colors.primary[600]} />
              <Text style={styles.kpiLabel}>Ventas hoy</Text>
            </View>
            <MoneyDisplay amount={resumen.ventasHoy} size="lg" color={colors.primary[700]} />
            <Text style={styles.kpiSub}>{resumen.totalPiezasVendidas} piezas vendidas</Text>
          </View>

          <View style={[styles.kpiCard, shadows.card]}>
            <View style={styles.kpiHeader}>
              <Wallet size={16} color={colors.success[600]} />
              <Text style={styles.kpiLabel}>Cobrado</Text>
            </View>
            <MoneyDisplay amount={resumen.cobranzaHoy} size="lg" color={colors.success[700]} />
            <Text style={styles.kpiSub}>Efectivo y transfers</Text>
          </View>
        </View>

        <View style={styles.kpiContainerSecondary}>
          <View style={[styles.kpiCardMini, shadows.card]}>
            <CreditCard size={15} color={colors.warning[600]} />
            <View>
              <Text style={styles.kpiMiniLabel}>Crédito colocado</Text>
              <MoneyDisplay amount={resumen.creditoColocadoHoy} size="sm" color={colors.warning[700]} />
            </View>
          </View>

          <View style={[styles.kpiCardMini, shadows.card]}>
            <Truck size={15} color={colors.neutral[600]} />
            <View>
              <Text style={styles.kpiMiniLabel}>Ruta avance</Text>
              <Text style={styles.kpiMiniVal}>{resumen.clientesVisitados} de {resumen.clientesTotalRuta} visitas</Text>
            </View>
          </View>
        </View>

        {/* Banner de Acción Rápida: Cliente Cercano Detectado */}
        {clienteCercano ? (
          <View style={[styles.proximityBanner, shadows.card]}>
            <View style={styles.proxLeft}>
              <View style={styles.proxPin}>
                <MapPin size={20} color={colors.primary[600]} />
              </View>
              <View style={styles.proxInfo}>
                <View style={styles.proxTag}>
                  <Text style={styles.proxTagText}>ESTÁS CERCA</Text>
                </View>
                <Text style={styles.proxClientName}>{clienteCercano.nombre}</Text>
                <Text style={styles.proxClientOwner}>{clienteCercano.propietario} · Saldo: {formatCurrency(clienteCercano.saldo)}</Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleVenderACercano} style={styles.proxActionBtn}>
              <Text style={styles.proxActionBtnText}>Vender</Text>
              <ArrowRight size={16} color={colors.neutral[0]} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Sección: Mosaicos Táctiles según Rol */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Módulos de Operación</Text>
          <Text style={styles.sectionSubtitle}>
            {isAdmin ? 'Panel completo de Miguel (Admin)' : 'Operación rápida de Vendedor'}
          </Text>
        </View>

        <View style={styles.mosaicGrid}>
          {/* 1. VENDER (Operación Principal con mayor jerarquía) */}
          <View style={styles.fullRow}>
            <DashboardTile
              title="VENDER"
              subtitle="Iniciar venta rápida en mostrador o ruta"
              icon={<ShoppingBag size={28} color={colors.neutral[0]} strokeWidth={2.4} />}
              isHero={true}
              badge="PRIORIDAD #1"
              onPress={() => router.push('/(tabs)/venta')}
            />
          </View>

          {/* 2. CLIENTES */}
          <View style={styles.gridRow}>
            <DashboardTile
              title="CLIENTES"
              subtitle="Cartera y saldos"
              icon={<Users size={24} color={colors.primary[600]} />}
              badge="5 hoy"
              onPress={() => router.push('/(tabs)/clientes')}
            />

            {/* 3. INVENTARIO */}
            <DashboardTile
              title={isAdmin ? 'INVENTARIO' : 'MI INVENTARIO'}
              subtitle={isAdmin ? 'Bodega y rutas' : 'En camioneta'}
              icon={<Package size={24} color={colors.success[600]} />}
              color={colors.success[600]}
              bgColor={colors.success[50]}
              onPress={() => router.push('/(tabs)/inventario')}
            />
          </View>

          {/* 4. RUTA y COBRANZA */}
          <View style={styles.gridRow}>
            <DashboardTile
              title={isAdmin ? 'RUTAS' : 'MI RUTA'}
              subtitle="Secuencia del día"
              icon={<MapPin size={24} color={colors.primary[600]} />}
              onPress={() => router.push('/(tabs)/ruta')}
            />

            <DashboardTile
              title="COBRANZA"
              subtitle="Abonos y recibos"
              icon={<Wallet size={24} color={colors.warning[600]} />}
              color={colors.warning[600]}
              bgColor={colors.warning[50]}
              badge="Cobrar"
              onPress={() => router.push('/(tabs)/mas/cobranza')}
            />
          </View>

          {/* Módulos exclusivos para ADMIN (Miguel) */}
          {isAdmin && (
            <>
              <View style={styles.gridRow}>
                <DashboardTile
                  title="CORTES"
                  subtitle="Cortes por trabajador"
                  icon={<Scissors size={24} color={colors.primary[700]} />}
                  badge="3 rutas"
                  onPress={() => router.push('/(tabs)/mas/corte')}
                />

                <DashboardTile
                  title="REVISIÓN"
                  subtitle="Auditoría rápida stock"
                  icon={<ClipboardCheck size={24} color={colors.success[700]} />}
                  color={colors.success[700]}
                  bgColor={colors.success[50]}
                  badge="Pendiente"
                  onPress={() => router.push('/(tabs)/mas/revision')}
                />
              </View>

              <View style={styles.gridRow}>
                <DashboardTile
                  title="PRODUCTOS"
                  subtitle="Catálogo y precios"
                  icon={<Boxes size={24} color={colors.neutral[700]} />}
                  color={colors.neutral[700]}
                  bgColor={colors.neutral[100]}
                  onPress={() => router.push('/(tabs)/mas/productos')}
                />

                <DashboardTile
                  title="CONFIG"
                  subtitle="Ajustes y reportes"
                  icon={<Settings size={24} color={colors.neutral[700]} />}
                  color={colors.neutral[700]}
                  bgColor={colors.neutral[100]}
                  onPress={() => router.push('/(tabs)/mas')}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  date: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  logoutBtn: {
    padding: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
  },
  roleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  roleHelpLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    fontWeight: fontWeight.semibold,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.xs,
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    fontWeight: fontWeight.semibold,
  },
  kpiSub: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginTop: 2,
  },
  kpiContainerSecondary: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  kpiCardMini: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  kpiMiniLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
  },
  kpiMiniVal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  proximityBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: '#eff6ff',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  proxPin: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proxInfo: {
    flex: 1,
  },
  proxTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 2,
  },
  proxTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.neutral[0],
    letterSpacing: 0.5,
  },
  proxClientName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  proxClientOwner: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  proxActionBtn: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proxActionBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 1,
  },
  mosaicGrid: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  fullRow: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
