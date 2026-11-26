import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { BottomSheet } from './shared';
import { PrimaryButton } from './ui';
import { colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';
import type { Producto, PresentacionConfig, ItemCarrito } from '@/types';

export function SaleProductEditor({ producto, items, getPrice, onApply, onClose }: {
  producto: Producto | null;
  items: ItemCarrito[];
  getPrice: (p: Producto, pres?: PresentacionConfig) => number;
  onApply: (pres: PresentacionConfig | undefined, quantity: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<PresentacionConfig | undefined>();
  const [quantity, setQuantity] = useState('1');
  const select = (pres: PresentacionConfig | undefined) => {
    setSelected(pres);
    const existing = items.find(i => i.producto.id === producto?.id && i.presentacion?.tipo === pres?.tipo);
    setQuantity(String(existing?.cantidad ?? 1));
  };
  useEffect(() => {
    select(producto?.presentaciones?.find(p => p.activa !== false));
  // Reset only when the product changes; typing must survive cart/view updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.id]);
  const count = Number(quantity.replace(',', '.'));
  const price = producto ? getPrice(producto, selected) : 0;
  const weight = producto?.unidad === 'kg' && (!selected || selected.piezasEquivalentes === 1);
  return <BottomSheet visible={!!producto} title={producto?.nombre || 'Producto'} onClose={onClose}>
    <Text style={styles.meta}>{producto?.categoria} · Disponible: {producto?.existencia} {producto?.unidad}</Text>
    <Text style={styles.label}>Presentación</Text>
    {(producto?.presentaciones?.filter(p => p.activa !== false) || []).map(p => {
      const added = items.find(i => i.producto.id === producto?.id && i.presentacion?.tipo === p.tipo)?.cantidad;
      return <TouchableOpacity key={p.tipo} onPress={() => select(p)} style={[styles.option, selected?.tipo === p.tipo && styles.selected]} accessibilityRole="radio" aria-checked={selected?.tipo === p.tipo} accessibilityState={{ checked: selected?.tipo === p.tipo }}>
        <View style={{ flex: 1 }}><Text style={styles.name}>{p.nombre}{added ? ` · ${added} en la nota` : ''}</Text><Text style={styles.meta}>{p.descripcionEquivalencia || `1 ${p.nombre} = ${p.piezasEquivalentes} ${producto?.unidad}`}</Text></View>
        <Text style={styles.price}>{producto && formatCurrency(getPrice(producto, p))}</Text>
      </TouchableOpacity>;
    })}
    <Text style={styles.label}>Cantidad{weight ? ' (kg)' : ''}</Text>
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.step} onPress={() => setQuantity(String(Math.max(0, Number(((Number.isFinite(count) ? count : 0) - (weight ? 0.25 : 1)).toFixed(3)))))} accessibilityLabel="Disminuir cantidad"><Minus color={colors.primary[700]} /></TouchableOpacity>
      <TextInput accessibilityLabel="Cantidad a vender" keyboardType={weight ? 'decimal-pad' : 'number-pad'} selectTextOnFocus value={quantity} onChangeText={setQuantity} style={styles.input} />
      <TouchableOpacity style={styles.step} onPress={() => setQuantity(String(Number(((Number.isFinite(count) ? count : 0) + (weight ? 0.25 : 1)).toFixed(3))))} accessibilityLabel="Aumentar cantidad"><Plus color={colors.primary[700]} /></TouchableOpacity>
    </View>
    <View style={styles.total}><Text style={styles.meta}>{formatCurrency(price)} por {selected?.nombre || producto?.unidad}</Text><Text style={styles.price}>{formatCurrency(Number.isFinite(count) ? count * price : 0)}</Text></View>
    <PrimaryButton disabled={producto?.estadoConfiguracion === 'Pendiente'} title={count === 0 ? 'Quitar de la nota' : 'Aplicar cantidad'} onPress={() => {
      if (!Number.isFinite(count) || count < 0 || (!weight && !Number.isInteger(count))) {
        Alert.alert('Cantidad inválida', weight ? 'Ingresa un peso válido.' : 'Ingresa una cantidad entera de presentaciones.'); return;
      }
      onApply(selected, count);
    }} />
    <Text style={styles.hint}>La cantidad se aplica solo a la presentación seleccionada.</Text>
  </BottomSheet>;
}
const styles = StyleSheet.create({
  label: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '700', color: colors.neutral[800] },
  meta: { fontSize: 13, color: colors.neutral[600], flexShrink: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.neutral[900] },
  option: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: colors.neutral[200], borderRadius: 12, marginBottom: 8 },
  selected: { backgroundColor: colors.primary[50], borderColor: colors.primary[600] },
  price: { fontSize: 18, fontWeight: '700', color: colors.primary[700] },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.neutral[300], borderRadius: 12, overflow: 'hidden' },
  step: { width: 56, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] },
  input: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.neutral[900],
    minHeight: 44,
    fontSize: 15,
    borderRadius: 10
  },
  total: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 18 },
  hint: { fontSize: 12, color: colors.neutral[500], textAlign: 'center', marginTop: 12, marginBottom: 16 },
});
