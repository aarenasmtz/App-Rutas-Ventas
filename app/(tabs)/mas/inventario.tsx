import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { productos } from '@/constants/mockData';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { getStockEstado, getEstadoColor } from '@/utils/helpers';

export default function InventarioScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = productos.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()));
  const totalProductos = productos.length;
  const agotados = productos.filter((p) => p.existencia <= 0).length;
  const bajos = productos.filter((p) => getStockEstado(p.existencia, p.precioPorPeso) === 'Bajo').length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Inventario" subtitle="Camioneta" onBack={() => router.back()} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProductos}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.warning[600] }]}>{bajos}</Text>
          <Text style={styles.statLabel}>Stock bajo</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error[600] }]}>{agotados}</Text>
          <Text style={styles.statLabel}>Agotados</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.neutral[400]} />
        <TextInput style={styles.searchInput} placeholder="Buscar producto" placeholderTextColor={colors.neutral[400]} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {filtered.map((p) => {
          const estado = getStockEstado(p.existencia, p.precioPorPeso);
          const estadoColor = getEstadoColor(estado);
          return (
            <Card key={p.id} style={styles.productCard}>
              <View style={styles.productLeft}>
                <View style={styles.productIcon}><Text style={styles.productIconText}>{p.categoria.charAt(0)}</Text></View>
                <View>
                  <Text style={styles.productName}>{p.nombre}</Text>
                  <Text style={styles.productCat}>{p.categoria}</Text>
                </View>
              </View>
              <View style={styles.productRight}>
                <Text style={[styles.productQty, { color: estado === 'Agotado' ? colors.error[600] : colors.neutral[900] }]}>
                  {p.existencia} {p.unidad}
                </Text>
                <Badge label={estado} color={estadoColor} />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { useState } from 'react';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  statsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.neutral[0], borderRadius: radius.md, padding: spacing.md, alignItems: 'center', ...shadows.card },
  statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], marginHorizontal: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm, marginBottom: spacing.md, ...shadows.card },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.neutral[900], fontFamily: 'Inter-Regular' },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  productIconText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary[700] },
  productName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  productCat: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  productRight: { alignItems: 'flex-end' },
  productQty: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: 4 },
});
