import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { clientes } from '@/constants/mockData';
import { Card, Badge, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, getEstadoColor } from '@/utils/helpers';
import type { Cliente } from '@/types';

type FiltroRuta = 'Todas' | 'Ruta Centro' | 'Ruta Norte' | 'Ruta Sur';
type FiltroSaldo = 'Todos' | 'Al corriente' | 'Con saldo';

export default function ClientesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtroRuta, setFiltroRuta] = useState<FiltroRuta>('Todas');
  const [filtroSaldo, setFiltroSaldo] = useState<FiltroSaldo>('Todos');

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.propietario.toLowerCase().includes(search.toLowerCase());
      const matchRuta = filtroRuta === 'Todas' || c.ruta === filtroRuta;
      const matchSaldo = filtroSaldo === 'Todos' || (filtroSaldo === 'Al corriente' && c.saldo === 0) || (filtroSaldo === 'Con saldo' && c.saldo > 0);
      return matchSearch && matchRuta && matchSaldo;
    });
  }, [search, filtroRuta, filtroSaldo]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Clientes</Text>
            <Text style={styles.subtitle}>{filtered.length} de {clientes.length}</Text>
          </View>
          <ConnectivityIndicator />
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o propietario"
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['Todas', 'Ruta Centro', 'Ruta Norte', 'Ruta Sur'] as FiltroRuta[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filtroRuta === f && styles.chipActive]}
              onPress={() => setFiltroRuta(f)}
            >
              <Text style={[styles.chipText, filtroRuta === f && styles.chipTextActive]}>{f === 'Todas' ? 'Todas las rutas' : f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.saldoFilterRow}>
          {(['Todos', 'Al corriente', 'Con saldo'] as FiltroSaldo[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filtroSaldo === f && styles.chipActive]}
              onPress={() => setFiltroSaldo(f)}
            >
              <Text style={[styles.chipText, filtroSaldo === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.map((c) => (
          <ClienteCompacto key={c.id} cliente={c} onPress={() => router.push('/(tabs)/ruta/cliente/' + c.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ClienteCompacto({ cliente, onPress }: { cliente: Cliente; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{cliente.nombre.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{cliente.nombre}</Text>
            <Text style={styles.owner}>{cliente.propietario}</Text>
            <View style={styles.addressRow}>
              <MapPin size={12} color={colors.neutral[400]} />
              <Text style={styles.address}>{cliente.direccion}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.saldo, { color: cliente.saldo > 0 ? colors.error[600] : colors.success[600] }]}>
            {formatCurrency(cliente.saldo)}
          </Text>
          <Text style={styles.saldoLabel}>{cliente.saldo > 0 ? 'Saldo' : 'Al corriente'}</Text>
          <Badge label={cliente.ruta.replace('Ruta ', '')} color="azul" />
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
  filterRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  saldoFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.neutral[0],
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  owner: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  address: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  saldo: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  saldoLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 1,
    marginBottom: 4,
  },
});
