import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { diasSemana } from '@/constants/mockData';
import { ScreenHeader } from '@/components/shared';
import type { DiaVisita } from '@/types';

export default function NuevoClienteScreen() {
  const router = useRouter();
  const [rutas, setRutas] = useState<string[]>(['Ruta Centro', 'Ruta Norte', 'Ruta Sur']);
  const [nombre, setNombre] = useState('');
  const [propietario, setPropietario] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ruta, setRuta] = useState('Ruta Centro');
  const [limiteCredito, setLimiteCredito] = useState('3000');
  const [diasSeleccionados, setDiasSeleccionados] = useState<DiaVisita[]>([]);
  const [nuevaRuta, setNuevaRuta] = useState('');
  const [showNuevaRuta, setShowNuevaRuta] = useState(false);

  const toggleDia = (dia: DiaVisita) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { Alert.alert('Ingresa el nombre del negocio'); return; }
    if (!propietario.trim()) { Alert.alert('Ingresa el nombre del propietario'); return; }
    if (!direccion.trim()) { Alert.alert('Ingresa la dirección'); return; }
    if (diasSeleccionados.length === 0) { Alert.alert('Selecciona al menos un día de visita'); return; }

    let rutaFinal = ruta;
    if (showNuevaRuta && nuevaRuta.trim()) {
      rutaFinal = nuevaRuta.trim();
      setRutas((prev) => [...prev, rutaFinal]);
    }

    await DataService.createCliente({
      nombre: nombre.trim(),
      propietario: propietario.trim(),
      direccion: direccion.trim(),
      ruta: rutaFinal,
      diasVisita: diasSeleccionados,
      limiteCredito: parseFloat(limiteCredito) || 0,
    });

    Alert.alert('Cliente agregado', `${nombre} se agregó correctamente`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Nuevo cliente" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.field}>
          <Text style={styles.label}>Nombre del negocio</Text>
          <TextInput style={styles.input} placeholder="Ej: Abarrotes La Esquina" placeholderTextColor={colors.neutral[400]} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Propietario</Text>
          <TextInput style={styles.input} placeholder="Ej: Juan Pérez" placeholderTextColor={colors.neutral[400]} value={propietario} onChangeText={setPropietario} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dirección</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={18} color={colors.neutral[400]} />
            <TextInput style={styles.inputInline} placeholder="Calle y número, colonia" placeholderTextColor={colors.neutral[400]} value={direccion} onChangeText={setDireccion} autoComplete="street-address" textContentType="fullStreetAddress" autoCorrect autoCapitalize="sentences" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ruta asignada</Text>
          <View style={styles.chipsRow}>
            {rutas.map((r) => (
              <TouchableOpacity key={r} style={[styles.chip, ruta === r && !showNuevaRuta && styles.chipActive]} onPress={() => { setRuta(r); setShowNuevaRuta(false); }}>
                <Text style={[styles.chipText, ruta === r && !showNuevaRuta && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.chip, showNuevaRuta && styles.chipActive]} onPress={() => setShowNuevaRuta(!showNuevaRuta)}>
              <Text style={[styles.chipText, showNuevaRuta && styles.chipTextActive]}>+ Nueva ruta</Text>
            </TouchableOpacity>
          </View>
          {showNuevaRuta && (
            <TextInput style={[styles.input, { marginTop: spacing.sm }]} placeholder="Nombre de la nueva ruta" placeholderTextColor={colors.neutral[400]} value={nuevaRuta} onChangeText={setNuevaRuta} />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Días de visita</Text>
          <View style={styles.diasRow}>
            {diasSemana.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.diaBtn, diasSeleccionados.includes(d) && styles.diaBtnActive]}
                onPress={() => toggleDia(d)}
              >
                <Text style={[styles.diaText, diasSeleccionados.includes(d) && styles.diaTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Límite de crédito</Text>
          <View style={styles.currencyWrap}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput style={styles.currencyInput} placeholder="3000" placeholderTextColor={colors.neutral[300]} value={limiteCredito} onChangeText={setLimiteCredito} keyboardType="decimal-pad" />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
          <Check size={22} color={colors.neutral[0]} />
          <Text style={styles.saveBtnText}>Guardar cliente</Text>
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
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1.5, borderColor: colors.neutral[200], gap: spacing.sm, ...shadows.card },
  inputInline: { flex: 1, paddingVertical: spacing.md, fontSize: fontSize.base, color: colors.neutral[900], fontFamily: 'Inter-Regular' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.neutral[100] },
  chipActive: { backgroundColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  chipTextActive: { color: colors.neutral[0] },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  diaBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  diaBtnActive: { backgroundColor: colors.primary[600] },
  diaText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[500] },
  diaTextActive: { color: colors.neutral[0] },
  currencyWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.neutral[0], borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1.5, borderColor: colors.neutral[200], ...shadows.card },
  currencySymbol: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.neutral[400], marginRight: spacing.xs },
  currencyInput: { flex: 1, paddingVertical: spacing.md, fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary[600], marginHorizontal: spacing.md, marginTop: spacing.xl, borderRadius: radius.md, paddingVertical: spacing.md + 2 },
  saveBtnText: { color: colors.neutral[0], fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
