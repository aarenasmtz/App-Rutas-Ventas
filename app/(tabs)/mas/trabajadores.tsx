import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Lock,
  Phone,
  Truck,
  Eye,
  ShoppingCart,
  Boxes,
  Wallet,
  UserPlus,
  Shield,
  ArrowLeft,
  KeyRound,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import type { Empleado, PermisosEmpleado } from '@/types';

const PERMISOS_DEFAULT: PermisosEmpleado = {
  puedeVender: true,
  puedeVerClientes: true,
  puedeCrearClientes: true,
  puedeVerProductos: true,
  soloLecturaInventario: true,
  puedeCobrar: true,
};

export default function TrabajadoresScreen() {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRuta, setFormRuta] = useState('Ruta Norte');
  const [formRol, setFormRol] = useState<'Vendedor' | 'Administrador'>('Vendedor');
  const [formPermisos, setFormPermisos] = useState<PermisosEmpleado>(PERMISOS_DEFAULT);

  const [rutasList, setRutasList] = useState<string[]>(['Ruta Centro', 'Ruta Norte', 'Ruta Sur']);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const [data, rutas] = await Promise.all([
        DataService.getEmpleados(),
        DataService.getRutas(),
      ]);
      setEmpleados(data ?? []);
      if (rutas && rutas.length > 0) {
        setRutasList(rutas.map((r: any) => r.nombre));
      }
    } catch {
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  const handleOpenCreate = () => {
    setEditingEmp(null);
    setFormNombre('');
    setFormUsuario('');
    setFormPassword('');
    setFormPin('1234');
    setFormTelefono('');
    setFormRuta('Ruta Norte');
    setFormRol('Vendedor');
    setFormPermisos({ ...PERMISOS_DEFAULT });
    setModalVisible(true);
  };

  const handleOpenEdit = (emp: Empleado) => {
    setEditingEmp(emp);
    setFormNombre(emp.nombre);
    setFormUsuario(emp.usuario || '');
    setFormPassword('');
    setFormPin(emp.pin || '1234');
    setFormTelefono(emp.telefono || '');
    setFormRuta(emp.ruta || 'Ruta Norte');
    setFormRol((emp.rol as any) === 'Administrador' ? 'Administrador' : 'Vendedor');
    setFormPermisos({
      puedeVender: emp.permisos?.puedeVender ?? true,
      puedeVerClientes: emp.permisos?.puedeVerClientes ?? true,
      puedeCrearClientes: emp.permisos?.puedeCrearClientes ?? true,
      puedeVerProductos: emp.permisos?.puedeVerProductos ?? true,
      soloLecturaInventario: emp.permisos?.soloLecturaInventario ?? true,
      puedeCobrar: emp.permisos?.puedeCobrar ?? true,
    });
    setModalVisible(true);
  };

  const handleTogglePermiso = (key: keyof PermisosEmpleado) => {
    setFormPermisos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del trabajador.');
      return;
    }
    if (!formUsuario.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de usuario para el inicio de sesión.');
      return;
    }

    try {
      if (editingEmp) {
        await DataService.updateEmpleado(editingEmp.id, {
          nombre: formNombre.trim(),
          usuario: formUsuario.trim(),
          password: formPassword.trim() || undefined,
          pin: formPin.trim() || undefined,
          rol: formRol,
          rutaAsignada: formRuta,
          telefono: formTelefono.trim() || undefined,
          permisos: formPermisos,
        });
        Alert.alert('Éxito', `Trabajador "${formNombre}" actualizado correctamente.`);
      } else {
        await DataService.createEmpleado({
          nombre: formNombre.trim(),
          usuario: formUsuario.trim(),
          password: formPassword.trim() || '123456',
          pin: formPin.trim() || '1234',
          rol: formRol,
          rutaAsignada: formRuta,
          telefono: formTelefono.trim() || undefined,
          permisos: formPermisos,
        });
        Alert.alert('Éxito', `Trabajador "${formNombre}" dado de alta con éxito.`);
      }
      setModalVisible(false);
      await loadEmpleados();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el trabajador.');
    }
  };

  const handleDelete = (emp: Empleado) => {
    if (emp.rol === 'Administrador') {
      Alert.alert('Aviso', 'No puedes eliminar al usuario Administrador principal.');
      return;
    }
    Alert.alert(
      'Dar de baja trabajador',
      `¿Deseas deshabilitar el acceso de "${emp.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dar de baja',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.deleteEmpleado(emp.id);
              await loadEmpleados();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo dar de baja.');
            }
          },
        },
      ]
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Trabajadores y Accesos"
        subtitle="Configuración de los 2 vendedores y permisos de ruta"
        onBack={() => router.replace('/(tabs)/mas' as any)}
        right={
          <TouchableOpacity onPress={handleOpenCreate} style={styles.addHeaderBtn}>
            <Plus size={16} color={colors.neutral[0]} />
            <Text style={styles.addHeaderBtnText}>Nuevo</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner Informativo para Miguel */}
        <View style={styles.infoBanner}>
          <ShieldCheck size={22} color={colors.primary[600]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>Control de Permisos de Vendedores</Text>
            <Text style={styles.infoBannerText}>
              Configura los usuarios de tus 2 trabajadores. Por regla de negocio, los vendedores tienen{' '}
              <Text style={{ fontWeight: '700' }}>Solo Lectura de Inventario</Text> para evitar que alteren el stock
              cargado en la mañana.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={{ marginTop: 12, color: colors.neutral[500] }}>Cargando usuarios...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {empleados.map((emp) => {
              const isAdmin = emp.rol === 'Administrador';
              const perms = emp.permisos || PERMISOS_DEFAULT;

              return (
                <View key={emp.id} style={[styles.card, shadows.card]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.userIconCircle}>
                      {isAdmin ? (
                        <Shield size={20} color={colors.primary[700]} />
                      ) : (
                        <Users size={20} color={colors.secondary[700]} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.empNombre}>{emp.nombre}</Text>
                        <View style={[styles.rolBadge, isAdmin ? styles.rolBadgeAdmin : styles.rolBadgeVend]}>
                          <Text style={[styles.rolBadgeText, isAdmin ? styles.rolBadgeTextAdmin : styles.rolBadgeTextVend]}>
                            {emp.rol}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.empUsuario}>Usuario: @{emp.usuario || 'sin_usuario'}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity onPress={() => handleOpenEdit(emp)} style={styles.actionBtn}>
                        <Edit2 size={16} color={colors.primary[600]} />
                      </TouchableOpacity>
                      {!isAdmin && (
                        <TouchableOpacity onPress={() => handleDelete(emp)} style={styles.actionBtn}>
                          <Trash2 size={16} color={colors.error[500]} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Card Metadata */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Truck size={14} color={colors.neutral[500]} />
                      <Text style={styles.metaText}>{emp.ruta || 'Sin ruta asignada'}</Text>
                    </View>
                    {emp.telefono ? (
                      <View style={styles.metaItem}>
                        <Phone size={14} color={colors.neutral[500]} />
                        <Text style={styles.metaText}>{emp.telefono}</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaItem}>
                      <KeyRound size={14} color={colors.neutral[500]} />
                      <Text style={styles.metaText}>PIN: {emp.pin || '1234'}</Text>
                    </View>
                  </View>

                  {/* Card Permisos Badges */}
                  <View style={styles.permisosContainer}>
                    <Text style={styles.permisosSectionTitle}>Permisos Configurados:</Text>
                    <View style={styles.permisosChipsRow}>
                      <View style={[styles.permisoChip, perms.puedeVender ? styles.chipActive : styles.chipInactive]}>
                        <ShoppingCart size={11} color={perms.puedeVender ? colors.primary[700] : colors.neutral[400]} />
                        <Text style={[styles.permisoChipText, perms.puedeVender && styles.chipTextActive]}>
                          Vender
                        </Text>
                      </View>

                      <View style={[styles.permisoChip, perms.puedeVerClientes ? styles.chipActive : styles.chipInactive]}>
                        <Eye size={11} color={perms.puedeVerClientes ? colors.primary[700] : colors.neutral[400]} />
                        <Text style={[styles.permisoChipText, perms.puedeVerClientes && styles.chipTextActive]}>
                          Ver Clientes
                        </Text>
                      </View>

                      <View style={[styles.permisoChip, perms.puedeCrearClientes ? styles.chipActive : styles.chipInactive]}>
                        <UserPlus size={11} color={perms.puedeCrearClientes ? colors.primary[700] : colors.neutral[400]} />
                        <Text style={[styles.permisoChipText, perms.puedeCrearClientes && styles.chipTextActive]}>
                          Crear Clientes
                        </Text>
                      </View>

                      <View style={[styles.permisoChip, perms.puedeVerProductos ? styles.chipActive : styles.chipInactive]}>
                        <Boxes size={11} color={perms.puedeVerProductos ? colors.primary[700] : colors.neutral[400]} />
                        <Text style={[styles.permisoChipText, perms.puedeVerProductos && styles.chipTextActive]}>
                          Ver Productos
                        </Text>
                      </View>

                      <View style={[styles.permisoChip, perms.soloLecturaInventario ? styles.chipHighlight : styles.chipActive]}>
                        <Lock size={11} color={perms.soloLecturaInventario ? '#B45309' : colors.primary[700]} />
                        <Text style={[styles.permisoChipText, perms.soloLecturaInventario && { color: '#B45309', fontWeight: '700' }]}>
                          Solo Lectura Inventario
                        </Text>
                      </View>

                      <View style={[styles.permisoChip, perms.puedeCobrar ? styles.chipActive : styles.chipInactive]}>
                        <Wallet size={11} color={perms.puedeCobrar ? colors.primary[700] : colors.neutral[400]} />
                        <Text style={[styles.permisoChipText, perms.puedeCobrar && styles.chipTextActive]}>
                          Cobranza
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL CREAR / EDITAR TRABAJADOR Y PERMISOS */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingEmp ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </Text>
                <Text style={styles.modalSubtitle}>Configurar credenciales y permisos de venta</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Nombre Completo */}
              <Text style={styles.inputLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Juan Pérez"
                value={formNombre}
                onChangeText={setFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Nombre de Usuario */}
              <Text style={styles.inputLabel}>Nombre de Usuario (Para ingresar a la app) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. juan"
                value={formUsuario}
                onChangeText={setFormUsuario}
                autoCapitalize="none"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Contraseña / PIN */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Contraseña {editingEmp ? '(opcional)' : '*'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={editingEmp ? 'Dejar igual' : 'Contraseña'}
                    value={formPassword}
                    onChangeText={setFormPassword}
                    secureTextEntry
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>PIN Rápido</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234"
                    value={formPin}
                    onChangeText={setFormPin}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              {/* Teléfono */}
              <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 477 123 4567"
                value={formTelefono}
                onChangeText={setFormTelefono}
                keyboardType="phone-pad"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Ruta Asignada */}
              <Text style={styles.inputLabel}>Ruta Asignada</Text>
              <View style={styles.rutasRow}>
                {rutasList.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setFormRuta(r)}
                    style={[styles.rutaChip, formRuta === r && styles.rutaChipActive]}
                  >
                    <Text style={[styles.rutaChipText, formRuta === r && styles.rutaChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rol */}
              <Text style={styles.inputLabel}>Rol del Usuario</Text>
              <View style={styles.rutasRow}>
                {(['Vendedor', 'Administrador'] as const).map((rl) => (
                  <TouchableOpacity
                    key={rl}
                    onPress={() => setFormRol(rl)}
                    style={[styles.rutaChip, formRol === rl && styles.rutaChipActive]}
                  >
                    <Text style={[styles.rutaChipText, formRol === rl && styles.rutaChipTextActive]}>{rl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SECCIÓN DE PERMISOS GRANULARES */}
              <View style={styles.permisosBoxHeader}>
                <Shield size={16} color={colors.primary[700]} />
                <Text style={styles.permisosBoxTitle}>Permisos Granulares (Configuración de Miguel)</Text>
              </View>

              {/* Permiso: Solo lectura inventario */}
              <View style={[styles.permisoToggleRow, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.permisoToggleTitle, { color: '#92400E' }]}>
                    🔒 Solo Lectura de Inventario (Recomendado)
                  </Text>
                  <Text style={[styles.permisoToggleSub, { color: '#B45309' }]}>
                    El trabajador solo ve las existencias de su camioneta. No puede alterar ni aumentar el inventario.
                  </Text>
                </View>
                <Switch
                  value={formPermisos.soloLecturaInventario}
                  onValueChange={() => handleTogglePermiso('soloLecturaInventario')}
                  trackColor={{ false: colors.neutral[300], true: '#D97706' }}
                  thumbColor={colors.neutral[0]}
                />
              </View>

              {/* Permiso: Puede Vender */}
              <View style={styles.permisoToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.permisoToggleTitle}>🛒 Puede Vender</Text>
                  <Text style={styles.permisoToggleSub}>Permite seleccionar productos, ingresar cantidades y cobrar notas.</Text>
                </View>
                <Switch
                  value={formPermisos.puedeVender}
                  onValueChange={() => handleTogglePermiso('puedeVender')}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor={colors.neutral[0]}
                />
              </View>

              {/* Permiso: Ver Clientes */}
              <View style={styles.permisoToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.permisoToggleTitle}>👥 Ver Clientes</Text>
                  <Text style={styles.permisoToggleSub}>Permite ver los clientes de la ruta y su saldo pendiente.</Text>
                </View>
                <Switch
                  value={formPermisos.puedeVerClientes}
                  onValueChange={() => handleTogglePermiso('puedeVerClientes')}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor={colors.neutral[0]}
                />
              </View>

              {/* Permiso: Crear Clientes */}
              <View style={styles.permisoToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.permisoToggleTitle}>➕ Crear Clientes Nuevos</Text>
                  <Text style={styles.permisoToggleSub}>Permite dar de alta clientes encontrados en el recorrido.</Text>
                </View>
                <Switch
                  value={formPermisos.puedeCrearClientes}
                  onValueChange={() => handleTogglePermiso('puedeCrearClientes')}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor={colors.neutral[0]}
                />
              </View>

              {/* Permiso: Ver Catálogo */}
              <View style={styles.permisoToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.permisoToggleTitle}>📦 Ver Catálogo de Productos</Text>
                  <Text style={styles.permisoToggleSub}>Permite consultar precios y presentaciones disponibles.</Text>
                </View>
                <Switch
                  value={formPermisos.puedeVerProductos}
                  onValueChange={() => handleTogglePermiso('puedeVerProductos')}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor={colors.neutral[0]}
                />
              </View>

              {/* Permiso: Cobranza */}
              <View style={styles.permisoToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.permisoToggleTitle}>💵 Cobranza y Abonos</Text>
                  <Text style={styles.permisoToggleSub}>Permite recibir pagos de clientes con deuda anterior.</Text>
                </View>
                <Switch
                  value={formPermisos.puedeCobrar}
                  onValueChange={() => handleTogglePermiso('puedeCobrar')}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor={colors.neutral[0]}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Guardar Trabajador</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: 60,
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.md,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  addHeaderBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
    marginBottom: 2,
  },
  infoBannerText: {
    fontSize: fontSize.xs,
    color: colors.primary[800],
    lineHeight: 18,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  empNombre: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  empUsuario: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  rolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  rolBadgeAdmin: {
    backgroundColor: colors.primary[100],
  },
  rolBadgeVend: {
    backgroundColor: colors.secondary[100],
  },
  rolBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  rolBadgeTextAdmin: {
    color: colors.primary[700],
  },
  rolBadgeTextVend: {
    color: colors.secondary[700],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  permisosContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  permisosSectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.neutral[500],
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  permisosChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permisoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  chipInactive: {
    backgroundColor: colors.neutral[100],
    opacity: 0.6,
  },
  chipHighlight: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  permisoChipText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  chipTextActive: {
    color: colors.primary[800],
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
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
    color: colors.neutral[500],
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
  },
  rutasRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rutaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
  },
  rutaChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  rutaChipText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
  },
  rutaChipTextActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.bold,
  },
  permisosBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  permisosBoxTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
    textTransform: 'uppercase',
  },
  permisoToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    marginBottom: 8,
  },
  permisoToggleTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  permisoToggleSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
});
