import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  UserCheck,
  CheckCircle2,
  Route,
  Navigation,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import type { RutaItem } from '@/types';

export default function RutasAdminScreen() {
  const router = useRouter();
  const [rutasList, setRutasList] = useState<RutaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRuta, setEditingRuta] = useState<RutaItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  // Toast / Alert State
  const [bannerMensaje, setBannerMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const loadRutas = async () => {
    setLoading(true);
    try {
      const data = await DataService.getRutas();
      setRutasList(data ?? []);
    } catch {
      setRutasList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRutas();
  }, []);

  const handleOpenCreate = () => {
    setEditingRuta(null);
    setFormNombre('');
    setFormDescripcion('');
    setModalVisible(true);
  };

  const handleOpenEdit = (r: RutaItem) => {
    setEditingRuta(r);
    setFormNombre(r.nombre);
    setFormDescripcion(r.descripcion || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la ruta.');
      return;
    }

    setSaving(true);
    try {
      if (editingRuta) {
        await DataService.updateRuta(editingRuta.id, {
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim(),
        });
        setBannerMensaje({
          tipo: 'exito',
          texto: `✓ Ruta actualizada: "${formNombre.trim()}". Se actualizó el nombre para todos los clientes y trabajadores asignados.`,
        });
      } else {
        await DataService.createRuta({
          nombre: formNombre.trim(),
          descripcion: formDescripcion.trim(),
        });
        setBannerMensaje({
          tipo: 'exito',
          texto: `✓ Ruta "${formNombre.trim()}" dada de alta correctamente.`,
        });
      }
      setModalVisible(false);
      await loadRutas();
    } catch (e: any) {
      setBannerMensaje({
        tipo: 'error',
        texto: e?.message || 'No se pudo guardar la ruta.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r: RutaItem) => {
    Alert.alert(
      'Desactivar Ruta',
      `¿Deseas dar de baja la ruta "${r.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.deleteRuta(r.id);
              await loadRutas();
              setBannerMensaje({
                tipo: 'exito',
                texto: `Ruta "${r.nombre}" desactivada.`,
              });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo desactivar.');
            }
          },
        },
      ]
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Rutas Asignadas (ABC)"
        subtitle="Administrar y cambiar nombres de las rutas de distribución"
        onBack={() => router.replace('/(tabs)/mas' as any)}
        right={
          <TouchableOpacity onPress={handleOpenCreate} style={styles.addHeaderBtn}>
            <Plus size={16} color={colors.neutral[0]} />
            <Text style={styles.addHeaderBtnText}>Nueva Ruta</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner Informativo */}
        <View style={styles.infoBanner}>
          <Route size={22} color={colors.primary[600]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>Gestión de Nombres de Ruta</Text>
            <Text style={styles.infoBannerText}>
              Puedes cambiar el nombre de cualquier ruta asignada (ej. de "Ruta Norte" a "Ruta Norte - Echeveste").
              Al cambiar el nombre, se actualizan automáticamente todos los clientes y vendedores asociados a ella.
            </Text>
          </View>
        </View>

        {/* Banner de Mensaje / Notificación */}
        {bannerMensaje && (
          <View style={[styles.msgBanner, bannerMensaje.tipo === 'exito' ? styles.msgExito : styles.msgError]}>
            <CheckCircle2 size={16} color={bannerMensaje.tipo === 'exito' ? colors.secondary[800] : colors.error[700]} />
            <Text style={[styles.msgText, bannerMensaje.tipo === 'exito' ? styles.msgTextExito : styles.msgTextError]}>
              {bannerMensaje.texto}
            </Text>
            <TouchableOpacity onPress={() => setBannerMensaje(null)} style={{ padding: 4 }}>
              <X size={14} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={{ marginTop: 12, color: colors.neutral[500] }}>Cargando rutas...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rutasList.map((r) => (
              <View key={r.id} style={[styles.card, shadows.card]}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Navigation size={20} color={colors.primary[600]} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.rutaNombre}>{r.nombre}</Text>
                    <Text style={styles.rutaDesc}>{r.descripcion || 'Sin descripción'}</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => handleOpenEdit(r)} style={styles.actionBtn}>
                      <Edit2 size={16} color={colors.primary[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(r)} style={styles.actionBtn}>
                      <Trash2 size={16} color={colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Metadata Row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Users size={14} color={colors.neutral[500]} />
                    <Text style={styles.metaText}>{r.totalClientes ?? 0} clientes en ruta</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <UserCheck size={14} color={colors.secondary[600]} />
                    <Text style={[styles.metaText, { color: colors.secondary[700], fontWeight: fontWeight.semibold }]}>
                      Vendedor: {r.vendedorAsignado || 'Sin asignar'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL CREAR / EDITAR RUTA */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingRuta ? 'Editar Nombre de Ruta' : 'Nueva Ruta de Distribución'}
                </Text>
                <Text style={styles.modalSubtitle}>Configurar nombre comercial y zonas cubiertas</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Nombre de la Ruta *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Ruta Norte, Ruta Campestre, Ruta Coecillo..."
                  value={formNombre}
                  onChangeText={setFormNombre}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Zonas / Colonias que cubre (Descripción)</Text>
                <TextInput
                  style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="Ej. Echeveste, Delta, Coecillo Norte..."
                  value={formDescripcion}
                  onChangeText={setFormDescripcion}
                  multiline
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.modalSaveBtn}>
                {saving ? (
                  <ActivityIndicator color={colors.neutral[0]} />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingRuta ? 'Actualizar Ruta' : 'Guardar Ruta'}
                  </Text>
                )}
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
  msgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  msgExito: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[200],
  },
  msgError: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[100],
  },
  msgText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  msgTextExito: {
    color: colors.secondary[900],
  },
  msgTextError: {
    color: colors.error[700],
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
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rutaNombre: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  rutaDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
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
    gap: 16,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.md,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
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
