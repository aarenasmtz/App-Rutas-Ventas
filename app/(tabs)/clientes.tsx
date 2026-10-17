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
  ActivityIndicator,
  Platform,
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
  Trash2,
  Navigation,
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

export default function ClientesScreen() {
  const router = useRouter();
  const { clienteActivoId, setClienteActivoId } = useApp();

  const [search, setSearch] = useState('');
  const [tabAtencion, setTabAtencion] = useState<'Pendientes' | 'Atendidos' | 'Todos'>('Pendientes');
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [rutasDisponibles, setRutasDisponibles] = useState<string[]>([
    'Ruta Lunes',
    'Ruta Martes',
    'Ruta Miércoles',
    'Ruta Jueves',
    'Ruta Viernes',
    'Ruta Sábado',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Cliente
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formPropietario, setFormPropietario] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formColonia, setFormColonia] = useState('Centro');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRuta, setFormRuta] = useState('Ruta Lunes');
  const [formDias, setFormDias] = useState<DiaVisita[]>(['Lun', 'Mié', 'Vie']);
  const [formLimiteCredito, setFormLimiteCredito] = useState('5000');
  const [formSaldo, setFormSaldo] = useState('0');

  // GPS Maps Location State
  const [formLatitud, setFormLatitud] = useState<number | null>(null);
  const [formLongitud, setFormLongitud] = useState<number | null>(null);
  const [geocodificando, setGeocodificando] = useState(false);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState<string | null>(null);

  const loadClientes = async () => {
    try {
      const [data, rutas] = await Promise.all([
        DataService.getClientes(),
        DataService.getRutas(),
      ]);
      setClientesList(data ?? []);
      if (rutas && rutas.length > 0) {
        setRutasDisponibles(rutas.map((r: any) => r.nombre));
      }
    } catch {
      // Fallback
    }
  };

  // Capturar coordenadas precisas directamente del GPS del celular en tiempo real
  const handleCapturarGpsActual = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setGeocodificando(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lon = parseFloat(position.coords.longitude.toFixed(6));
          setFormLatitud(lat);
          setFormLongitud(lon);
          setUbicacionConfirmada(`📍 GPS Celular en Vivo: ${lat}, ${lon}`);

          // Intentar geocodificación inversa para auto-completar dirección
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const road = data.address.road || '';
                const houseNumber = data.address.house_number || '';
                const suburb = data.address.suburb || data.address.neighbourhood || '';
                if (road && (!formDireccion || formDireccion === 'León, Guanajuato')) {
                  setFormDireccion(`${road} ${houseNumber}`.trim());
                }
                if (suburb && (!formColonia || formColonia === 'Centro')) {
                  setFormColonia(suburb);
                }
              }
            }
          } catch {}

          setGeocodificando(false);
          Alert.alert('GPS Capturado con Éxito', `Coordenadas del celular de Miguel registradas:\nLatitud: ${lat}\nLongitud: ${lon}`);
        },
        (error) => {
          setGeocodificando(false);
          let msg = 'No se pudo obtener la posición GPS del dispositivo.';
          if (error.code === 1) msg = 'Permiso de ubicación denegado. Permite el acceso a ubicación en tu celular o navegador.';
          else if (error.code === 2) msg = 'Señal de GPS no disponible en este momento.';
          else if (error.code === 3) msg = 'Tiempo de espera de GPS agotado.';
          Alert.alert('Error de GPS Celular', msg);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      Alert.alert('GPS no compatible', 'El navegador de este celular no soporta geolocalización.');
    }
  };

  const handleGeolocalizarDireccion = async () => {
    if (!formDireccion.trim()) {
      Alert.alert('Dirección requerida', 'Ingresa la calle y número para ubicar en el mapa.');
      return;
    }
    setGeocodificando(true);
    const dirTexto = `${formDireccion.trim()}, ${formColonia.trim()}, León, Guanajuato, México`;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dirTexto)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const lon = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setFormLatitud(lat);
          setFormLongitud(lon);
          setUbicacionConfirmada(`GPS Detectado: ${lat}, ${lon}`);
          setGeocodificando(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    setGeocodificando(false);
    Alert.alert(
      'Dirección no ubicada con exactitud',
      'No se encontró la coordenada exacta para esta calle. Te sugerimos pulsar "📡 Capturar GPS actual del Celular" mientras estás en el local del cliente para registrar su posición exacta.'
    );
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
    setFormRuta(rutasDisponibles[0] || 'Ruta Centro');
    setFormDias(['Lun', 'Mié', 'Vie']);
    setFormLimiteCredito('5000');
    setFormSaldo('0');
    setFormLatitud(null);
    setFormLongitud(null);
    setUbicacionConfirmada(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormNombre(c.nombre);
    setFormPropietario(c.propietario);
    setFormDireccion(c.direccion);
    setFormColonia(c.colonia || 'Centro');
    setFormTelefono(c.telefono || '477 ');
    setFormRuta(c.ruta || rutasDisponibles[0] || 'Ruta Centro');
    setFormDias(c.diasVisita || ['Lun', 'Mié', 'Vie']);
    setFormLimiteCredito((c.limiteCredito || 0).toString());
    setFormSaldo((c.saldo || 0).toString());
    setFormLatitud(c.latitud ?? null);
    setFormLongitud(c.longitud ?? null);
    setUbicacionConfirmada(c.latitud && c.longitud ? `GPS: ${c.latitud.toFixed(5)}, ${c.longitud.toFixed(5)}` : null);
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
    if (isSaving) return;
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del negocio o cliente.');
      return;
    }

    setIsSaving(true);
    try {
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
          latitud: formLatitud ?? undefined,
          longitud: formLongitud ?? undefined,
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
          latitud: formLatitud ?? undefined,
          longitud: formLongitud ?? undefined,
        });
      }

      await loadClientes();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error al guardar', err?.message || 'No se pudo guardar el cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = (c: Cliente) => {
    const doDelete = async () => {
      try {
        await DataService.deleteCliente(c.id);
        await loadClientes();
        if (modalVisible) setModalVisible(false);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'No se pudo dar de baja al cliente');
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`¿Deseas dar de baja a "${c.nombre}"? No aparecerá en la ruta activa.`);
      if (ok) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Dar de Baja Cliente',
        `¿Deseas dar de baja a "${c.nombre}"? No aparecerá en la ruta activa.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Dar de baja',
            style: 'destructive',
            onPress: doDelete,
          },
        ]
      );
    }
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
        title="Cartera de Clientes"
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

              {/* Opciones de Ubicación y GPS */}
              <Text style={[styles.inputLabel, { marginTop: 4 }]}>Ubicación y Coordenadas GPS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={handleCapturarGpsActual}
                  disabled={geocodificando}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.success[50],
                    borderWidth: 1.5,
                    borderColor: colors.success[600],
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: radius.md,
                  }}
                >
                  {geocodificando ? (
                    <ActivityIndicator size="small" color={colors.success[700]} />
                  ) : (
                    <>
                      <Navigation size={16} color={colors.success[700]} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success[700] }}>
                        📡 Capturar GPS actual del Celular
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGeolocalizarDireccion}
                  disabled={geocodificando}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.primary[50],
                    borderWidth: 1,
                    borderColor: colors.primary[300],
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: radius.md,
                  }}
                >
                  <MapPin size={16} color={colors.primary[700]} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary[800] }}>
                    🔍 Buscar dirección
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Entradas manuales de Coordenadas */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[600], marginBottom: 4 }}>
                    Latitud GPS
                  </Text>
                  <TextInput
                    style={[styles.input, { paddingVertical: 6, fontSize: 12 }]}
                    placeholder="21.123456"
                    keyboardType="numeric"
                    value={formLatitud !== null && formLatitud !== undefined ? String(formLatitud) : ''}
                    onChangeText={(v) => {
                      const num = parseFloat(v);
                      setFormLatitud(isNaN(num) ? null : num);
                    }}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.neutral[600], marginBottom: 4 }}>
                    Longitud GPS
                  </Text>
                  <TextInput
                    style={[styles.input, { paddingVertical: 6, fontSize: 12 }]}
                    placeholder="-101.678901"
                    keyboardType="numeric"
                    value={formLongitud !== null && formLongitud !== undefined ? String(formLongitud) : ''}
                    onChangeText={(v) => {
                      const num = parseFloat(v);
                      setFormLongitud(isNaN(num) ? null : num);
                    }}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              {ubicacionConfirmada && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.secondary[50],
                    borderWidth: 1,
                    borderColor: colors.secondary[200],
                    padding: 8,
                    borderRadius: radius.md,
                    marginBottom: 10,
                  }}
                >
                  <CheckCircle2 size={16} color={colors.secondary[700]} />
                  <Text style={{ fontSize: 11, color: colors.secondary[800], flex: 1 }}>
                    {ubicacionConfirmada}
                  </Text>
                </View>
              )}

              {/* Ruta Asignada */}
              <Text style={styles.inputLabel}>Ruta Asignada</Text>
              <View style={styles.rutasRow}>
                {rutasDisponibles.map((r) => (
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

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSaveClient}
              disabled={isSaving}
              style={[styles.saveBtn, isSaving && { opacity: 0.65 }]}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Guardando cliente...</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {editingCliente && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleDeleteClient(editingCliente)}
                disabled={isSaving}
                style={styles.deleteModalBtn}
              >
                <Trash2 size={16} color={colors.error[600]} />
                <Text style={styles.deleteModalBtnText}>Dar de baja a este cliente</Text>
              </TouchableOpacity>
            )}
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
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[100],
  },
  deleteModalBtnText: {
    color: colors.error[700],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
