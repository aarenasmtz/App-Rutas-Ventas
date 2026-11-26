import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export function WorkflowSteps({ current }: { current: 0 | 1 | 2 }) {
  return <View style={styles.row} accessibilityLabel={`Paso ${current + 1} de 3: ${['Cliente', 'Productos', 'Resumen'][current]}`}>
    {['Cliente', 'Productos', 'Resumen'].map((label, index) => <View key={label} style={styles.step}>
      <View style={[styles.dot, index <= current && styles.active]}>
        {index < current ? <Check size={14} color={colors.neutral[0]} /> : <Text style={[styles.number, index === current && styles.white]}>{index + 1}</Text>}
      </View>
      <Text style={[styles.label, index <= current && styles.selected]}>{label}</Text>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, backgroundColor: colors.neutral[50], borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  number: { fontSize: 12, color: colors.neutral[600], fontWeight: '700' },
  white: { color: colors.neutral[0] },
  label: { fontSize: 12, color: colors.neutral[500] },
  selected: { fontWeight: '700', color: colors.primary[700] },
});
