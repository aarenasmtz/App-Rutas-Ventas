import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { DollarSign, CreditCard, Wallet, TrendingUp, MapPin, Navigation, ChevronRight, Bell, LogOut } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Card, Badge, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, todayStr } from '@/utils/helpers';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout, clientes, ventas, gastos, iniciarVisita } = useApp();

  const hoy = todayStr();
  const ventasHoyArr = ventas.filter((v) => v.fecha === hoy);
  const ventasHoy = ventasHoyArr.reduce((s, v) => s + v.total, 0);
  const cobranza = ventasHoyArr.reduce(
    (s, v) => s + v.pagos.filter((p) => p.metodo === 'Efectivo' || p.metodo === 'Transferencia').reduce((ss, p) => ss + p.monto, 0),
    0,
  );
  const creditoVendido = ventasHoyArr.reduce(
    (s, v) => s + v.pagos.filter((p) => p.metodo === 'Crédito').reduce((ss, p) => ss + p.monto, 0),
    0,
  );
  const gastosEfectivoHoy = gastos.filter((g) => g.fecha === hoy && g.metodo === 'Efectivo').reduce((s, g) => s + g.importe, 0);
  const cajaActual = 500 + cobranza - gastosEfectivoHoy;

  const clientesVisitados = clientes.filter((c) =>
    ['Visitado', 'Venta realizada', 'Sin compra', 'Cerrado'].includes(c.estado),
  ).length;
  const clientesTotal = clientes.length;
  const siguienteCliente = clientes.find((c) => c.estado === 'Pendiente');
  const progreso = clientesTotal > 0 ? (clientesVisitados / clientesTotal) * 100 : 0;
  const fechaStr = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Buenos días, {user?.nombre}</Text>
            <Text style={styles.date}>{fechaStr}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={22} color={colors.neutral[0]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={logout}>
              <LogOut size={20} color={colors.neutral[0]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Ruta actual</Text>
            <Text style={styles.routeName}>Ruta Centro</Text>
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progreso}%` }]} />
            </View>
            <Text style={styles.progressText}>{clientesVisitados} de {clientesTotal} clientes</Text>
          </View>
        </View>
      </View>

      <View style={styles.connRow}>
        <ConnectivityIndicator />
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <TrendingUp size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(ventasHoy)}</Text>
            <Text style={styles.statLabel}>Ventas hoy</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Wallet size={20} color={colors.success[600]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(cobranza)}</Text>
            <Text style={styles.statLabel}>Cobranza</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrapAmber}>
              <CreditCard size={20} color={colors.warning[600]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(creditoVendido)}</Text>
            <Text style={styles.statLabel}>Crédito vendido</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <DollarSign size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(cajaActual)}</Text>
            <Text style={styles.statLabel}>Caja actual</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Siguiente cliente</Text>
        {siguienteCliente && (
        <Card style={styles.nextClientCard}>
          <View style={styles.nextClientHeader}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>{siguienteCliente.nombre.charAt(0)}</Text>
            </View>
            <View style={styles.nextClientInfo}>
              <Text style={styles.nextClientName}>{siguienteCliente.nombre}</Text>
              <Text style={styles.nextClientOwner}>{siguienteCliente.propietario}</Text>
              <View style={styles.nextClientAddressRow}>
                <MapPin size={13} color={colors.neutral[400]} />
                <Text style={styles.nextClientAddress}>{siguienteCliente.direccion}</Text>
              </View>
            </View>
            <Badge label="Pendiente" color="amber" />
          </View>

          <View style={styles.nextClientStats}>
            <View style={styles.nextClientStat}>
              <Text style={styles.nextClientStatLabel}>Saldo pendiente</Text>
              <Text style={[styles.nextClientStatValue, { color: colors.error[600] }]}>{formatCurrency(siguienteCliente.saldo)}</Text>
            </View>
            <View style={styles.nextClientStatDivider} />
            <View style={styles.nextClientStat}>
              <Text style={styles.nextClientStatLabel}>Secuencia</Text>
              <Text style={styles.nextClientStatValue}>#1</Text>
            </View>
            <View style={styles.nextClientStatDivider} />
            <View style={styles.nextClientStat}>
              <Text style={styles.nextClientStatLabel}>Visita</Text>
              <Text style={styles.nextClientStatValue}>~09:30</Text>
            </View>
          </View>

          <View style={styles.nextClientActions}>
            <TouchableOpacity
              style={styles.visitBtn}
              onPress={() => {
                if (siguienteCliente) {
                  iniciarVisita(siguienteCliente.id);
                  router.push('/(tabs)/ruta/cliente/' + siguienteCliente.id);
                }
              }}
            >
              <Text style={styles.visitBtnText}>Iniciar visita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn}>
              <Navigation size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </Card>
        )}

        <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/venta')}>
          <Card style={styles.shortcutCard}>
            <View style={styles.shortcutLeft}>
              <View style={styles.shortcutIcon}>
                <TrendingUp size={22} color={colors.primary[600]} />
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Nueva venta</Text>
                <Text style={styles.shortcutSubtitle}>Registra una venta rápida</Text>
              </View>
            </View>
            <ChevronRight size={22} color={colors.neutral[300]} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shortcutRow} onPress={() => router.push('/(tabs)/mas/cobranza')}>
          <Card style={styles.shortcutCard}>
            <View style={styles.shortcutLeft}>
              <View style={[styles.shortcutIcon, { backgroundColor: colors.success[50] }]}>
                <Wallet size={22} color={colors.success[600]} />
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Cobranza</Text>
                <Text style={styles.shortcutSubtitle}>Registra abonos</Text>
              </View>
            </View>
            <ChevronRight size={22} color={colors.neutral[300]} />
          </Card>
        </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  date: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  routeName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  progressWrap: {},
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: 999,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs + 2,
  },
  connRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIconWrapAmber: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.warning[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  nextClientCard: {
    marginBottom: spacing.md,
  },
  nextClientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  nextClientInfo: {
    flex: 1,
  },
  nextClientName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  nextClientOwner: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 1,
  },
  nextClientAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  nextClientAddress: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  nextClientStats: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.md,
  },
  nextClientStat: {
    flex: 1,
    alignItems: 'center',
  },
  nextClientStatDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  nextClientStatLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  nextClientStatValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 2,
  },
  nextClientActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  visitBtn: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutRow: {
    marginBottom: spacing.md,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  shortcutSubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    marginTop: 1,
  },
});
