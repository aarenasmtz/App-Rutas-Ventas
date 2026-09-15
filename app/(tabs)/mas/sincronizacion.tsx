import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { RefreshCw, CheckCircle2, Clock, AlertCircle, CloudCheck, CloudOff } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { movimientosSync } from '@/constants/mockData';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { useApp } from '@/context/AppContext';
import { getEstadoColor } from '@/utils/helpers';

export default function SincronizacionScreen() {
  const router = useRouter();
  const { online } = useApp();

  const sincronizados = movimientosSync.filter((m) => m.estado === 'Sincronizado').length;
  const pendientes = movimientosSync.filter((m) => m.estado === 'Pendiente').length;
  const errores = movimientosSync.filter((m) => m.estado === 'Error').length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Sincronización" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={[styles.statusCard, { backgroundColor: online ? colors.success[600] : colors.error[500] }]}>
          {online ? <CloudCheck size={32} color={colors.neutral[0]} /> : <CloudOff size={32} color={colors.neutral[0]} />}
          <Text style={styles.statusText}>{online ? 'Conectado' : 'Sin conexión'}</Text>
          <Text style={styles.statusSub}>{online ? 'Los datos se sincronizan automáticamente' : 'Los datos se guardarán localmente'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <CheckCircle2 size={24} color={colors.success[600]} />
            <Text style={styles.statValue}>{sincronizados}</Text>
            <Text style={styles.statLabel}>Sincronizadas</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color={colors.warning[600]} />
            <Text style={styles.statValue}>{pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <AlertCircle size={24} color={colors.error[500]} />
            <Text style={styles.statValue}>{errores}</Text>
            <Text style={styles.statLabel}>Errores</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Operaciones</Text>
        {movimientosSync.map((m) => (
          <Card key={m.id} style={styles.opCard}>
            <View style={styles.opLeft}>
              <View style={[styles.opIcon, { backgroundColor: m.estado === 'Sincronizado' ? colors.success[50] : m.estado === 'Pendiente' ? colors.warning[50] : colors.error[50] }]}>
                {m.estado === 'Sincronizado' ? <CheckCircle2 size={18} color={colors.success[600]} /> : <Clock size={18} color={colors.warning[600]} />}
              </View>
              <View>
                <Text style={styles.opTipo}>{m.tipo}</Text>
                <Text style={styles.opCliente}>{m.cliente}</Text>
              </View>
            </View>
            <View style={styles.opRight}>
              <Text style={styles.opHora}>{m.fecha}</Text>
              <Badge label={m.estado} color={getEstadoColor(m.estado)} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  statusCard: { margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  statusText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[0], marginTop: spacing.sm },
  statusSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.neutral[0], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs, ...shadows.card },
  statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[700], paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  opCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  opLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  opIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  opTipo: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  opCliente: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  opRight: { alignItems: 'flex-end' },
  opHora: { fontSize: fontSize.xs, color: colors.neutral[400], marginBottom: 4 },
});
