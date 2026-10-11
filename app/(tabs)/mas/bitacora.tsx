import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Activity, AlertTriangle, RefreshCw, Smartphone, Clock, Server } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';

type TabTipo = 'Todos' | 'Actividad' | 'Seguridad' | 'Error';

export default function BitacoraScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabTipo>('Todos');
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DataService.getBitacora({
        tipo: tab === 'Todos' ? undefined : tab,
        limite: 100,
      });
      setEventos(data || []);
    } catch {
      // Fallback local
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusBadge = (estado: string) => {
    if (estado === 'Error') {
      return { bg: colors.error[50], border: colors.error[100], text: colors.error[700], label: 'Error' };
    }
    if (estado === 'Advertencia') {
      return { bg: colors.warning[50], border: colors.warning[100], text: colors.warning[700], label: 'Advertencia' };
    }
    return { bg: colors.success[50], border: colors.success[100], text: colors.success[700], label: 'Correcto' };
  };

  const getModuloColor = (modulo: string) => {
    switch (modulo?.toLowerCase()) {
      case 'ventas':
        return colors.primary[700];
      case 'cobranza':
        return '#059669';
      case 'auth':
      case 'seguridad':
        return '#7c3aed';
      case 'inventario':
        return '#d97706';
      case 'sync':
        return '#0284c7';
      default:
        return colors.neutral[600];
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Bitácora de Auditoría"
        subtitle="Monitoreo de actividad, seguridad y eventos"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={colors.primary[700]} />
          </TouchableOpacity>
        }
      />

      {/* Tabs de Filtro */}
      <View style={styles.tabsContainer}>
        {(['Todos', 'Actividad', 'Seguridad', 'Error'] as TabTipo[]).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              {t === 'Seguridad' && <Shield size={14} color={active ? '#fff' : colors.neutral[600]} style={{ marginRight: 4 }} />}
              {t === 'Actividad' && <Activity size={14} color={active ? '#fff' : colors.neutral[600]} style={{ marginRight: 4 }} />}
              {t === 'Error' && <AlertTriangle size={14} color={active ? '#fff' : colors.neutral[600]} style={{ marginRight: 4 }} />}
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'Error' ? 'Errores' : t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Listado de Eventos */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Consultando bitácora en SQL Server...</Text>
          </View>
        ) : eventos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Server size={36} color={colors.neutral[400]} />
            <Text style={styles.emptyTitle}>Sin eventos registrados</Text>
            <Text style={styles.emptySubtitle}>No hay registros para la categoría seleccionada.</Text>
          </View>
        ) : (
          eventos.map((ev) => {
            const badge = getStatusBadge(ev.estado);
            const moduloColor = getModuloColor(ev.modulo);

            return (
              <View key={ev.id} style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.moduloBadge, { backgroundColor: moduloColor + '15', borderColor: moduloColor + '30' }]}>
                      <Text style={[styles.moduloText, { color: moduloColor }]}>{ev.modulo || 'Sistema'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={colors.neutral[400]} style={{ marginRight: 4 }} />
                    <Text style={styles.timeText}>{ev.hora || ev.fecha}</Text>
                  </View>
                </View>

                <Text style={styles.actionText}>{ev.accion}</Text>

                <View style={styles.footerRow}>
                  <View style={styles.userBadge}>
                    <Text style={styles.userText}>👤 {ev.usuario || 'Operador'}</Text>
                  </View>

                  {ev.dispositivo ? (
                    <View style={styles.deviceRow}>
                      <Smartphone size={12} color={colors.neutral[400]} style={{ marginRight: 4 }} />
                      <Text style={styles.deviceText} numberOfLines={1}>{ev.dispositivo}</Text>
                    </View>
                  ) : null}
                </View>

                {ev.detalle ? (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailText} numberOfLines={2}>{ev.detalle}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary[700],
  },
  tabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral[600],
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: fontWeight.bold,
  },
  list: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
    gap: spacing.sm,
  },
  centerLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  emptyCard: {
    padding: spacing.xl,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduloBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  moduloText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
  actionText: {
    fontSize: fontSize.sm + 0.5,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    fontWeight: fontWeight.medium,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  deviceText: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  detailBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.neutral[50],
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  detailText: {
    fontSize: 10.5,
    color: colors.neutral[600],
    fontFamily: 'monospace',
  },
});
