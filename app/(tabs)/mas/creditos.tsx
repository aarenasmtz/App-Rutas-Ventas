import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { Card, Badge, ScreenHeader } from '@/components/shared';
import { formatCurrency, getEstadoColor } from '@/utils/helpers';
import { DataService, mockClientes } from '@/services/mockDataService';
import type { Cliente } from '@/types';

type Filtro = 'Todos' | 'Al corriente' | 'Con saldo' | 'Vencidos';

export default function CreditosScreen() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('Todos');
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  const loadSolicitudes = async () => {
    try {
      const data = await DataService.getSolicitudesSobregiro('Pendiente');
      if (Array.isArray(data)) setSolicitudes(data);
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await DataService.getClientes();
        if (isMounted) setClientesList(data ?? []);
        loadSolicitudes();
      } catch {
        // Fallback
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (filtro === 'Todos') return clientesList;
    if (filtro === 'Al corriente') return clientesList.filter((c) => c.saldo === 0);
    if (filtro === 'Con saldo') return clientesList.filter((c) => c.saldo > 0 && c.saldo <= c.limiteCredito);
    if (filtro === 'Vencidos') return clientesList.filter((c) => c.saldo > c.limiteCredito);
    return clientesList;
  }, [clientesList, filtro]);

  const handleResolver = async (tokenSolicitud: string, autorizado: boolean) => {
    try {
      const res = await DataService.resolverSobregiro({
        tokenSolicitud,
        autorizado,
      });
      Alert.alert(
        autorizado ? 'Sobregiro Autorizado' : 'Sobregiro Rechazado',
        res.message || 'Se registró la resolución.'
      );
      setSolicitudes((prev) => prev.filter((s) => s.tokenSolicitud !== tokenSolicitud));
    } catch {
      Alert.alert('Error', 'No se pudo resolver la solicitud de sobregiro.');
    }
  };

  const totalCartera = filtered.reduce((s, c) => s + c.saldo, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Créditos" subtitle={`Cartera: ${formatCurrency(totalCartera)}`} onBack={() => router.back()} />

      <View style={styles.filterRow}>
        {(['Todos', 'Al corriente', 'Con saldo', 'Vencidos'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {solicitudes.length > 0 && (
        <View style={styles.solicitudesContainer}>
          <Text style={styles.solicitudesHeader}>🔔 Solicitudes de Sobregiro de Choferes ({solicitudes.length})</Text>
          {solicitudes.map((s) => (
            <View key={s.tokenSolicitud} style={styles.solicitudCard}>
              <View style={styles.solicitudInfo}>
                <Text style={styles.solicitudCliente}>{s.clienteNombre}</Text>
                <Text style={styles.solicitudChofer}>Chofer: {s.choferNombre} · Solicitado: {formatCurrency(s.montoSolicitado)}</Text>
                <Text style={styles.solicitudDetalle}>
                  Límite: {formatCurrency(s.limiteCredito)} · Excedente: <Text style={{ color: colors.error[600], fontWeight: 'bold' }}>{formatCurrency(s.excedente)}</Text>
                </Text>
              </View>
              <View style={styles.solicitudActions}>
                <TouchableOpacity
                  style={styles.btnRechazar}
                  onPress={() => handleResolver(s.tokenSolicitud, false)}
                >
                  <Text style={styles.btnActionText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAutorizar}
                  onPress={() => handleResolver(s.tokenSolicitud, true)}
                >
                  <Text style={styles.btnActionText}>Autorizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <ScrollView keyboardShouldPersistTaps="handled" style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {filtered.map((c) => {
          const vencido = c.saldo > c.limiteCredito;
          const estadoLabel = vencido ? 'Vencido' : c.saldo === 0 ? 'Al corriente' : 'Con saldo';
          const estadoColor = getEstadoColor(estadoLabel);
          return (
            <Card key={c.id} style={styles.card} onPress={() => router.push(('/(tabs)/ruta/cliente/' + c.id) as any)}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.clientName}>{c.nombre}</Text>
                  <Text style={styles.clientOwner}>{c.propietario}</Text>
                </View>
                <Badge label={estadoLabel} color={estadoColor} />
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Saldo</Text>
                  <Text style={[styles.statValue, { color: c.saldo > 0 ? colors.error[600] : colors.success[600] }]}>{formatCurrency(c.saldo)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Disponible</Text>
                  <Text style={styles.statValue}>{formatCurrency(c.limiteCredito - c.saldo)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Próxima visita</Text>
                  <Text style={styles.statValue}>{c.diasVisita[0] || '—'}</Text>
                </View>
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.neutral[100] },
  chipActive: { backgroundColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral[600] },
  chipTextActive: { color: colors.neutral[0] },
  list: { flex: 1, padding: spacing.md, paddingTop: 0 },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md - 4 },
  clientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  clientOwner: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  cardBottom: { flexDirection: 'row', backgroundColor: colors.neutral[50], borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.neutral[200] },
  statLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  statValue: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.neutral[900], marginTop: 2 },
  solicitudesContainer: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  solicitudesHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#92400e',
    marginBottom: 4,
  },
  solicitudCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  solicitudInfo: {
    flex: 1,
  },
  solicitudCliente: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  solicitudChofer: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 1,
  },
  solicitudDetalle: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    marginTop: 2,
  },
  solicitudActions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnAutorizar: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  btnRechazar: {
    backgroundColor: colors.error[600],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
});