import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { clientes } from '@/constants/mockData';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getEstadoColor } from '@/utils/helpers';

type Filtro = 'Todos' | 'Al corriente' | 'Con saldo' | 'Vencidos';

export default function CreditosScreen() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('Todos');

  const filtered = useMemo(() => {
    if (filtro === 'Todos') return clientes;
    if (filtro === 'Al corriente') return clientes.filter((c) => c.saldo === 0);
    if (filtro === 'Con saldo') return clientes.filter((c) => c.saldo > 0 && c.saldo <= c.limiteCredito);
    if (filtro === 'Vencidos') return clientes.filter((c) => c.saldo > c.limiteCredito);
    return clientes;
  }, [filtro]);

  const totalCartera = filtered.reduce((s, c) => s + c.saldo, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Créditos" subtitle={`Cartera: ${formatCurrency(totalCartera)}`} onBack={() => router.back()} />

      <View style={styles.filterRow}>
        {(['Todos', 'Al corriente', 'Con saldo', 'Vencidos'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {filtered.map((c) => {
          const vencido = c.saldo > c.limiteCredito;
          const estadoLabel = vencido ? 'Vencido' : c.saldo === 0 ? 'Al corriente' : 'Con saldo';
          const estadoColor = getEstadoColor(estadoLabel);
          return (
            <Card key={c.id} style={styles.card} onPress={() => router.push('/(tabs)/ruta/cliente/' + c.id)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.clientName}>{c.nombre}</Text>
                  <Text style={styles.clientOwner}>{c.propietario}</Text>
                </View>
                <Badge label={estadoLabel} color={estadoColor} />
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Saldo</Text>
                  <Text style={[styles.statValue, { color: c.saldo > 0 ? colors.error[600] : colors.success[600] }]}>{formatCurrency(c.saldo)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Disponible</Text>
                  <Text style={styles.statValue}>{formatCurrency(c.limiteCredito - c.saldo)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Próxima visita</Text>
                  <Text style={styles.statValue}>{c.diasVisita[0] || '—'}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.neutral[100] },
  chipActive: { backgroundColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  chipTextActive: { color: colors.neutral[0] },
  list: { flex: 1, padding: spacing.md, paddingTop: 0 },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md - 4 },
  clientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  clientOwner: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  cardBottom: { flexDirection: 'row', backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.neutral[200] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[900], marginTop: 2 },
});
