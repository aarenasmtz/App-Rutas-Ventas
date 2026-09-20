import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { categoriasConTodas } from '@/constants/mockData';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getStockEstado, getEstadoColor } from '@/utils/helpers';

export default function ProductosScreen() {
  const router = useRouter();
  const { productos, addProducto, deleteProducto } = useApp();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todas');

  const filtered = productos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === 'Todas' || p.categoria === cat;
    return matchSearch && matchCat;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Productos" subtitle={`${productos.length} en catálogo`} onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.neutral[400]} />
        <TextInput style={styles.searchInput} placeholder="Buscar producto" placeholderTextColor={colors.neutral[400]} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {categoriasConTodas.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)}>
            <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.map((p) => {
          const estado = getStockEstado(p.existencia, p.precioPorPeso);
          return (
            <Card key={p.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.productLeft}>
                  <View style={styles.icon}><Text style={styles.iconText}>{p.categoria.charAt(0)}</Text></View>
                  <View>
                    <Text style={styles.name}>{p.nombre}</Text>
                    <Text style={styles.cat}>{p.categoria} · {p.unidad}</Text>
                  </View>
                </View>
                <Badge label={estado} color={getEstadoColor(estado)} />
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>Precio base</Text>
                  <Text style={styles.priceValue}>{formatCurrency(p.precioBase)}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>Existencia</Text>
                  <Text style={styles.priceValue}>{p.existencia} {p.unidad}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/mas/nuevo-producto')}>
        <Plus size={26} color={colors.neutral[0]} />
      </TouchableOpacity>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], margin: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm, ...shadows.card },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.neutral[900], fontFamily: 'Inter-Regular' },
  catRow: { gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.neutral[100] },
  chipActive: { backgroundColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  chipTextActive: { color: colors.neutral[0] },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md - 4 },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary[700] },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  cat: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  cardBottom: { flexDirection: 'row', backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  priceCol: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  priceValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[900], marginTop: 2 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 999, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
