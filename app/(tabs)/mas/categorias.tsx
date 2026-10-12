import { useState, useEffect, useMemo } from 'react';
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
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService, mockCategorias, mockProductos } from '@/services/mockDataService';
import { AppShell, PageHeader, SearchBar } from '@/components/DesignSystem';
import type { CategoriaItem } from '@/types';

const EMOJI_OPTIONS = ['🧀', '🥓', '🌭', '🥩', '🧈', '🥫', '🍗', '📦', '🏷️', '🥛', '🍞', '🥤', '🥑', '🍎', '🥪', '☕'];

export default function CategoriasAdminScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [productosList, setProductosList] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modal de Alta / Edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoriaItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formIcono, setFormIcono] = useState('🧀');
  const [formDesc, setFormDesc] = useState('');

  const loadCategorias = async () => {
    try {
      const [list, prods] = await Promise.all([
        DataService.getCategorias(),
        DataService.getProductos(),
      ]);
      setCategorias(list ?? []);
      setProductosList(prods ?? []);
    } catch {
      setCategorias([]);
      setProductosList([]);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  // Conteo de productos por categoría
  const productCountByCat = useMemo(() => {
    const map: Record<string, number> = {};
    productosList.forEach((p) => {
      map[p.categoria] = (map[p.categoria] || 0) + 1;
    });
    return map;
  }, [productosList]);

  const filtered = useMemo(() => {
    return categorias.filter((c) => {
      const q = search.toLowerCase().trim();
      return !q || c.nombre.toLowerCase().includes(q) || (c.descripcion && c.descripcion.toLowerCase().includes(q));
    });
  }, [categorias, search]);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormNombre('');
    setFormIcono('🧀');
    setFormDesc('');
    setModalVisible(true);
  };

  const handleOpenEdit = (cat: CategoriaItem) => {
    setEditingCat(cat);
    setFormNombre(cat.nombre);
    setFormIcono(cat.icono);
    setFormDesc(cat.descripcion || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la categoría.');
      return;
    }

    if (editingCat) {
      await DataService.updateCategoria(editingCat.id, {
        nombre: formNombre.trim(),
        icono: formIcono,
        descripcion: formDesc.trim(),
      });
    } else {
      await DataService.createCategoria({
        nombre: formNombre.trim(),
        icono: formIcono,
        descripcion: formDesc.trim(),
      });
    }

    await loadCategorias();
    setModalVisible(false);
  };

  const handleDelete = (cat: CategoriaItem) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de que deseas eliminar o desactivar la categoría "${cat.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await DataService.deleteCategoria(cat.id);
            await loadCategorias();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/mas');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="ABC de Categorías"
        subtitle={`${categorias.length} familias de productos configuradas`}
        onBack={handleBack}
        right={
          <TouchableOpacity activeOpacity={0.8} onPress={handleOpenCreate} style={styles.createBtnHeader}>
            <Plus size={18} color={colors.neutral[0]} />
            <Text style={styles.createBtnHeaderText}>Nueva</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Buscador */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar categoría..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Tarjetas de Categorías */}
        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={44} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No hay categorías coincidentes</Text>
              <Text style={styles.emptySubtitle}>Crea una nueva categoría con el botón superior</Text>
            </View>
          ) : (
            filtered.map((cat) => {
              const count = productCountByCat[cat.nombre] || 0;
              const isActiva = cat.activa !== false;

              return (
                <View key={cat.id} style={[styles.catCard, shadows.card, !isActiva && styles.cardInactive]}>
                  <View style={styles.catLeft}>
                    <View style={styles.catIconBox}>
                      <Text style={styles.catEmoji}>{cat.icono}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.catName}>{cat.nombre}</Text>
                        <View style={[styles.statusBadge, isActiva ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={[styles.statusText, isActiva ? styles.statusTextActive : styles.statusTextInactive]}>
                            {isActiva ? 'Activa' : 'Inactiva'}
                          </Text>
                        </View>
                      </View>
                      {cat.descripcion ? (
                        <Text style={styles.catDesc} numberOfLines={2}>{cat.descripcion}</Text>
                      ) : null}
                      <View style={styles.prodCountRow}>
                        <Package size={12} color={colors.neutral[400]} />
                        <Text style={styles.prodCountText}>{count} productos asociados</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.catActions}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenEdit(cat)}
                      style={styles.actionBtnEdit}
                    >
                      <Edit2 size={16} color={colors.primary[600]} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDelete(cat)}
                      style={styles.actionBtnDelete}
                    >
                      <Trash2 size={16} color={colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL DE ALTA / EDICIÓN */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCat ? 'Editar Categoría' : 'Nueva Categoría (Alta)'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>Nombre de la Categoría *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Lácteos, Carnes Frías, Panadería..."
                value={formNombre}
                onChangeText={setFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Selector de Emoji */}
              <Text style={styles.inputLabel}>Icono / Emoji Distintivo</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => {
                  const isSelected = formIcono === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      activeOpacity={0.7}
                      onPress={() => setFormIcono(emoji)}
                      style={[styles.emojiBtn, isSelected && styles.emojiBtnActive]}
                    >
                      <Text style={styles.emojiBtnText}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Descripción */}
              <Text style={styles.inputLabel}>Descripción breve</Text>
              <TextInput
                style={[styles.input, { height: 68, textAlignVertical: 'top' }]}
                placeholder="Describe qué productos pertenecen a esta familia..."
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                placeholderTextColor={colors.neutral[400]}
              />
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.saveBtn}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {editingCat ? 'Guardar Cambios' : 'Crear Categoría'}
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
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  listSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
  catCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
  },
  cardInactive: {
    opacity: 0.6,
    backgroundColor: colors.neutral[50],
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  catIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  catName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  statusBadgeActive: {
    backgroundColor: colors.success[50],
  },
  statusBadgeInactive: {
    backgroundColor: colors.neutral[100],
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  statusTextActive: {
    color: colors.success[700],
  },
  statusTextInactive: {
    color: colors.neutral[500],
  },
  catDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  prodCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  prodCountText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    fontWeight: fontWeight.medium,
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: spacing.sm,
  },
  actionBtnEdit: {
    padding: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[50],
  },
  actionBtnDelete: {
    padding: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.error[50],
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
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
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  emojiBtnText: {
    fontSize: 20,
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
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
