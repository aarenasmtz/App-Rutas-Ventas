import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import type { Producto } from '@/types';
import { colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';
import { desglosarInventario } from '@/utils/multipresentacion';

export function InventoryProduct({ producto: p, onDetails }: { producto: Producto; onDetails: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const multiple = (p.presentaciones?.length || 0) > 1;
  return <View style={styles.card}>
    <Text style={styles.name}>{p.nombre}</Text>
    <Text style={styles.secondary}>{[p.marca, p.categoria].filter(Boolean).join(' · ')}</Text>
    <View style={styles.values}><View style={{flex:1}}><Text style={styles.caption}>Existencia</Text><Text style={styles.value}>{p.existencia.toLocaleString('es-MX')} {p.unidad}</Text></View><View style={{flex:1,alignItems:'flex-end'}}><Text style={styles.caption}>Precio base · {p.unidad}</Text><Text style={styles.value}>{formatCurrency(p.precioBase)}</Text></View></View>
    {multiple && <><TouchableOpacity accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={styles.action}><Text style={styles.actionText}>{expanded?'Ocultar':'Ver'} desglose de presentaciones</Text><ChevronDown size={18} color={colors.primary[700]} /></TouchableOpacity>{expanded && <Text style={styles.breakdown}>{desglosarInventario(p.existencia,p.presentaciones,p.unidad)}</Text>}</>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Detalle de inventario: ${p.nombre}`} onPress={onDetails} style={styles.action}><Text style={styles.actionText}>Ver detalle del producto</Text><ChevronRight size={18} color={colors.primary[700]} /></TouchableOpacity>
  </View>;
}
const styles = StyleSheet.create({
  card:{padding:16,borderRadius:16,borderWidth:1,borderColor:colors.neutral[200],backgroundColor:'#FFFFFF',gap:8},
  name:{fontSize:17,lineHeight:23,fontWeight:'700',color:colors.neutral[900]},
  secondary:{fontSize:14,lineHeight:20,color:colors.neutral[600]},
  values:{flexDirection:'row',gap:12,paddingVertical:8},caption:{fontSize:12,color:colors.neutral[600],marginBottom:5},value:{fontSize:16,fontWeight:'700',color:colors.neutral[900]},
  action:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,borderTopWidth:1,borderColor:colors.neutral[200]},actionText:{flex:1,fontSize:14,color:colors.primary[700]},
  breakdown:{fontSize:14,lineHeight:21,padding:12,backgroundColor:colors.primary[50],borderRadius:8},
});
