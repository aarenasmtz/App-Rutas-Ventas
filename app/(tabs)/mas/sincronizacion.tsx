import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  CloudCheck,
  CloudOff,
  DownloadCloud,
  Trash2,
  ShoppingCart,
  DollarSign,
  Receipt,
  RotateCcw,
  Zap,
  Server,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';
import { offlineSyncQueue, type SyncQueueItem } from '@/services/offlineSyncQueueService';
import { formatCurrency } from '@/utils/helpers';

export default function SincronizacionScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [online, setOnline] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [preloading, setPreloading] = useState<boolean>(false);

  const checkConnection = async () => {
    const health = await DataService.checkSyncHealth();
    setOnline(health.online);
    setPingMs(health.pingMs);
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    const unsubscribe = DataService.subscribeToSyncQueue((q) => {
      setQueue([...q]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const stats = offlineSyncQueue.getStats();

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await DataService.syncAll();
      await checkConnection();
      if (res && res.sincronizadasCorrectas > 0) {
        Alert.alert(
          'Sincronización Exitosa',
          `Se enviaron y procesaron ${res.sincronizadasCorrectas} operaciones en SQL Server.`
        );
      } else if (res && res.duplicadasOmitidas > 0) {
        Alert.alert(
          'Todo al día',
          `Las operaciones ya estaban registradas en el servidor.`
        );
      } else {
        Alert.alert('Cola al día', 'No hay operaciones pendientes por sincronizar.');
      }
    } catch (err: any) {
      Alert.alert(
        'Modo Fuera de Línea',
        'No se pudo conectar al servidor. Las operaciones siguen protegidas localmente en tu dispositivo y se enviarán automáticamente en cuanto recuperes señal.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handlePreloadCatalog = async () => {
    if (preloading) return;
    setPreloading(true);
    try {
      const res = await DataService.preloadCatalog();
      Alert.alert(
        'Catálogo Pre-cargado',
        `Se han descargado en caché local ${res.productos} productos y ${res.clientes} clientes para operar 100% offline en ruta.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo descargar el catálogo.');
    } finally {
      setPreloading(false);
    }
  };

  const handleClearCompleted = () => {
    DataService.clearCompletedSync();
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'venta':
        return <ShoppingCart size={18} color={colors.primary[600]} />;
      case 'abono':
        return <DollarSign size={18} color={colors.success[600]} />;
      case 'gasto':
        return <Receipt size={18} color={colors.error[500]} />;
      case 'devolucion':
        return <RotateCcw size={18} color={colors.warning[600]} />;
      default:
        return <Zap size={18} color={colors.neutral[600]} />;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Motor de Sincronización"
        subtitle="Offline-First & Cola de Mensajería"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={checkConnection} />}
      >
        {/* Banner de Estado de Conectividad con Ping */}
        <View
          style={[
            styles.statusBanner,
            shadows.card,
            { backgroundColor: online ? '#065F46' : '#991B1B' },
          ]}
        >
          <View style={styles.statusBannerTop}>
            <View style={styles.statusIconWrap}>
              {online ? <CloudCheck size={28} color="#A7F3D0" /> : <CloudOff size={28} color="#FECACA" />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.onlineBadgeRow}>
                <Text style={styles.statusTitle}>
                  {online ? 'Conectado al Servidor' : 'Operando en Modo Offline'}
                </Text>
                {online && (
                  <View style={styles.pingPill}>
                    <Text style={styles.pingText}>{pingMs} ms</Text>
                  </View>
                )}
              </View>
              <Text style={styles.statusSubtitle}>
                {online
                  ? 'Transmisión bidireccional directa con SQL Server'
                  : 'Sin conexión. Las transacciones se guardan en la cola local'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjetas de Métricas de la Cola */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadows.card]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.success[50] }]}>
              <CheckCircle2 size={18} color={colors.success[600]} />
            </View>
            <Text style={styles.statValue}>{stats.sincronizadas}</Text>
            <Text style={styles.statLabel}>Sincronizadas</Text>
          </View>

          <View style={[styles.statCard, shadows.card]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.warning[50] }]}>
              <Clock size={18} color={colors.warning[600]} />
            </View>
            <Text style={[styles.statValue, { color: colors.warning[700] }]}>
              {stats.pendientes}
            </Text>
            <Text style={styles.statLabel}>En cola local</Text>
          </View>

          <View style={[styles.statCard, shadows.card]}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.error[50] }]}>
              <AlertCircle size={18} color={colors.error[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.error[600] }]}>{stats.errores}</Text>
            <Text style={styles.statLabel}>Con reintento</Text>
          </View>
        </View>

        {/* Botones Principales de Sincronización */}
        <View style={styles.actionButtonsWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={syncing}
            onPress={handleSyncNow}
            style={[styles.syncBtn, syncing && { opacity: 0.7 }]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.neutral[0]} />
            ) : (
              <>
                <RefreshCw size={18} color={colors.neutral[0]} />
                <Text style={styles.syncBtnText}>
                  {stats.pendientes > 0
                    ? `Sincronizar ${stats.pendientes} pendientes`
                    : 'Verificar y sincronizar todo'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={preloading}
            onPress={handlePreloadCatalog}
            style={styles.preloadBtn}
          >
            {preloading ? (
              <ActivityIndicator size="small" color={colors.primary[700]} />
            ) : (
              <>
                <DownloadCloud size={18} color={colors.primary[600]} />
                <Text style={styles.preloadBtnText}>Pre-cargar catálogo para ruta offline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sección de Operaciones en Cola */}
        <View style={styles.queueHeaderRow}>
          <Text style={styles.sectionHeading}>Registro de Cola de Operaciones:</Text>
          {stats.sincronizadas > 0 && (
            <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
              <Trash2 size={13} color={colors.neutral[400]} />
              <Text style={styles.clearBtnText}>Limpiar procesadas</Text>
            </TouchableOpacity>
          )}
        </View>

        {queue.length === 0 ? (
          <View style={[styles.emptyCard, shadows.card]}>
            <ShieldCheck size={36} color={colors.success[500]} />
            <Text style={styles.emptyTitle}>Cola al día</Text>
            <Text style={styles.emptySub}>
              Todas las ventas, cobros y movimientos de ruta están sincronizados en SQL Server.
            </Text>
          </View>
        ) : (
          <View style={styles.queueList}>
            {queue.map((item) => {
              const isSync = item.estado === 'Sincronizado' || item.estado === 'DuplicadoOmitido';
              const isPend = item.estado === 'Pendiente' || item.estado === 'Sincronizando';
              const isErr = item.estado === 'Error';

              return (
                <View key={item.id} style={[styles.itemCard, shadows.card]}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemIconWrap}>{getTipoIcon(item.tipo)}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.descripcion}</Text>
                      <Text style={styles.itemMeta}>
                        Clave: {item.idempotencyKey} ·{' '}
                        {new Date(item.fechaCreacion).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {item.monto !== undefined && item.monto > 0 && (
                      <Text style={styles.itemMonto}>{formatCurrency(item.monto)}</Text>
                    )}
                  </View>

                  <View style={styles.itemDivider} />

                  <View style={styles.itemBottom}>
                    <View
                      style={[
                        styles.badge,
                        isSync
                          ? styles.badgeSync
                          : isPend
                          ? styles.badgePend
                          : styles.badgeErr,
                      ]}
                    >
                      {item.estado === 'Sincronizando' ? (
                        <ActivityIndicator size="small" color={colors.primary[600]} />
                      ) : null}
                      <Text
                        style={[
                          styles.badgeText,
                          isSync
                            ? styles.badgeTextSync
                            : isPend
                            ? styles.badgeTextPend
                            : styles.badgeTextErr,
                        ]}
                      >
                        {item.estado}
                      </Text>
                    </View>

                    {item.errorDetalle ? (
                      <Text style={styles.errorText} numberOfLines={1}>
                        {item.errorDetalle}
                      </Text>
                    ) : item.folioAsignado ? (
                      <Text style={styles.folioText}>Folio: {item.folioAsignado}</Text>
                    ) : (
                      <Text style={styles.intentosText}>Intentos: {item.intentos}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: 110,
    gap: spacing.md,
  },
  statusBanner: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  statusBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  pingPill: {
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  pingText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: '#D1FAE5',
  },
  statusSubtitle: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  actionButtonsWrap: {
    gap: spacing.sm,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  syncBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  preloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    paddingVertical: spacing.md,
  },
  preloadBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  clearBtnText: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  emptyCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  queueList: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
  },
  itemMeta: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  itemMonto: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.xs,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeSync: {
    backgroundColor: colors.success[50],
  },
  badgePend: {
    backgroundColor: colors.warning[50],
  },
  badgeErr: {
    backgroundColor: colors.error[50],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  badgeTextSync: {
    color: colors.success[700],
  },
  badgeTextPend: {
    color: colors.warning[700],
  },
  badgeTextErr: {
    color: colors.error[700],
  },
  folioText: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
  intentosText: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  errorText: {
    fontSize: 10,
    color: colors.error[600],
    maxWidth: 180,
  },
});
