import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Map as MapIcon, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { clientes } from '@/constants/mockData';
import { Card, Badge, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, getEstadoColor, todayDia } from '@/utils/helpers';
import type { Cliente } from '@/types';

export default function RutaScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const diaActual = todayDia();
  const clientesHoy = clientes.filter((c) => c.diasVisita.includes(diaActual));
  const filtered = clientesHoy.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Ruta Centro</Text>
            <Text style={styles.subtitle}>{clientesHoy.length} clientes · {diaActual === 'Lun' ? 'Lunes' : diaActual}</Text>
          </View>
          <ConnectivityIndicator />
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente"
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.mapBtn} onPress={() => router.push('/(tabs)/ruta/mapa')}>
          <MapIcon size={18} color={colors.primary[600]} />
          <Text style={styles.mapBtnText}>Ver ruta en mapa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.map((cliente, index) => (
          <ClienteRow key={cliente.id} cliente={cliente} secuencia={index + 1} onPress={() => router.push('/(tabs)/ruta/cliente/' + cliente.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ClienteRow({ cliente, secuencia, onPress }: { cliente: Cliente; secuencia: number; onPress: () => void }) {
  const estadoColor = getEstadoColor(cliente.estado);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.clientCard}>
        <View style={styles.secuencia}>
          <Text style={styles.secuenciaText}>{secuencia}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{cliente.nombre}</Text>
          <View style={styles.addressRow}>
            <MapPin size={13} color={colors.neutral[400]} />
            <Text style={styles.address}>{cliente.direccion}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.saldo}>Saldo: <Text style={[styles.saldoValue, { color: cliente.saldo > 0 ? colors.error[600] : colors.neutral[600] }]}>{formatCurrency(cliente.saldo)}</Text></Text>
            <Text style={styles.ultimaVisita}>Última: {cliente.ultimaVisita}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Badge label={cliente.estado} color={estadoColor} />
          <ChevronRight size={20} color={colors.neutral[300]} style={{ marginTop: spacing.sm }} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.neutral[0],
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    fontFamily: 'Inter-Regular',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  mapBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  secuencia: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secuenciaText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  address: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 6,
  },
  saldo: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  saldoValue: {
    fontWeight: fontWeight.semibold,
  },
  ultimaVisita: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  cardRight: {
    alignItems: 'flex-end',
  },
});
