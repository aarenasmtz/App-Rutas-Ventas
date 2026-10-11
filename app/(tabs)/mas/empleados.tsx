import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, User, MapPin, DollarSign, Wallet, CheckCircle, RefreshCw } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import { DataService, mockEmpleados } from '@/services/mockDataService';
import { formatCurrency } from '@/utils/helpers';

export default function EmpleadosScreen() {
  const router = useRouter();
  const [empleadosList, setEmpleadosList] = useState<any[]>(mockEmpleados);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DataService.getEmpleados();
      if (data && data.length > 0) {
        setEmpleadosList(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <AppShell>
      <PageHeader
        title="Equipo de Trabajo"
        subtitle="Vendedores en ruta y administradores"
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

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Cargando plantilla de vendedores...</Text>
          </View>
        ) : (
          empleadosList.map((e) => {
            const isAdmin = e.rol === 'Administrador';

            return (
              <View key={e.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, isAdmin ? styles.avatarAdmin : styles.avatarVendedor]}>
                    {isAdmin ? (
                      <Shield size={24} color={colors.primary[700]} />
                    ) : (
                      <User size={24} color="#059669" />
                    )}
                  </View>

                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.nombre}>{e.nombre}</Text>
                      <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeVendedor]}>
                        <Text style={[styles.roleText, isAdmin ? styles.roleTextAdmin : styles.roleTextVendedor]}>
                          {e.rol}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routeRow}>
                      <MapPin size={13} color={colors.neutral[400]} style={{ marginRight: 4 }} />
                      <Text style={styles.routeText}>{e.ruta || 'Sin ruta asignada'}</Text>
                    </View>
                  </View>
                </View>

                {/* Métricas de Jornada del Empleado */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Ventas Hoy</Text>
                    <Text style={styles.statValue}>{formatCurrency(e.ventasHoy || 0)}</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Cobranza</Text>
                    <Text style={[styles.statValue, { color: '#059669' }]}>
                      {formatCurrency(e.cobranzaHoy || 0)}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Visitas</Text>
                    <Text style={[styles.statValue, { color: colors.primary[700] }]}>
                      {e.clientesVisitados || 0} tiendas
                    </Text>
                  </View>
                </View>

                {/* Estado de Conexión / Permiso */}
                <View style={styles.footerRow}>
                  <View style={styles.statusDotRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.statusLabel}>Activo en campo</Text>
                  </View>
                  <Text style={styles.userCode}>Usuario: @{e.usuario || e.nombre.toLowerCase().replace(/\s+/g, '')}</Text>
                </View>
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
  list: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
    gap: spacing.md,
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
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdmin: {
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  avatarVendedor: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombre: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  roleBadgeVendedor: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  roleText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  roleTextAdmin: {
    color: colors.primary[700],
  },
  roleTextVendedor: {
    color: '#059669',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[200],
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: fontWeight.medium,
  },
  userCode: {
    fontSize: 11,
    color: colors.neutral[400],
  },
});
