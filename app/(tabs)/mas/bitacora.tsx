import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { getEstadoColor } from '@/utils/helpers';

export default function BitacoraScreen() {
  const router = useRouter();
  const { bitacora, bitacoraErrores } = useApp();
  const [tab, setTab] = useState<'actividad' | 'errores'>('actividad');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Bitácora" subtitle="Registro del sistema" onBack={() => router.back()} />

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, tab === 'actividad' && styles.tabActive]} onPress={() => setTab('actividad')}>
          <Text style={[styles.tabText, tab === 'actividad' && styles.tabTextActive]}>Actividad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'errores' && styles.tabActive]} onPress={() => setTab('errores')}>
          <Text style={[styles.tabText, tab === 'errores' && styles.tabTextActive]}>Errores técnicos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {tab === 'actividad'
          ? bitacora.map((b) => (
              <Card key={b.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.fecha}>{b.fecha}</Text>
                  <Badge label={b.modulo} color="azul" />
                </View>
                <Text style={styles.accion}>{b.accion}</Text>
                <Text style={styles.usuario}>Usuario: {b.usuario}</Text>
              </Card>
            ))
          : bitacoraErrores.map((e) => (
              <Card key={e.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.fecha}>{e.fecha}</Text>
                  <Badge label={e.estado} color={getEstadoColor(e.estado)} />
                </View>
                <Text style={styles.errorText}>{e.error}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>Usuario: {e.usuario}</Text>
                  <Text style={styles.meta}>Dispositivo: {e.dispositivo}</Text>
                </View>
              </Card>
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  tabsRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.neutral[100] },
  tabActive: { backgroundColor: colors.primary[600] },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[500] },
  tabTextActive: { color: colors.neutral[0] },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm - 2 },
  fecha: { fontSize: fontSize.xs, color: colors.neutral[400], fontWeight: fontWeight.semibold },
  accion: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  usuario: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 4 },
  errorText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.error[600] },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  meta: { fontSize: fontSize.xs, color: colors.neutral[500] },
});
