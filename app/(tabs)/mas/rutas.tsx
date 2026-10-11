import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Map, Users, Check, X } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockClientes } from '@/services/mockDataService';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import type { Cliente } from '@/types';

export default function RutasScreen() {
  const router = useRouter();
  const [rutas, setRutas] = useState<string[]>(['Ruta Centro', 'Ruta Norte', 'Ruta Sur']);
  const clientes = mockClientes;
  const [showForm, setShowForm] = useState(false);
  const [nuevaRuta, setNuevaRuta] = useState('');

  const handleAdd = () => {
    if (!nuevaRuta.trim()) { Alert.alert('Ingresa un nombre para la ruta'); return; }
    if (rutas.includes(nuevaRuta.trim())) { Alert.alert('Esa ruta ya existe'); return; }
    setRutas((prev) => [...prev, nuevaRuta.trim()]);
    setNuevaRuta('');
    setShowForm(false);
    Alert.alert('Ruta creada', `${nuevaRuta} se agregó correctamente`);
  };

  const handleDelete = (ruta: string) => {
    const clientesEnRuta = clientes.filter((c: Cliente) => c.ruta === ruta).length;
    if (clientesEnRuta > 0) {
      Alert.alert('No se puede eliminar', `Esta ruta tiene ${clientesEnRuta} clientes asignados`);
      return;
    }
    Alert.alert(
      'Eliminar ruta',
      `¿Seguro que quieres eliminar "${ruta}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setRutas((prev) => prev.filter((r) => r !== ruta)) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Rutas" subtitle={`${rutas.length} rutas activas`} onBack={() => router.back()} />

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nueva ruta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Ruta Oriente"
            placeholderTextColor={colors.neutral[400]}
            value={nuevaRuta}
            onChangeText={setNuevaRuta}
            autoFocus
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setNuevaRuta(''); }}>
              <X size={18} color={colors.neutral[500]} />
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Check size={18} color={colors.neutral[0]} />
              <Text style={styles.saveBtnText}>Crear ruta</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Plus size={20} color={colors.neutral[0]} />
          <Text style={styles.addBtnText}>Crear nueva ruta</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {rutas.map((ruta: string) => {
          const clientesEnRuta = clientes.filter((c: Cliente) => c.ruta === ruta);
          const totalSaldo = clientesEnRuta.reduce((s: number, c: Cliente) => s + c.saldo, 0);
          return (
            <Card key={ruta} style={styles.rutaCard}>
              <View style={styles.rutaLeft}>
                <View style={styles.rutaIcon}>
                  <Map size={22} color={colors.primary[600]} />
                </View>
                <View>
                  <Text style={styles.rutaName}>{ruta}</Text>
                  <View style={styles.rutaMeta}>
                    <Users size={13} color={colors.neutral[400]} />
                    <Text style={styles.rutaMetaText}>{clientesEnRuta.length} clientes</Text>
                  </View>
                  {totalSaldo > 0 && (
                    <Text style={styles.rutaSaldo}>Saldo total: {formatCurrency(totalSaldo)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.rutaRight}>
                <Badge label={clientesEnRuta.length > 0 ? 'Activa' : 'Sin clientes'} color={clientesEnRuta.length > 0 ? 'verde' : 'neutral'} />
                <TouchableOpacity onPress={() => handleDelete(ruta)} style={styles.deleteBtn}>
                  <Trash2 size={18} color={colors.error[500]} />
                </TouchableOpacity>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary[600], margin: spacing.md, borderRadius: radius.md, paddingVertical: spacing.md + 2 },
  addBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
  formCard: { backgroundColor: colors.neutral[0], margin: spacing.md, borderRadius: radius.lg, padding: spacing.lg, ...shadows.card },
  formTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900], marginBottom: spacing.md },
  input: { backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: colors.neutral[900], fontFamily: 'Inter-Regular', borderWidth: 2, borderColor: colors.primary[600] },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2, backgroundColor: colors.neutral[100], borderRadius: radius.md, paddingVertical: spacing.md },
  cancelText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[500] },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2, backgroundColor: colors.primary[600], borderRadius: radius.md, paddingVertical: spacing.md },
  saveBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[0] },
  rutaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm },
  rutaLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rutaIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  rutaName: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  rutaMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  rutaMetaText: { fontSize: fontSize.xs, color: colors.neutral[400] },
  rutaSaldo: { fontSize: fontSize.xs, color: colors.error[600], marginTop: 2, fontWeight: fontWeight.semibold },
  rutaRight: { alignItems: 'flex-end', gap: 6 },
  deleteBtn: { padding: spacing.xs },
});
