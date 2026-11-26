import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ShoppingBag, Users, Wallet, ArrowRight, LogOut, Receipt } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { DataService } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';
import { AppShell } from '@/components/DesignSystem';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, carrito } = useApp();
  const [summary, setSummary] = useState({ ventasHoy: 0, cobranzaHoy: 0, creditoColocadoHoy: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([DataService.getDashboardResumen(), DataService.getVentas(30), DataService.isLive()])
      .then(([data, sales, live]) => {
        if (!active) return;
        setSummary(data);
        setRecent([...sales].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()).slice(0, 3));
        setConnected(live);
      }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useFocusEffect(load);
  const date = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return <AppShell>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>VENTAS MIGUEL</Text><Text style={styles.greeting}>Hola, {user?.nombre}</Text><Text style={styles.date}>{date}</Text></View>
        <TouchableOpacity onPress={logout} style={styles.iconButton} accessibilityLabel="Cerrar sesión"><LogOut size={20} color={colors.primary[700]} /></TouchableOpacity>
      </View>
      <View style={styles.status}><View style={[styles.dot, { backgroundColor: connected ? colors.success[600] : colors.warning[600] }]} /><Text style={styles.statusText}>{connected ? 'En línea' : 'Datos del dispositivo'}</Text><Text style={styles.role}>{user?.rol}</Text></View>
      <TouchableOpacity onPress={() => router.push('/(tabs)/venta')} style={styles.hero} accessibilityLabel="Nueva venta">
        <View style={styles.heroIcon}><ShoppingBag size={27} color={colors.neutral[0]} /></View><View style={{ flex: 1 }}><Text style={styles.heroTitle}>Nueva venta</Text><Text style={styles.heroSubtitle}>{carrito.length ? 'Continuar la venta en curso' : 'Selecciona un cliente y comienza'}</Text></View><ArrowRight size={23} color={colors.neutral[0]} />
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Tu día, de un vistazo</Text>
      <View style={styles.metrics}>
        {[
          { label: 'Ventas de hoy', value: summary.ventasHoy },
          { label: 'Cobrado', value: summary.cobranzaHoy },
          { label: 'Crédito colocado', value: summary.creditoColocadoHoy },
        ].map((metric, index) => <View key={metric.label} style={[styles.metric, index === 0 && styles.metricActive]}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1}>{formatCurrency(metric.value)}</Text></View>)}
      </View>
      <View style={styles.shortcuts}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/clientes')} style={styles.shortcut}><Users size={21} color={colors.primary[600]} /><Text style={styles.shortcutText}>Clientes</Text><ArrowRight size={16} color={colors.primary[600]} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mas/cobranza')} style={styles.shortcut}><Wallet size={21} color={colors.primary[600]} /><Text style={styles.shortcutText}>Cobrar</Text><ArrowRight size={16} color={colors.primary[600]} /></TouchableOpacity>
      </View>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Ventas recientes</Text><TouchableOpacity onPress={() => router.push('/(tabs)/mas/ventas')} style={styles.seeAll}><Text style={styles.link}>Ver todas</Text></TouchableOpacity></View>
      {loading ? <ActivityIndicator color={colors.primary[600]} style={{ marginVertical: 24 }} /> : error ? <TouchableOpacity onPress={load} style={styles.empty}><Text style={styles.meta}>No se pudo cargar el resumen. Toca para reintentar.</Text></TouchableOpacity> : recent.length === 0 ? <View style={styles.empty}><Receipt size={28} color={colors.neutral[400]} /><Text style={styles.emptyTitle}>Aún no hay ventas</Text><Text style={styles.meta}>Tus próximas ventas aparecerán aquí.</Text></View> : <View style={styles.sales}>
        {recent.map(sale => {
          const credit = (sale.pagos || []).some((p: any) => p.metodo === 'Crédito' && p.monto > 0);
          return <TouchableOpacity key={sale.folio || sale.id} style={styles.sale} onPress={() => router.push('/(tabs)/mas/ventas')}>
            <View style={styles.saleIcon}><Receipt size={20} color={colors.primary[600]} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.saleName}>{sale.cliente?.nombre || sale.clienteNombre || 'Venta de mostrador'}</Text><Text style={styles.meta}>{new Date(sale.fechaHora).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.amount}>{formatCurrency(sale.total)}</Text><Text style={[styles.badge, credit && styles.credit]}>{sale.estado === 'Cancelada' ? 'Cancelada' : credit ? 'Con crédito' : 'Pagado'}</Text></View>
          </TouchableOpacity>;
        })}
      </View>}
    </ScrollView>
  </AppShell>;
}
const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    color: colors.primary[600],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 4,
  },
  date: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 4,
    textTransform: 'capitalize',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    minHeight: 44,
    minWidth: 44,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  role: {
    fontSize: 11,
    color: colors.primary[700],
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  hero: {
    backgroundColor: colors.primary[600],
    padding: 16,
    minHeight: 80,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[0],
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.primary[100],
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.neutral[800],
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  metricActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  metricLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    minHeight: 30,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 4,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  shortcut: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 12,
  },
  shortcutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  link: {
    color: colors.primary[600],
    fontSize: 13,
    fontWeight: '600',
  },
  sales: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  sale: {
    minHeight: 76,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  saleIcon: {
    width: 32,
    alignItems: 'center',
  },
  saleName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  badge: {
    fontSize: 11,
    color: colors.success[700],
    marginTop: 4,
  },
  credit: {
    color: colors.warning[700],
  },
  empty: {
    padding: 24,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[700],
  },
});
