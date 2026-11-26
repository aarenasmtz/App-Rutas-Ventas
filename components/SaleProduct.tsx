import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, Plus, ChevronRight } from 'lucide-react-native';
import type { Producto } from '@/types';
import { colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';

interface Props {
  producto: Producto;
  price: number;
  quantity: number;
  favorite: boolean;
  list: boolean;
  width: number | '100%';
  onFavorite: () => void;
  onPress: () => void;
  onDetails: () => void;
}

/** Two renderings of the same cart data; editing lives outside the narrow tile. */
export function SaleProduct({ producto: p, price, quantity, favorite, list, width, onFavorite, onPress, onDetails }: Props) {
  const pending = p.estadoConfiguracion === 'Pendiente';
  const unit = p.presentaciones?.length === 1 ? p.presentaciones[0].nombre : p.manejaMultiplesPresentaciones ? 'Presentaciones' : p.unidad;
  return <View style={[styles.card, { width: list ? '100%' : width }, list && styles.list, quantity > 0 && styles.added, pending && styles.pending]}>
    <View style={[styles.heading, list && styles.listHeading]}>
      <Text style={styles.unit} numberOfLines={1}>{unit}</Text>
      <TouchableOpacity onPress={onFavorite} style={styles.star} accessibilityRole="button" accessibilityLabel={`${favorite ? 'Quitar de favoritos' : 'Marcar favorito'}: ${p.nombre}`} accessibilityState={{ selected: favorite }}>
        <Star size={18} color={favorite ? colors.primary[600] : colors.neutral[400]} fill={favorite ? colors.primary[600] : 'transparent'} />
      </TouchableOpacity>
    </View>
    <TouchableOpacity onPress={onDetails} style={[styles.description, list && styles.listDescription]} accessibilityLabel={`Ver nombre completo: ${p.nombre}`}>
      <Text style={[styles.name, list && styles.listName]} numberOfLines={list ? 2 : 3}>{p.nombre}</Text>
      <Text style={styles.price} numberOfLines={1}>{formatCurrency(price)}</Text>
      {list && <Text style={styles.stock}>Disponible: {p.existencia} {p.unidad}</Text>}
    </TouchableOpacity>
    <TouchableOpacity onPress={onPress} disabled={pending} style={[styles.quantity, quantity > 0 && styles.quantityAdded, list && styles.listQuantity]} accessibilityRole="button" accessibilityLabel={`${quantity > 0 ? 'Editar cantidad' : 'Agregar'}: ${p.nombre}`}>
      {pending ? <Text style={styles.quantityText}>Pendiente</Text> : <>
        <Text style={styles.quantityText}>{quantity > 0 ? Number(quantity.toFixed(3)) : 'Agregar'}</Text>
        {quantity > 0 ? <ChevronRight size={14} color={colors.primary[700]} /> : <Plus size={14} color={colors.primary[700]} />}
      </>}
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.neutral[200], borderRadius: 13, backgroundColor: colors.neutral[0], padding: 6 },
  added: { borderColor: colors.primary[300], backgroundColor: colors.primary[50] },
  pending: { opacity: 0.65 },
  heading: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  unit: { flex: 1, fontSize: 11, color: colors.neutral[600] },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  description: { minHeight: 84, justifyContent: 'space-between', paddingBottom: 7 },
  name: { fontSize: 13, lineHeight: 17, fontWeight: '700', color: colors.neutral[900] },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary[800], marginTop: 5 },
  stock: { color: colors.neutral[500], fontSize: 12, marginTop: 4 },
  quantity: { minHeight: 44, borderRadius: 9, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[100] },
  quantityAdded: { backgroundColor: colors.primary[100] },
  quantityText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  list: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  listHeading: { flexDirection: 'column-reverse', width: 60 },
  listDescription: { flex: 1, minHeight: 64, justifyContent: 'center' },
  listName: { fontSize: 15, lineHeight: 20 },
  listQuantity: { minWidth: 80, paddingHorizontal: 8 },
});
