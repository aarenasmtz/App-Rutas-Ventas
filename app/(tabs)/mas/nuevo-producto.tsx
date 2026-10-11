import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { categorias } from '@/constants/mockData';
import { ScreenHeader } from '@/components/shared';
import type { Categoria, Unidad } from '@/types';

export default function NuevoProductoScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Jamón');
  const [unidad, setUnidad] = useState<Unidad>('kg');
  const [precioBase, setPrecioBase] = useState('');
  const [existencia, setExistencia] = useState('');

  const handleGuardar = async () => {
    if (!nombre.trim()) { Alert.alert('Ingresa el nombre del producto'); return; }
    const precio = parseFloat(precioBase) || 0;
    if (precio <= 0) { Alert.alert('Ingresa un precio válido'); return; }
    const exist = parseFloat(existencia) || 0;

    await DataService.createProducto({
      nombre: nombre.trim(),
      categoria,
      unidad,
      precioBase: precio,
      existencia: exist,
      precioPorPeso: unidad === 'kg',
    });
    Alert.alert('Producto agregado', `${nombre} se agregó al catálogo`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Nuevo producto" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Nombre del producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Jamón Virginia"
            placeholderTextColor={colors.neutral[400]}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chipsRow}>
            {categorias.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, categoria === c && styles.chipActive]}
                onPress={() => setCategoria(c)}
              >
                <Text style={[styles.chipText, categoria === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Unidad de venta</Text>
          <View style={styles.unidadesRow}>
            {(['kg', 'pieza', 'paquete'] as Unidad[]).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unidadBtn, unidad === u && styles.unidadBtnActive]}
                onPress={() => setUnidad(u)}
              >
                <Text style={[styles.unidadText, unidad === u && styles.unidadTextActive]}>
                  {u === 'kg' ? 'Por peso (kg)' : u === 'pieza' ? 'Por pieza' : 'Por paquete'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.label}>Precio base</Text>
            <View style={styles.currencyWrap}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor={colors.neutral[300]}
                value={precioBase}
                onChangeText={setPrecioBase}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.label}>Existencia inicial</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.neutral[300]}
              value={existencia}
              onChangeText={setExistencia}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
          <Check size={22} color={colors.neutral[0]} />
          <Text style={styles.saveBtnText}>Guardar producto</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  field: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600], marginBottom: spacing.sm },
  input: { backgroundColor: colors.neutral[0], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: colors.neutral[900], fontFamily: 'Inter-Regular', borderWidth: 1.5, borderColor: colors.neutral[200], ...shadows.card },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.neutral[100] },
  chipActive: { backgroundColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  chipTextActive: { color: colors.neutral[0] },
  unidadesRow: { flexDirection: 'row', gap: spacing.sm },
  unidadBtn: { flex: 1, backgroundColor: colors.neutral[100], borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  unidadBtnActive: { backgroundColor: colors.primary[600] },
  unidadText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  unidadTextActive: { color: colors.neutral[0] },
  row: { flexDirection: 'row' },
  currencyWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1.5, borderColor: colors.neutral[200], ...shadows.card },
  currencySymbol: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.neutral[400], marginRight: spacing.xs },
  currencyInput: { flex: 1, paddingVertical: spacing.md, fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary[600], marginHorizontal: spacing.md, marginTop: spacing.xl, borderRadius: radius.md, paddingVertical: spacing.md + 2 },
  saveBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
