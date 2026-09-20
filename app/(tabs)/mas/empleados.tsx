import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, User } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';

export default function EmpleadosScreen() {
  const router = useRouter();
  const { empleados } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Empleados" subtitle="Vendedores y rutas" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {empleados.map((e) => (
          <Card key={e.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                {e.rol === 'Administrador' ? <Shield size={24} color={colors.primary[700]} /> : <User size={24} color={colors.neutral[600]} />}
              </View>
              <View style={styles.info}>
                <Text style={styles.nombre}>{e.nombre}</Text>
                <Text style={styles.rol}>{e.rol}</Text>
              </View>
              <Badge label={e.estado} color={e.estado === 'Activo' ? 'verde' : 'neutral'} />
            </View>
            <View style={styles.cardBottom}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ruta asignada</Text>
                <Text style={styles.statValue}>{e.ruta}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Ventas hoy</Text>
                <Text style={styles.statValue}>{formatCurrency(e.ventasHoy)}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md - 4 },
  avatar: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  nombre: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  rol: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  cardBottom: { flexDirection: 'row', backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.neutral[200] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[900], marginTop: 2 },
});
