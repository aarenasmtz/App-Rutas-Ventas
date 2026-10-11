import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boxes,
  Barcode,
  Tag,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Scale,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockProductos, mockCategorias, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, SearchBar, MoneyDisplay, StockBadge } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import type { Producto, Categoria } from '@/types';

export default function ProductosAdminScreen() {
  const router = useRouter();
  const [productosList, setProductosList] = useState<Producto[]>(mockProductos);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('Todas');

  // Modal ABC Producto
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formCategoria, setFormCategoria] = useState<Categoria>('Jamón');
  const [formUnidad, setFormUnidad] = useState<'kg' | 'pieza'>('kg');
  const [formPorPeso, setFormPorPeso] = useState(true);
  const [formPrecioBase, setFormPrecioBase] = useState('185');
  const [formPrecioCompra, setFormPrecioCompra] = useState('130');
  const [formExistencia, setFormExistencia] = useState('20');
  const [formCodigo, setFormCodigo] = useState('');
  const [formSku, setFormSku] = useState('');

  const loadProductos = async () => {
    try {
      const data = await DataService.getProductos();
      if (data) setProductosList(data);
    } catch {}
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const handleOpenCreate = () => {
    setEditingProd(null);
    setFormNombre('');
    setFormMarca('');
    setFormCategoria('Jamón');
    setFormUnidad('kg');
    setFormPorPeso(true);
    setFormPrecioBase('185');
    setFormPrecioCompra('130');
    setFormExistencia('20');
    setFormCodigo('');
    setFormSku('');
    setModalVisible(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setEditingProd(p);
    setFormNombre(p.nombre);
    setFormMarca(p.marca || '');
    setFormCategoria(p.categoria);
    setFormUnidad(p.unidad === 'kg' ? 'kg' : 'pieza');
    setFormPorPeso(p.precioPorPeso ?? (p.unidad === 'kg'));
    setFormPrecioBase(p.precioBase.toString());
    setFormPrecioCompra((p.precioCompra || 0).toString());
    setFormExistencia(p.existencia.toString());
    setFormCodigo(p.codigoBarras || '');
    setFormSku(p.sku || '');
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del producto.');
      return;
    }

    const pBase = parseFloat(formPrecioBase) || 0;
    const pCompra = parseFloat(formPrecioCompra) || 0;
    const stock = parseFloat(formExistencia) || 0;

    if (editingProd) {
      await DataService.updateProducto(editingProd.id, {
        nombre: formNombre.trim(),
        marca: formMarca.trim(),
        categoria: formCategoria,
        unidad: formUnidad,
        precioPorPeso: formPorPeso,
        precioBase: pBase,
        precioCompra: pCompra,
        existencia: stock,
        codigoBarras: formCodigo.trim(),
        sku: formSku.trim(),
      });
    } else {
      await DataService.createProducto({
        nombre: formNombre.trim(),
        marca: formMarca.trim(),
        categoria: formCategoria,
        unidad: formUnidad,
        precioPorPeso: formPorPeso,
        precioBase: pBase,
        precioCompra: pCompra,
        existencia: stock,
        codigoBarras: formCodigo.trim(),
        sku: formSku.trim(),
      });
    }

    await loadProductos();
    setModalVisible(false);
  };

  const handleDeleteProduct = (p: Producto) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Deseas dar de baja "${p.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await DataService.deleteProducto(p.id);
            await loadProductos();
          },
        },
      ]
    );
  };

  // Obtener lista de marcas únicas
  const marcas = useMemo(() => {
    const setM = new Set<string>();
    productosList.forEach((p) => {
      if (p.marca) setM.add(p.marca);
    });
    return ['Todas', ...Array.from(setM)];
  }, [productosList]);

  const filtered = useMemo(() => {
    return productosList.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.codigoBarras?.includes(q);

      const matchCat = categoria === 'Todas' || p.categoria === categoria;
      const matchMarca = marcaSeleccionada === 'Todas' || p.marca === marcaSeleccionada;

      return matchSearch && matchCat && matchMarca;
    });
  }, [productosList, search, categoria, marcaSeleccionada]);

  const toggleActivo = async (id: string) => {
    const prod = productosList.find((p) => p.id === id);
    if (prod) {
      await DataService.updateProducto(id, { activo: !prod.activo });
      await loadProductos();
    }
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
        title="ABC de Productos"
        subtitle={`${filtered.length} de ${productosList.length} referencias`}
        onBack={handleBack}
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
            placeholder="Buscar por nombre, marca, SKU o código..."
            onClear={() => setSearch('')}
          />
        </View>

        {/* Filtros de Categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCategoria('Todas')}
            style={[styles.chip, categoria === 'Todas' && styles.chipActive]}
          >
            <Text style={[styles.chipText, categoria === 'Todas' && styles.chipTextActive]}>Todas</Text>
          </TouchableOpacity>
          {mockCategorias.map((c) => (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.8}
              onPress={() => setCategoria(c.nombre)}
              style={[styles.chip, categoria === c.nombre && styles.chipActive]}
            >
              <Text style={styles.chipEmoji}>{c.icono}</Text>
              <Text style={[styles.chipText, categoria === c.nombre && styles.chipTextActive]}>{c.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtros de Marcas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marcaRow}>
          {marcas.map((m) => (
            <TouchableOpacity
              key={m}
              activeOpacity={0.8}
              onPress={() => setMarcaSeleccionada(m)}
              style={[styles.marcaChip, marcaSeleccionada === m && styles.marcaChipActive]}
            >
              <Text style={[styles.marcaChipText, marcaSeleccionada === m && styles.marcaChipTextActive]}>
                {m === 'Todas' ? 'Todas las marcas' : m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Productos Administrativos */}
        <View style={styles.listSection}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={44} color={colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No hay productos encontrados</Text>
              <Text style={styles.emptySubtitle}>Intenta con otros filtros o términos</Text>
            </View>
          ) : (
            filtered.map((p) => {
              const margen = p.precioCompra ? p.precioBase - p.precioCompra : 0;
              const margenPct = p.precioCompra ? Math.round((margen / p.precioCompra) * 100) : 0;

              return (
                <View key={p.id} style={[styles.card, shadows.card, !p.activo && styles.cardInactive]}>
                  {/* Top: Nombre, Marca y Switch */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <View style={styles.brandBadge}>
                          <Text style={styles.brandBadgeText}>{p.marca || p.categoria}</Text>
                        </View>
                        <Text style={styles.catLabelText}>{p.categoria}</Text>
                      </View>
                      <Text style={styles.nameText} numberOfLines={2}>{p.nombre}</Text>
                    </View>

                    <View style={styles.activeToggleRow}>
                      <Switch
                        value={p.activo}
                        onValueChange={() => toggleActivo(p.id)}
                        trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                        thumbColor={colors.neutral[0]}
                      />
                    </View>
                  </View>

                  {/* Fila limpia de Precio y Existencia */}
                  <View style={styles.cleanPriceStockRow}>
                    <View>
                      <Text style={styles.cleanPriceLabel}>Precio Venta</Text>
                      <Text style={styles.cleanPriceVal}>{formatCurrency(p.precioBase)}</Text>
                      {p.precioCompra ? (
                        <Text style={styles.cleanCostVal}>Costo: {formatCurrency(p.precioCompra)}</Text>
                      ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <StockBadge stockPiezas={p.existencia} />
                      <Text style={styles.cleanStockSub}>{p.existencia} {p.unidad === 'kg' ? 'kg' : 'piezas'} disponibles</Text>
                    </View>
                  </View>

                  {/* Acciones directas */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleOpenEdit(p)}
                      style={styles.cardBtnEdit}
                    >
                      <Edit2 size={14} color={colors.primary[600]} />
                      <Text style={styles.cardBtnEditText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteProduct(p)}
                      style={styles.cardBtnDelete}
                    >
                      <Trash2 size={15} color={colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL DE ALTA / EDICIÓN DE PRODUCTO */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProd ? 'Editar Producto' : 'Nuevo Producto (Alta)'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>Nombre del Producto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Jamón Virginia, Queso Oaxaca..."
                value={formNombre}
                onChangeText={setFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Marca */}
              <Text style={styles.inputLabel}>Marca</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Zwan, FUD, Castel, Corona..."
                value={formMarca}
                onChangeText={setFormMarca}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Categoría Selector */}
              <View style={styles.catHeaderRow}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/(tabs)/mas/categorias' as any); }}>
                  <Text style={styles.catLinkText}>+ Gestionar familias</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {mockCategorias.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setFormCategoria(c.nombre as Categoria)}
                    style={[styles.catPickChip, formCategoria === c.nombre && styles.catPickChipActive]}
                  >
                    <Text style={styles.catPickEmoji}>{c.icono}</Text>
                    <Text style={[styles.catPickText, formCategoria === c.nombre && styles.catPickTextActive]}>{c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tipo de Venta: Por Peso o Por Pieza */}
              <View style={styles.switchBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>¿Se vende por Peso (Kg / Gramos)?</Text>
                  <Text style={styles.switchSub}>Habilita el cálculo fraccionable (0.250kg, 0.500kg...)</Text>
                </View>
                <Switch
                  value={formPorPeso}
                  onValueChange={(v) => {
                    setFormPorPeso(v);
                    setFormUnidad(v ? 'kg' : 'pieza');
                  }}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Precios Row */}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Precio Venta ($) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="185"
                    keyboardType="numeric"
                    value={formPrecioBase}
                    onChangeText={setFormPrecioBase}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Precio Compra ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="130"
                    keyboardType="numeric"
                    value={formPrecioCompra}
                    onChangeText={setFormPrecioCompra}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              {/* Stock inicial */}
              <Text style={styles.inputLabel}>Existencia en Inventario ({formPorPeso ? 'Kg' : 'Piezas'})</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                keyboardType="numeric"
                value={formExistencia}
                onChangeText={setFormExistencia}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* SKU y Código de barras */}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Código de barras</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="750100..."
                    value={formCodigo}
                    onChangeText={setFormCodigo}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>SKU</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ZWA-01"
                    value={formSku}
                    onChangeText={setFormSku}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSaveProduct} style={styles.saveBtn}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {editingProd ? 'Guardar Cambios' : 'Crear Producto'}
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
  searchSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
    fontWeight: fontWeight.semibold,
  },
  chipTextActive: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
  marcaRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs + 2,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  marcaChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
  },
  marcaChipActive: {
    backgroundColor: colors.neutral[900],
  },
  marcaChipText: {
    fontSize: 10,
    color: colors.neutral[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  marcaChipTextActive: {
    color: colors.neutral[0],
  },
  listSection: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  prodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: fontSize.xs - 1,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  activeToggleRow: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  brandBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
    textTransform: 'uppercase',
  },
  catLabelText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  cleanPriceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    marginVertical: spacing.sm,
  },
  cleanPriceLabel: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '600',
  },
  cleanPriceVal: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary[700],
  },
  cleanCostVal: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 1,
  },
  cleanStockSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.sm,
  },
  existenciaText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
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
  stockCol: {
    gap: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
  },
  cardBtnEditText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  cardBtnDelete: {
    padding: 6,
    borderRadius: radius.md,
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
    maxHeight: '92%',
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
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  catLinkText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  catPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    marginRight: 6,
  },
  catPickChipActive: {
    backgroundColor: colors.primary[600],
  },
  catPickEmoji: {
    fontSize: 14,
  },
  catPickText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  catPickTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  switchBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  switchTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
  },
  switchSub: {
    fontSize: fontSize.xs - 1,
    color: colors.primary[700],
    marginTop: 2,
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
