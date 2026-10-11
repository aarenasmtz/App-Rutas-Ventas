import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Store,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockClientes, DataService } from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import {
  AppShell,
  PageHeader,
  SearchBar,
  ClientCard,
} from '@/components/DesignSystem';
import type { Cliente, DiaVisita } from '@/types';

type FiltroCliente = 'Todos' | 'Hoy' | 'Pendientes de cobro' | 'Con crédito' | 'Cercanos';

const DIAS_SEMANA: DiaVisita[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const RUTAS_DISPONIBLES = ['Ruta Centro', 'Ruta Norte', 'Ruta Sur'];

export default function ClientesScreen() {
  const router = useRouter();
  const { clienteActivoId, setClienteActivoId } = useApp();

  const [search, setSearch] = useState('');
  const [tabAtencion, setTabAtencion] = useState<'Pendientes' | 'Atendidos' | 'Todos'>('Pendientes');
  const [clientesList, setClientesList] = useState<Cliente[]>([]);

  // Modal ABC Cliente
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formPropietario, setFormPropietario] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formColonia, setFormColonia] = useState('Centro');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRuta, setFormRuta] = useState('Ruta Centro');
  const [formDias, setFormDias] = useState<DiaVisita[]>(['Lun', 'Mié', 'Vie']);
  const [formLimiteCredito, setFormLimiteCredito] = useState('5000');
  const [formSaldo, setFormSaldo] = useState('0');

  const loadClientes = async () => {
    try {
      const data = await DataService.getClientes();
      if (data && data.length > 0) {
        setClientesList(data);
      }
    } catch {
      // Fallback
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

  const pendientesCount = useMemo(() => {
    return clientesList.filter((c) => c.activo !== false && c.estado !== 'Venta realizada' && c.estado !== 'Visitado').length;
  }, [clientesList]);

  const atendidosCount = useMemo(() => {
    return clientesList.filter((c) => c.activo !== false && (c.estado === 'Venta realizada' || c.estado === 'Visitado')).length;
  }, [clientesList]);

  const filtered = useMemo(() => {
    const list = clientesList.filter((c) => {
      if (c.activo === false) return false;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.propietario.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q) ||
        (c.telefono && c.telefono.includes(q));

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
  }, [clientesList, search, tabAtencion]);

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setFormNombre('');
    setFormPropietario('');
    setFormDireccion('León, Guanajuato');
    setFormColonia('Centro');
    setFormTelefono('477 ');
    setFormRuta('Ruta Centro');
    setFormDias(['Lun', 'Mié', 'Vie']);
    setFormLimiteCredito('5000');
    setFormSaldo('0');
    setModalVisible(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormNombre(c.nombre);
    setFormPropietario(c.propietario);
    setFormDireccion(c.direccion);
    setFormColonia(c.colonia || 'Centro');
    setFormTelefono(c.telefono || '477 ');
    setFormRuta(c.ruta || 'Ruta Centro');
    setFormDias(c.diasVisita || ['Lun', 'Mié', 'Vie']);
    setFormLimiteCredito((c.limiteCredito || 0).toString());
    setFormSaldo((c.saldo || 0).toString());
    setModalVisible(true);
  };

  const toggleDia = (dia: DiaVisita) => {
    if (formDias.includes(dia)) {
      if (formDias.length > 1) {
        setFormDias(formDias.filter((d) => d !== dia));
      }
    } else {
      setFormDias([...formDias, dia]);
    }
  };

  const handleSaveClient = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del negocio o cliente.');
      return;
    }

    const limCred = parseFloat(formLimiteCredito) || 0;
    const saldo = parseFloat(formSaldo) || 0;

    if (editingCliente) {
      await DataService.updateCliente(editingCliente.id, {
        nombre: formNombre.trim(),
        propietario: formPropietario.trim(),
        direccion: formDireccion.trim(),
        colonia: formColonia.trim(),
        ciudad: 'León, Gto',
        telefono: formTelefono.trim(),
        ruta: formRuta,
        diasVisita: formDias,
        limiteCredito: limCred,
        saldo: saldo,
      });
    } else {
      await DataService.createCliente({
        nombre: formNombre.trim(),
        propietario: formPropietario.trim(),
        direccion: formDireccion.trim(),
        colonia: formColonia.trim(),
        ciudad: 'León, Gto',
        telefono: formTelefono.trim(),
        ruta: formRuta,
        diasVisita: formDias,
        limiteCredito: limCred,
        saldo: saldo,
      });
    }

    await loadClientes();
    setModalVisible(false);
  };

  const handleDeleteClient = (c: Cliente) => {
    Alert.alert(
      'Dar de Baja Cliente',
      `¿Deseas dar de baja a "${c.nombre}"? No aparecerá en la ruta activa.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dar de baja',
          style: 'destructive',
          onPress: async () => {
            await DataService.deleteCliente(c.id);
            await loadClientes();
          },
        },
      ]
    );
  };

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
        title="ABC de Clientes"
        subtitle={`${filtered.length} negocios registrados en León, Guanajuato`}
        right={
          <TouchableOpacity activeOpacity={0.8} onPress={handleOpenCreate} style={styles.createBtnHeader}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.createBtnHeaderText}>Nuevo</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Buscador */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por negocio, dueño, calle o teléfono..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Selector de pestañas UX: Por Visitar vs Atendidos vs Todos */}
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
              Todos ({clientesList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Indicador de orden por ubicación / cercanía */}
        <View style={styles.locationBanner}>
          <MapPin size={12} color={colors.primary[600]} />
          <Text style={styles.locationBannerText}>
            Ordenados por ubicación · Clientes más cercanos primero
          </Text>
        </View>

        {/* Lista de Tarjetas de Cliente Táctiles con ABC */}
        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={44} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No se encontraron clientes</Text>
              <Text style={styles.emptySubtitle}>Agrega un nuevo cliente con el botón superior</Text>
            </View>
          ) : (
            filtered.map((c) => (
              <ClientCard
                key={c.id}
                cliente={c}
                isCurrent={c.id === clienteActivoId}
                onVender={() => handleVender(c)}
                onCobrar={() => handleCobrar(c)}
                onVerDetalle={() => handleVerDetalle(c)}
                onEdit={() => handleOpenEdit(c)}
                onDelete={() => handleDeleteClient(c)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL DE ALTA / EDICIÓN DE CLIENTE EN LEÓN, GUANAJUATO */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente (Alta)'}
                </Text>
                <Text style={styles.modalSubtitle}>Zona y Ruta: León, Guanajuato</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Nombre del negocio */}
              <Text style={styles.inputLabel}>Nombre del Negocio / Tienda *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. ABTS ARENAS, Cremería La Esquina..."
                value={formNombre}
                onChangeText={setFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Propietario / Encargado */}
              <Text style={styles.inputLabel}>Propietario o Encargado</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Aaron Arenas, Marcela Vega..."
                value={formPropietario}
                onChangeText={setFormPropietario}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Teléfono con Lada 477 */}
              <Text style={styles.inputLabel}>Teléfono de Contacto (León Gto · Lada 477)</Text>
              <TextInput
                style={styles.input}
                placeholder="477 713 2450"
                keyboardType="phone-pad"
                value={formTelefono}
                onChangeText={setFormTelefono}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Dirección en León, Guanajuato */}
              <Text style={styles.inputLabel}>Dirección en León, Gto (Calle y Número) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Blvd. Adolfo López Mateos 810, León, Gto"
                value={formDireccion}
                onChangeText={setFormDireccion}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Colonia en León */}
              <Text style={styles.inputLabel}>Colonia (León, Gto)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Centro, San Juan de Dios, Coecillo, León Moderno..."
                value={formColonia}
                onChangeText={setFormColonia}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Ruta Asignada */}
              <Text style={styles.inputLabel}>Ruta Asignada</Text>
              <View style={styles.rutasRow}>
                {RUTAS_DISPONIBLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setFormRuta(r)}
                    style={[styles.rutaBtn, formRuta === r && styles.rutaBtnActive]}
                  >
                    <Text style={[styles.rutaBtnText, formRuta === r && styles.rutaBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Días de Visita */}
              <Text style={styles.inputLabel}>Días de Visita Programados</Text>
              <View style={styles.diasRow}>
                {DIAS_SEMANA.map((dia) => {
                  const isSel = formDias.includes(dia);
                  return (
                    <TouchableOpacity
                      key={dia}
                      onPress={() => toggleDia(dia)}
                      style={[styles.diaChip, isSel && styles.diaChipActive]}
                    >
                      <Text style={[styles.diaChipText, isSel && styles.diaChipTextActive]}>{dia}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Crédito y Saldo */}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Límite de Crédito ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5000"
                    keyboardType="numeric"
                    value={formLimiteCredito}
                    onChangeText={setFormLimiteCredito}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Saldo Actual ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formSaldo}
                    onChangeText={setFormSaldo}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSaveClient} style={styles.saveBtn}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  createBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.lg,
  },
  createBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    padding: 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.lg,
    gap: 5,
  },
  tabItemActive: {
    backgroundColor: colors.neutral[0],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabItemText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabItemTextActive: {
    color: colors.neutral[900],
    fontWeight: '800',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  locationBannerText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  listSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 1.5,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[400],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  modalSubtitle: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  rutasRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  rutaBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  rutaBtnActive: {
    backgroundColor: colors.primary[600],
  },
  rutaBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  rutaBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  diasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  diaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  diaChipActive: {
    backgroundColor: colors.primary[600],
  },
  diaChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  diaChipTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
