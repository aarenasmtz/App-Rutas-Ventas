import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  MapPin,
  Map as MapIcon,
  ChevronRight,
  CheckCircle2,
  Truck,
  Users,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, ClientCard } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import type { Cliente } from '@/types';

type TabAtencion = 'Pendientes' | 'Atendidos' | 'Todos';

const TRABAJADORES = [
  { id: 'todos', nombre: 'Todos', ruta: 'Todas las rutas' },
  { id: '1', nombre: 'Juan Pérez', ruta: 'Ruta Lunes / Miércoles' },
  { id: '2', nombre: 'Pedro Ramírez', ruta: 'Ruta Martes / Jueves' },
  { id: '3', nombre: 'Carlos López', ruta: 'Ruta Viernes / Sábado' },
];

export default function RutaScreen() {
  const router = useRouter();
  const { user, setClienteActivoId } = useApp();
  const isAdmin = user?.rol === 'Administrador';

  const [search, setSearch] = useState('');
  const [tabAtencion, setTabAtencion] = useState<TabAtencion>('Pendientes');
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState('todos');
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClientes = async () => {
    try {
      const data = await DataService.getClientes();
      if (data && data.length > 0) {
        setClientesList(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const parseDistance = (d?: string) => {
    if (!d) return 99999;
    const clean = d.toLowerCase().trim();
    if (clean.includes('km')) return (parseFloat(clean) || 0) * 1000;
    return parseFloat(clean) || 99999;
  };

  // Filtrado por ruta de trabajador
  const clientesPorTrabajador = useMemo(() => {
    if (trabajadorSeleccionado === 'todos') return clientesList;
    const trab = TRABAJADORES.find((t) => t.id === trabajadorSeleccionado);
    if (!trab) return clientesList;
    return clientesList.filter((c) => !c.ruta || c.ruta.toLowerCase().includes(trab.ruta.toLowerCase().replace('ruta ', '')));
  }, [clientesList, trabajadorSeleccionado]);

  const pendientesCount = useMemo(() => {
    return clientesPorTrabajador.filter((c) => c.activo !== false && c.estado !== 'Venta realizada' && c.estado !== 'Visitado').length;
  }, [clientesPorTrabajador]);

  const atendidosCount = useMemo(() => {
    return clientesPorTrabajador.filter((c) => c.activo !== false && (c.estado === 'Venta realizada' || c.estado === 'Visitado')).length;
  }, [clientesPorTrabajador]);

  const filtered = useMemo(() => {
    const list = clientesPorTrabajador.filter((c) => {
      if (c.activo === false) return false;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.propietario.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const isAtendido = c.estado === 'Venta realizada' || c.estado === 'Visitado';

      if (tabAtencion === 'Pendientes') {
        return !isAtendido;
      } else if (tabAtencion === 'Atendidos') {
        return isAtendido;
      }
      return true;
    });

    // Ordenar automáticamente por ubicación (más cercanos primero)
    list.sort((a, b) => parseDistance(a.distanciaMock) - parseDistance(b.distanciaMock));
    return list;
  }, [clientesPorTrabajador, search, tabAtencion]);

  const handleVender = (cliente: Cliente) => {
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/venta');
  };

  const handleCobrar = (cliente: Cliente) => {
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/mas/cobranza');
  };

  const handleVerDetalle = (cliente: Cliente) => {
    router.push(('/(tabs)/ruta/cliente/' + cliente.id) as any);
  };

  return (
    <AppShell>
      <PageHeader
        title={isAdmin ? 'Supervisión de Rutas' : 'Mi Ruta de Entrega'}
        subtitle={isAdmin ? 'Revisión en tiempo real de trabajadores' : 'Secuencia de clientes ordenada por cercanía'}
        right={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/ruta/mapa')}
            style={styles.mapBtnHeader}
          >
            <MapIcon size={16} color="#FFFFFF" />
            <Text style={styles.mapBtnHeaderText}>Mapa</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Selector de trabajadores (Para que Miguel revise las rutas de los trabajadores) */}
        <View style={styles.trabajadoresSection}>
          <Text style={styles.sectionHeading}>
            {isAdmin ? 'Seleccionar Trabajador para revisar ruta:' : 'Ruta Asignada:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trabajadoresRow}>
            {TRABAJADORES.map((trab) => {
              const isSelected = trabajadorSeleccionado === trab.id;
              return (
                <TouchableOpacity
                  key={trab.id}
                  activeOpacity={0.8}
                  onPress={() => setTrabajadorSeleccionado(trab.id)}
                  style={[styles.trabChip, isSelected && styles.trabChipActive]}
                >
                  <Truck size={14} color={isSelected ? colors.neutral[0] : colors.primary[700]} />
                  <Text style={[styles.trabChipText, isSelected && styles.trabChipTextActive]}>
                    {trab.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Buscador Rápido */}
        <View style={styles.searchSection}>
          <View style={styles.searchWrap}>
            <Search size={18} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente en ruta..."
              placeholderTextColor={colors.neutral[400]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Pestañas UX: Por Visitar vs Atendidos vs Todos */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTabAtencion('Pendientes')}
            style={[styles.tabItem, tabAtencion === 'Pendientes' && styles.tabItemActive]}
          >
            <MapPin size={13} color={tabAtencion === 'Pendientes' ? colors.primary[700] : colors.neutral[500]} />
            <Text style={[styles.tabItemText, tabAtencion === 'Pendientes' && styles.tabItemTextActive]}>
              Por Visitar ({pendientesCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTabAtencion('Atendidos')}
            style={[styles.tabItem, tabAtencion === 'Atendidos' && styles.tabItemActive]}
          >
            <CheckCircle2 size={13} color={tabAtencion === 'Atendidos' ? '#15803d' : colors.neutral[500]} />
            <Text style={[styles.tabItemText, tabAtencion === 'Atendidos' && styles.tabItemTextActive]}>
              Atendidos ({atendidosCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTabAtencion('Todos')}
            style={[styles.tabItem, tabAtencion === 'Todos' && styles.tabItemActive]}
          >
            <Text style={[styles.tabItemText, tabAtencion === 'Todos' && styles.tabItemTextActive]}>
              Todos ({clientesPorTrabajador.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aviso de orden por cercanía / ubicación */}
        <View style={styles.locationBanner}>
          <MapPin size={12} color={colors.primary[600]} />
          <Text style={styles.locationBannerText}>
            Ordenados por ubicación · Clientes más cercanos primero
          </Text>
        </View>

        {/* Lista de Clientes con Cards Limpias (UX sin sobrecarga visual) */}
        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={44} color={colors.success[500]} />
              <Text style={styles.emptyTitle}>
                {tabAtencion === 'Pendientes' ? '¡Ruta al día! No hay pendientes' : 'Sin clientes en esta sección'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tabAtencion === 'Pendientes'
                  ? 'Todos los clientes asignados ya fueron visitados.'
                  : 'Revisa las otras pestañas para ver los clientes.'}
              </Text>
            </View>
          ) : (
            filtered.map((c) => (
              <ClientCard
                key={c.id}
                cliente={c}
                onVender={() => handleVender(c)}
                onCobrar={() => handleCobrar(c)}
                onVerDetalle={() => handleVerDetalle(c)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  mapBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  mapBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  trabajadoresSection: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  trabajadoresRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  trabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  trabChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  trabChipText: {
    fontSize: fontSize.xs + 1,
    fontWeight: '600',
    color: colors.primary[800],
  },
  trabChipTextActive: {
    color: colors.neutral[0],
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  tabItemActive: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.primary[500],
    ...shadows.card,
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  tabItemTextActive: {
    fontWeight: '800',
    color: colors.primary[700],
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    backgroundColor: colors.primary[50],
    marginHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  locationBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
  },
  listSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
