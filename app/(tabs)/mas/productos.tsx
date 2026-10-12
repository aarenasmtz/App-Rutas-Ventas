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
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockProductos, mockCategorias, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, SearchBar, MoneyDisplay, StockBadge } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import { desglosarInventario } from '@/utils/multipresentacion';
import type { Producto, CategoriaItem, Categoria, PresentacionConfig, PresentacionTipo, Unidad } from '@/types';

export default function ProductosAdminScreen() {
  const router = useRouter();
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [categoriasList, setCategoriasList] = useState<CategoriaItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('Todas');

  // Modal ABC Producto
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formNombreAlmacen, setFormNombreAlmacen] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formCategoria, setFormCategoria] = useState<Categoria>('Jamón');
  const [formUnidad, setFormUnidad] = useState<Unidad>('kg');
  const [formPorPeso, setFormPorPeso] = useState(true);
  const [formPrecioBase, setFormPrecioBase] = useState('185');
  const [formPrecioCompra, setFormPrecioCompra] = useState('130');
  const [formExistencia, setFormExistencia] = useState('20');
  const [formCodigo, setFormCodigo] = useState('');
  const [formSku, setFormSku] = useState('');

  // Multipresentación Estado
  const [formManejaMultipres, setFormManejaMultipres] = useState(false);
  const [formPresentaciones, setFormPresentaciones] = useState<PresentacionConfig[]>([]);

  // Submodal para configurar presentación
  const [presModalVisible, setPresModalVisible] = useState(false);
  const [editingPresIdx, setEditingPresIdx] = useState<number | null>(null);
  const [presFormNombre, setPresFormNombre] = useState('');
  const [presFormTipo, setPresFormTipo] = useState<PresentacionTipo>('paquete');
  const [presFormFactor, setPresFormFactor] = useState('1');
  const [presFormPrecio, setPresFormPrecio] = useState('8');
  const [presFormCodigo, setPresFormCodigo] = useState('');
  const [presFormActiva, setPresFormActiva] = useState(true);
  const [presFormOrden, setPresFormOrden] = useState('1');

  const loadProductos = async () => {
    try {
      const [data, cats] = await Promise.all([
        DataService.getProductos(),
        DataService.getCategorias(),
      ]);
      setProductosList(data ?? []);
      setCategoriasList(cats ?? []);
    } catch {
      setProductosList([]);
      setCategoriasList([]);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const handleOpenCreate = () => {
    setEditingProd(null);
    setFormNombre('');
    setFormNombreAlmacen('');
    setFormMarca('');
    setFormCategoria('Jamón');
    setFormUnidad('kg');
    setFormPorPeso(true);
    setFormPrecioBase('185');
    setFormPrecioCompra('130');
    setFormExistencia('20');
    setFormCodigo('');
    setFormSku('');
    setFormManejaMultipres(false);
    setFormPresentaciones([]);
    setModalVisible(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setEditingProd(p);
    setFormNombre(p.nombre);
    setFormNombreAlmacen(p.nombreAlmacen || '');
    setFormMarca(p.marca || '');
    setFormCategoria(p.categoria);
    setFormUnidad(p.unidad);
    const isMultipres = Boolean(
      p.manejaMultiplesPresentaciones ||
      (p.presentaciones && p.presentaciones.length > 1) ||
      p.unidad === 'paquete'
    );
    setFormManejaMultipres(isMultipres);
    setFormPorPeso(isMultipres ? false : (p.precioPorPeso ?? (p.unidad === 'kg')));
    setFormPrecioBase(p.precioBase.toString());
    setFormPrecioCompra((p.precioCompra || 0).toString());
    setFormExistencia(p.existencia.toString());
    setFormCodigo(p.codigoBarras || '');
    setFormSku(p.sku || '');
    setFormPresentaciones(p.presentaciones ? [...p.presentaciones] : []);
    setModalVisible(true);
  };

  const handleOpenAddPres = () => {
    setEditingPresIdx(null);
    setPresFormNombre('');
    setPresFormTipo('paquete');
    setPresFormFactor('1');
    setPresFormPrecio('0');
    setPresFormCodigo('');
    setPresFormActiva(true);
    setPresFormOrden((formPresentaciones.length + 1).toString());
    setPresModalVisible(true);
  };

  const handleOpenEditPres = (idx: number) => {
    const pr = formPresentaciones[idx];
    if (!pr) return;
    setEditingPresIdx(idx);
    setPresFormNombre(pr.nombre);
    setPresFormTipo(pr.tipo || 'paquete');
    setPresFormFactor(pr.piezasEquivalentes.toString());
    setPresFormPrecio(pr.precio.toString());
    setPresFormCodigo(pr.codigoBarras || '');
    setPresFormActiva(pr.activa !== false);
    setPresFormOrden((pr.orden ?? (idx + 1)).toString());
    setPresModalVisible(true);
  };

  const handleSavePres = () => {
    if (!presFormNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la presentación.');
      return;
    }
    const factor = parseFloat(presFormFactor) || 1;
    const precio = parseFloat(presFormPrecio) || 0;
    const orden = parseInt(presFormOrden) || (formPresentaciones.length + 1);

    const nuevaPres: PresentacionConfig = {
      tipo: presFormTipo,
      nombre: presFormNombre.trim(),
      piezasEquivalentes: factor,
      precio: precio,
      descripcionEquivalencia: `1 ${presFormNombre.trim().toLowerCase()} = ${factor} ${formUnidad}s`,
      codigoBarras: presFormCodigo.trim() || undefined,
      activa: presFormActiva,
      orden: orden,
    };

    if (editingPresIdx !== null && editingPresIdx >= 0) {
      const updated = [...formPresentaciones];
      updated[editingPresIdx] = nuevaPres;
      setFormPresentaciones(updated);
    } else {
      setFormPresentaciones([...formPresentaciones, nuevaPres]);
    }
    setPresModalVisible(false);
  };

  const handleDeletePres = (idx: number) => {
    if (formPresentaciones.length <= 1) {
      Alert.alert('Aviso', 'Un producto multipresentación debe conservar al menos una presentación.');
      return;
    }
    const updated = formPresentaciones.filter((_, i) => i !== idx);
    setFormPresentaciones(updated);
  };

  const handleTogglePresActiva = (idx: number) => {
    const updated = [...formPresentaciones];
    updated[idx] = {
      ...updated[idx],
      activa: updated[idx].activa === false ? true : false,
    };
    setFormPresentaciones(updated);
  };

  const handleToggleManejaMultipres = (enabled: boolean) => {
    setFormManejaMultipres(enabled);
    if (enabled) {
      setFormPorPeso(false);
      if (formUnidad === 'kg') {
        setFormUnidad('paquete');
      }
      // Si no tiene presentaciones configuradas, sugerir plantillas base o inicializar
      if (formPresentaciones.length === 0) {
        if (formNombre.toLowerCase().includes('castel')) {
          setFormPresentaciones([
            { tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 8, activa: true, orden: 1, descripcionEquivalencia: '1 paquete = 1 unidad base' },
            { tipo: 'exhibidor', nombre: 'Exhibidor', piezasEquivalentes: 10, precio: 80, activa: true, orden: 2, descripcionEquivalencia: '1 exhibidor = 10 paquetes' },
            { tipo: 'caja', nombre: 'Caja', piezasEquivalentes: 60, precio: 480, activa: true, orden: 3, descripcionEquivalencia: '1 caja = 60 paquetes' },
          ]);
          setFormPrecioBase('8');
        } else {
          setFormPresentaciones([
            { tipo: 'paquete', nombre: 'Unidad Base', piezasEquivalentes: 1, precio: parseFloat(formPrecioBase) || 10, activa: true, orden: 1 },
          ]);
        }
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del producto.');
      return;
    }

    if (formManejaMultipres && formPresentaciones.length === 0) {
      Alert.alert(
        'Presentaciones requeridas',
        'Si el producto maneja múltiples presentaciones, debes agregar al menos una presentación.'
      );
      return;
    }

    const pBase = parseFloat(formPrecioBase) || (formPresentaciones.length > 0 ? formPresentaciones[0].precio : 0);
    const pCompra = parseFloat(formPrecioCompra) || 0;
    const stock = parseFloat(formExistencia) || 0;

    const payload: Partial<Producto> = {
      nombre: formNombre.trim(),
      nombreAlmacen: formNombreAlmacen.trim() || undefined,
      marca: formMarca.trim(),
      categoria: formCategoria,
      unidad: formManejaMultipres ? formUnidad : (formPorPeso ? 'kg' : 'pieza'),
      precioPorPeso: formManejaMultipres ? false : formPorPeso,
      precioBase: pBase,
      precioCompra: pCompra,
      existencia: stock,
      codigoBarras: formCodigo.trim(),
      sku: formSku.trim(),
      manejaMultiplesPresentaciones: formManejaMultipres,
      presentaciones: formManejaMultipres ? formPresentaciones : [],
    };

    if (editingProd) {
      await DataService.updateProducto(editingProd.id, payload);
    } else {
      await DataService.createProducto(payload);
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
          {categoriasList.map((c) => (
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
              <Text style={styles.emptyTitle}>No hay productos registrados</Text>
              <Text style={styles.emptySubtitle}>Toca el botón "+ Nuevo" para registrar el primer producto</Text>
            </View>
          ) : (
            filtered.map((p) => {
              const margen = p.precioCompra ? p.precioBase - p.precioCompra : 0;
              const isMulti = Boolean(
                p.manejaMultiplesPresentaciones ||
                (p.presentaciones && p.presentaciones.length > 1) ||
                p.unidad === 'paquete'
              );

              return (
                <View key={p.id} style={[styles.card, shadows.card, !p.activo && styles.cardInactive]}>
                  {/* Top: Nombre, Marca y Switch */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 }}>
                        <View style={styles.brandBadge}>
                          <Text style={styles.brandBadgeText}>{p.marca || p.categoria}</Text>
                        </View>
                        <Text style={styles.catLabelText}>{p.categoria}</Text>
                        {isMulti ? (
                          <View style={styles.multiBadge}>
                            <Layers size={11} color={colors.primary[700]} />
                            <Text style={styles.multiBadgeText}>Multipresentación</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.nameText} numberOfLines={2}>{p.nombre}</Text>
                      {p.nombreAlmacen ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Package size={11} color={colors.neutral[500]} />
                          <Text style={{ fontSize: 11, color: colors.neutral[600] }}>
                            Almacén: <Text style={{ fontWeight: '600', color: colors.primary[700] }}>{p.nombreAlmacen}</Text>
                          </Text>
                        </View>
                      ) : null}
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
                      <Text style={styles.cleanPriceLabel}>
                        {isMulti ? 'Precio Base / Ref.' : 'Precio Venta'}
                      </Text>
                      <Text style={styles.cleanPriceVal}>{formatCurrency(p.precioBase)}</Text>
                      {p.precioCompra ? (
                        <Text style={styles.cleanCostVal}>Costo: {formatCurrency(p.precioCompra)}</Text>
                      ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <StockBadge stockPiezas={p.existencia} />
                      <Text style={styles.cleanStockSub}>
                        {p.existencia} {p.unidad === 'kg' ? 'kg' : (p.unidad === 'paquete' ? 'paquetes' : 'piezas')} disponibles
                      </Text>
                    </View>
                  </View>

                  {/* Resumen de presentaciones si es multipresentación */}
                  {isMulti && p.presentaciones && p.presentaciones.length > 0 ? (
                    <View style={styles.multiCardPreview}>
                      <View style={styles.multiChipsRow}>
                        {p.presentaciones.map((pr, idx) => (
                          <View key={idx} style={[styles.presPill, pr.activa === false && styles.presPillInactive]}>
                            <Text style={styles.presPillNombre}>{pr.nombre}</Text>
                            <Text style={styles.presPillPrecio}>{formatCurrency(pr.precio)}</Text>
                            <Text style={styles.presPillFactor}>({pr.piezasEquivalentes} {p.unidad}s)</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.desgloseRow}>
                        <Package size={13} color={colors.primary[700]} />
                        <Text style={styles.desgloseText} numberOfLines={2}>
                          Inventario: {desglosarInventario(p.existencia, p.presentaciones, p.unidad)}
                        </Text>
                      </View>
                    </View>
                  ) : null}

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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>1. Nombre en la App (Venta y Catálogo) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Queso Castel, Jamón Virginia..."
                value={formNombre}
                onChangeText={setFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Nombre en Almacén */}
              <Text style={styles.inputLabel}>2. Nombre en Almacén (Relación con Nota de Compra PDF)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Queso Amarillo Castell, Jamon Americano..."
                value={formNombreAlmacen}
                onChangeText={setFormNombreAlmacen}
                placeholderTextColor={colors.neutral[400]}
              />
              <Text style={{ fontSize: 11, color: colors.neutral[500], marginTop: -4, marginBottom: 12 }}>
                Nombre como viene en la nota del almacén para asociar automáticamente el inventario diario al subir el PDF.
              </Text>

              {/* Marca */}
              <Text style={styles.inputLabel}>Marca</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Castel, Zwan, FUD, Corona..."
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
                {categoriasList.map((c) => (
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

              {/* SWITCH MANEJA MÚLTIPLES PRESENTACIONES (REQUERIMIENTO 4) */}
              <View style={[styles.switchBox, formManejaMultipres && styles.switchBoxActive]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Layers size={16} color={formManejaMultipres ? colors.primary[700] : colors.neutral[700]} />
                    <Text style={[styles.switchTitle, formManejaMultipres && { color: colors.primary[900] }]}>
                      Maneja múltiples presentaciones: {formManejaMultipres ? 'Sí' : 'No'}
                    </Text>
                  </View>
                  <Text style={styles.switchSub}>
                    {formManejaMultipres
                      ? 'Permite vender en paquete, exhibidor, caja, etc., manteniendo inventario unificado.'
                      : 'Venta con una única unidad de medida y precio general.'}
                  </Text>
                </View>
                <Switch
                  value={formManejaMultipres}
                  onValueChange={handleToggleManejaMultipres}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* APARTADO DE CONFIGURACIÓN DE MULTIPRESENTACIONES */}
              {formManejaMultipres ? (
                <View style={styles.multiConfigSection}>
                  <View style={styles.multiConfigHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.multiConfigTitle}>Configuración de Presentaciones</Text>
                      <Text style={styles.multiConfigSub}>
                        Equivalencias y precios para venta en ruta
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleOpenAddPres}
                      style={styles.addPresBtn}
                    >
                      <Plus size={15} color="#FFFFFF" />
                      <Text style={styles.addPresBtnText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Unidad Base */}
                  <View style={styles.unidadBaseBox}>
                    <Text style={styles.unidadBaseLabel}>Unidad base de inventario unificado:</Text>
                    <View style={styles.unidadChipsRow}>
                      {(['paquete', 'pieza', 'kg'] as Unidad[]).map((u) => (
                        <TouchableOpacity
                          key={u}
                          activeOpacity={0.7}
                          onPress={() => setFormUnidad(u)}
                          style={[styles.unidadChip, formUnidad === u && styles.unidadChipActive]}
                        >
                          <Text style={[styles.unidadChipText, formUnidad === u && styles.unidadChipTextActive]}>
                            {u.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.unidadBaseHint}>
                      * Todas las existencias se registrarán y descontarán en {formUnidad}s.
                    </Text>
                  </View>

                  {/* Lista de Presentaciones del Producto */}
                  {formPresentaciones.length === 0 ? (
                    <View style={styles.emptyPresBox}>
                      <AlertCircle size={20} color={colors.warning[600]} />
                      <Text style={styles.emptyPresText}>
                        No hay presentaciones agregadas. Haz clic en "Agregar" para definir una (Ej. Paquete, Exhibidor, Caja).
                      </Text>
                    </View>
                  ) : (
                    formPresentaciones.map((pr, idx) => (
                      <View key={idx} style={[styles.presItemCard, pr.activa === false && styles.presItemCardInactive]}>
                        <View style={styles.presItemLeft}>
                          <View style={styles.presItemBadgeRow}>
                            <View style={styles.presOrderBadge}>
                              <Text style={styles.presOrderBadgeText}>#{pr.orden ?? (idx + 1)}</Text>
                            </View>
                            <Text style={styles.presItemTitle}>{pr.nombre}</Text>
                            {pr.activa === false ? (
                              <View style={styles.inactBadge}>
                                <Text style={styles.inactBadgeText}>Inactiva</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.presItemDetail}>
                            1 {pr.nombre.toLowerCase()} = <Text style={{ fontWeight: '700' }}>{pr.piezasEquivalentes}</Text> {formUnidad}s
                          </Text>
                          <Text style={styles.presItemPrice}>
                            Precio: <Text style={{ color: colors.primary[700], fontWeight: '800' }}>{formatCurrency(pr.precio)}</Text>
                          </Text>
                          {pr.codigoBarras ? (
                            <Text style={styles.presItemBarcode}>🏷️ {pr.codigoBarras}</Text>
                          ) : null}
                        </View>

                        <View style={styles.presItemRight}>
                          <Switch
                            value={pr.activa !== false}
                            onValueChange={() => handleTogglePresActiva(idx)}
                            trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                            thumbColor="#FFFFFF"
                          />
                          <View style={styles.presItemActions}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleOpenEditPres(idx)}
                              style={styles.presItemBtnEdit}
                            >
                              <Edit2 size={13} color={colors.primary[600]} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleDeletePres(idx)}
                              style={styles.presItemBtnDel}
                            >
                              <Trash2 size={13} color={colors.error[500]} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : (
                /* Tipo de Venta normal: Por Peso o Por Pieza */
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
              )}

              {/* Precios Row */}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    {formManejaMultipres ? 'Precio Referencia ($)' : 'Precio Venta ($) *'}
                  </Text>
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
              <Text style={styles.inputLabel}>
                Existencia en Inventario ({formManejaMultipres ? `${formUnidad}s unificados` : (formPorPeso ? 'Kg' : 'Piezas')})
              </Text>
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

      {/* SUBMODAL CONFIGURAR PRESENTACIÓN INDIVIDUAL */}
      <Modal visible={presModalVisible} transparent animationType="fade" onRequestClose={() => setPresModalVisible(false)}>
        <Pressable style={styles.presModalOverlay} onPress={() => setPresModalVisible(false)}>
          <Pressable style={styles.presModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.presModalHeader}>
              <Text style={styles.presModalTitle}>
                {editingPresIdx !== null ? 'Editar Presentación' : 'Nueva Presentación'}
              </Text>
              <TouchableOpacity onPress={() => setPresModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Nombre de la Presentación *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Paquete, Exhibidor, Caja..."
                value={presFormNombre}
                onChangeText={setPresFormNombre}
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.inputLabel}>Tipo de empaque</Text>
              <View style={styles.unidadChipsRow}>
                {(['paquete', 'exhibidor', 'caja', 'pieza'] as PresentacionTipo[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setPresFormTipo(t)}
                    style={[styles.presTipoChip, presFormTipo === t && styles.presTipoChipActive]}
                  >
                    <Text style={[styles.presTipoChipText, presFormTipo === t && styles.presTipoChipTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Factor de Conversión *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1, 10, 60..."
                    keyboardType="numeric"
                    value={presFormFactor}
                    onChangeText={setPresFormFactor}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <Text style={styles.fieldHelpText}>
                    1 {presFormNombre.trim() || 'unidad'} = {presFormFactor || '1'} {formUnidad}s
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Precio de Venta ($) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="8, 80, 480..."
                    keyboardType="numeric"
                    value={presFormPrecio}
                    onChangeText={setPresFormPrecio}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Código de barras (Opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="750..."
                    value={presFormCodigo}
                    onChangeText={setPresFormCodigo}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <View style={{ width: 90 }}>
                  <Text style={styles.inputLabel}>Orden</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="numeric"
                    value={presFormOrden}
                    onChangeText={setPresFormOrden}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <View style={styles.presActiveRow}>
                <Text style={styles.presActiveLabel}>¿Presentación Activa para Venta?</Text>
                <Switch
                  value={presFormActiva}
                  onValueChange={setPresFormActiva}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSavePres} style={styles.savePresBtn}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.savePresBtnText}>Guardar Presentación</Text>
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
  // Multipresentación estilos
  multiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  multiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
  },
  multiCardPreview: {
    backgroundColor: colors.primary[50] + '40',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary[100],
    gap: 6,
  },
  multiChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  presPillInactive: {
    opacity: 0.5,
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[300],
  },
  presPillNombre: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  presPillPrecio: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary[700],
  },
  presPillFactor: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  desgloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  desgloseText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[900],
    flex: 1,
  },
  switchBoxActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
    borderWidth: 1.5,
  },
  multiConfigSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  multiConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  multiConfigTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  multiConfigSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  addPresBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addPresBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  unidadBaseBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  unidadBaseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  unidadChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unidadChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  unidadChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  unidadChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  unidadChipTextActive: {
    color: '#FFFFFF',
  },
  unidadBaseHint: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyPresBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning[100],
  },
  emptyPresText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning[700],
  },
  presItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  presItemCardInactive: {
    opacity: 0.6,
    backgroundColor: colors.neutral[100],
  },
  presItemLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  presItemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  presOrderBadge: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  presOrderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  presItemTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  inactBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  inactBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.error[600],
  },
  presItemDetail: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 1,
  },
  presItemPrice: {
    fontSize: 11,
    color: colors.neutral[700],
    marginTop: 1,
  },
  presItemBarcode: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  presItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  presItemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  presItemBtnEdit: {
    padding: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[50],
  },
  presItemBtnDel: {
    padding: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.error[50],
  },
  presModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  presModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.floating,
  },
  presModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  presModalTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  presTipoChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  presTipoChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  presTipoChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  presTipoChipTextActive: {
    color: '#FFFFFF',
  },
  fieldHelpText: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
    fontStyle: 'italic',
  },
  presActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  presActiveLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  savePresBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  savePresBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
