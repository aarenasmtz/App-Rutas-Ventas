import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Modal, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
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
  UploadCloud,
  FileSpreadsheet,
  Check,
  HelpCircle,
  Filter,
  ArrowRight,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockProductos, mockCategorias, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader, SearchBar, MoneyDisplay, StockBadge } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import { desglosarInventario } from '@/utils/multipresentacion';
import { useApp } from '@/context/AppContext';
import type {
  Producto,
  CategoriaItem,
  Categoria,
  PresentacionConfig,
  PresentacionTipo,
  Unidad,
  PreviewImportacionResponse,
  FilaPreviewImportacion,
  ResolucionFilaImportacion,
  ConfirmarImportacionResponse,
} from '@/types';

export default function ProductosAdminScreen() {
  const router = useRouter();
  const { user } = useApp();
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

  // Modal Importación CSV Catálogo
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStage, setImportStage] = useState<'select' | 'preview' | 'confirm' | 'result'>('select');
  const [importFileName, setImportFileName] = useState('');
  const [importCsvContent, setImportCsvContent] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<PreviewImportacionResponse | null>(null);
  const [importResoluciones, setImportResoluciones] = useState<Record<number, ResolucionFilaImportacion>>({});
  const [importFilterTab, setImportFilterTab] = useState<'Todas' | 'Nuevo' | 'Existente' | 'Ambiguo' | 'Invalido'>('Todas');
  const [importIsLoading, setImportIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ConfirmarImportacionResponse | null>(null);
  const [importPage, setImportPage] = useState(1);
  const IMPORT_PAGE_SIZE = 50;

  const handleOpenImportCsv = () => {
    setImportModalVisible(true);
    setImportStage('select');
    setImportFileName('');
    setImportCsvContent('');
    setImportPreviewData(null);
    setImportResoluciones({});
    setImportFilterTab('Todas');
    setImportIsLoading(false);
    setImportError(null);
    setImportResult(null);
    setImportPage(1);
  };

  const handlePickFileWeb = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setImportFileName(file.name);
          setImportError(null);
          const reader = new FileReader();
          reader.onload = (evt) => {
            const content = evt.target?.result as string;
            setImportCsvContent(content);
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Aviso', 'La selección interactiva de archivos CSV está habilitada en la versión web.');
    }
  };

  const handleLoadDemoCsv = async () => {
    setImportIsLoading(true);
    setImportError(null);
    try {
      const res = await DataService.getArchivoDemoCsv();
      if (res && res.contenidoCsv) {
        setImportFileName(res.nombreArchivo || 'ProductosMiguel.csv');
        setImportCsvContent(res.contenidoCsv);
      } else {
        throw new Error('No se pudo obtener el archivo de demostración');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error al cargar el archivo de prueba');
    } finally {
      setImportIsLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!importCsvContent.trim()) {
      setImportError('Selecciona o carga un archivo CSV primero.');
      return;
    }
    setImportIsLoading(true);
    setImportError(null);
    try {
      const preview = await DataService.previewImportacionProductos({
        nombreArchivo: importFileName || 'ProductosMiguel.csv',
        contenidoCsv: importCsvContent,
      });

      setImportPreviewData(preview);

      const resolucionesMap: Record<number, ResolucionFilaImportacion> = {};
      preview.filas.forEach((f) => {
        const esExistente = f.clasificacion === 'Existente';
        const esInvalido = f.clasificacion === 'Invalido';
        const accionDefault = esExistente ? 'Vincular' : (esInvalido ? 'Omitir' : 'Crear');
        const prodExistId = esExistente ? f.productoCoincidenteId : undefined;

        resolucionesMap[f.numeroFila] = {
          numeroFila: f.numeroFila,
          codigoCsv: f.codigoCsv,
          nombreCsv: f.nombreCsv,
          costoCsv: f.costoCsv || 0,
          precioCsv: f.precioCsv || 0,
          accion: accionDefault,
          productoExistenteId: prodExistId,
          unidadConfirmada: (f.unidadCsv && f.unidadCsv.toLowerCase() !== 'unidad') ? f.unidadCsv.toLowerCase() : undefined,
        };
      });

      setImportResoluciones(resolucionesMap);
      setImportStage('preview');
      setImportPage(1);
    } catch (err: any) {
      setImportError(err.message || 'Error al procesar la previsualización en el servidor');
    } finally {
      setImportIsLoading(false);
    }
  };

  const handleSetResolucionAccion = (numeroFila: number, accion: 'Crear' | 'Vincular' | 'Omitir', productoExistenteId?: string) => {
    setImportResoluciones((prev) => {
      const existing = prev[numeroFila];
      if (!existing) return prev;
      return {
        ...prev,
        [numeroFila]: {
          ...existing,
          accion,
          productoExistenteId: accion === 'Vincular' ? (productoExistenteId || existing.productoExistenteId) : undefined,
        },
      };
    });
  };

  const handleSetResolucionUnidad = (numeroFila: number, unidad: string | undefined) => {
    setImportResoluciones((prev) => {
      const existing = prev[numeroFila];
      if (!existing) return prev;
      return {
        ...prev,
        [numeroFila]: {
          ...existing,
          unidadConfirmada: unidad,
        },
      };
    });
  };

  const handleAprobarSugerencias = () => {
    if (!importPreviewData) return;
    const updated: Record<number, ResolucionFilaImportacion> = {};
    importPreviewData.filas.forEach((f) => {
      const esExistente = f.clasificacion === 'Existente';
      const esInvalido = f.clasificacion === 'Invalido';
      const accion = esExistente ? 'Vincular' : (esInvalido ? 'Omitir' : 'Crear');
      updated[f.numeroFila] = {
        numeroFila: f.numeroFila,
        codigoCsv: f.codigoCsv,
        nombreCsv: f.nombreCsv,
        costoCsv: f.costoCsv || 0,
        precioCsv: f.precioCsv || 0,
        accion,
        productoExistenteId: esExistente ? f.productoCoincidenteId : undefined,
        unidadConfirmada: (f.unidadCsv && f.unidadCsv.toLowerCase() !== 'unidad') ? f.unidadCsv.toLowerCase() : undefined,
      };
    });
    setImportResoluciones(updated);
    Alert.alert('Sugerencias aplicadas', 'Se restablecieron las acciones recomendadas para todas las filas.');
  };

  const handleExecuteImport = async () => {
    if (!importPreviewData) return;
    setImportIsLoading(true);
    setImportError(null);
    try {
      const resolucionesArray = Object.values(importResoluciones);
      const res = await DataService.confirmarImportacionProductos({
        fileHash: importPreviewData.fileHash,
        nombreArchivo: importFileName || 'ProductosMiguel.csv',
        usuario: user?.nombre || 'Miguel',
        resoluciones: resolucionesArray,
      });

      setImportResult(res);
      setImportStage('result');
      await loadProductos();
    } catch (err: any) {
      setImportError(err.message || 'Error al confirmar la importación en la base de datos');
    } finally {
      setImportIsLoading(false);
    }
  };

  const importFilteredFilas = useMemo(() => {
    if (!importPreviewData) return [];
    if (importFilterTab === 'Todas') return importPreviewData.filas;
    return importPreviewData.filas.filter((f) => f.clasificacion === importFilterTab);
  }, [importPreviewData, importFilterTab]);

  const importTotalPages = Math.max(1, Math.ceil(importFilteredFilas.length / IMPORT_PAGE_SIZE));
  const importPaginatedFilas = useMemo(() => {
    const start = (importPage - 1) * IMPORT_PAGE_SIZE;
    return importFilteredFilas.slice(start, start + IMPORT_PAGE_SIZE);
  }, [importFilteredFilas, importPage]);

  const importSummaryStats = useMemo(() => {
    const list = Object.values(importResoluciones);
    const crear = list.filter((r) => r.accion === 'Crear').length;
    const vincular = list.filter((r) => r.accion === 'Vincular').length;
    const omitir = list.filter((r) => r.accion === 'Omitir').length;
    const pendientes = list.filter((r) => r.accion === 'Crear' && (!r.unidadConfirmada || r.unidadConfirmada === 'unidad')).length;
    return { crear, vincular, omitir, pendientes };
  }, [importResoluciones]);

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
      // Inicializar con presentación base si no tiene ninguna
      if (formPresentaciones.length === 0) {
        setFormPresentaciones([
          {
            tipo: 'paquete',
            nombre: 'Paquete',
            piezasEquivalentes: 1,
            precio: parseFloat(formPrecioBase) || 8,
            activa: true,
            orden: 1,
            descripcionEquivalencia: '1 paquete = 1 unidad base',
          },
        ]);
      }
    }
  };

  const handleCargarPlantillaCastel = () => {
    setFormUnidad('paquete');
    setFormPresentaciones([
      { tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 8, activa: true, orden: 1, descripcionEquivalencia: '1 paquete = 1 unidad base' },
      { tipo: 'exhibidor', nombre: 'Exhibidor', piezasEquivalentes: 10, precio: 80, activa: true, orden: 2, descripcionEquivalencia: '1 exhibidor = 10 paquetes' },
      { tipo: 'caja', nombre: 'Caja', piezasEquivalentes: 60, precio: 480, activa: true, orden: 3, descripcionEquivalencia: '1 caja = 60 paquetes' },
    ]);
    setFormPrecioBase('8');
  };

  const handleCargarPlantillaCajaPieza = () => {
    setFormUnidad('pieza');
    const pBase = parseFloat(formPrecioBase) || 10;
    setFormPresentaciones([
      { tipo: 'pieza', nombre: 'Pieza', piezasEquivalentes: 1, precio: pBase, activa: true, orden: 1, descripcionEquivalencia: '1 pieza = 1 unidad base' },
      { tipo: 'caja', nombre: 'Caja (24 pzas)', piezasEquivalentes: 24, precio: pBase * 24, activa: true, orden: 2, descripcionEquivalencia: '1 caja = 24 piezas' },
    ]);
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
        title="Catálogo de Productos"
        subtitle={`${filtered.length} de ${productosList.length} referencias`}
        onBack={handleBack}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleOpenImportCsv} style={styles.importBtnHeader}>
              <UploadCloud size={16} color="#FFFFFF" />
              <Text style={styles.importBtnHeaderText}>Importar CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={handleOpenCreate} style={styles.createBtnHeader}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.createBtnHeaderText}>Nuevo</Text>
            </TouchableOpacity>
          </View>
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
                        {p.estadoConfiguracion === 'Pendiente' ? (
                          <View style={styles.pendingBadge}>
                            <AlertCircle size={11} color="#B45309" />
                            <Text style={styles.pendingBadgeText}>⚠️ Pendiente config.</Text>
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

                  {/* Plantillas Rápidas de Presentación */}
                  <View style={{ marginBottom: spacing.md, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.neutral[600], marginBottom: 6, fontWeight: '600' }}>
                      Cargar plantilla de equivalencias preconfigurada:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleCargarPlantillaCastel}
                        style={{
                          backgroundColor: colors.primary[50],
                          borderColor: colors.primary[300],
                          borderWidth: 1,
                          borderRadius: radius.md,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary[800] }}>
                          ⚡ Plantilla Castel (Paquete / Exhibidor / Caja)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleCargarPlantillaCajaPieza}
                        style={{
                          backgroundColor: colors.neutral[100],
                          borderColor: colors.neutral[300],
                          borderWidth: 1,
                          borderRadius: radius.md,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[800] }}>
                          📦 Plantilla Caja / Pieza (24 pzas)
                        </Text>
                      </TouchableOpacity>
                    </View>
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

      {/* ========================================================= */}
      {/* MODAL DE IMPORTACIÓN CSV DE CATÁLOGO                     */}
      {/* ========================================================= */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!importIsLoading) setImportModalVisible(false);
        }}
      >
        <Pressable
          style={styles.importModalOverlay}
          onPress={() => {
            if (!importIsLoading) setImportModalVisible(false);
          }}
        >
          <Pressable style={styles.importModalSheet} onPress={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <View style={styles.importModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.importHeaderIcon}>
                  <FileSpreadsheet size={22} color={colors.primary[700]} />
                </View>
                <View>
                  <Text style={styles.importModalTitle}>Importar Catálogo CSV</Text>
                  <Text style={styles.importModalSubtitle}>
                    {importStage === 'select' && 'Paso 1: Seleccionar archivo CSV'}
                    {importStage === 'preview' && `Paso 2: Vista previa y revisión (${importPreviewData?.totalFilas || 0} filas)`}
                    {importStage === 'confirm' && 'Paso 3: Confirmación de cambios en SQL Server'}
                    {importStage === 'result' && 'Paso 4: Resumen de persistencia'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!importIsLoading) setImportModalVisible(false);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Error Banner si existe */}
            {importError && (
              <View style={styles.importErrorBanner}>
                <AlertCircle size={16} color={colors.error[700]} />
                <Text style={styles.importErrorText}>{importError}</Text>
              </View>
            )}

            {/* STAGE 1: SELECCION DE ARCHIVO */}
            {importStage === 'select' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                <Text style={styles.importInstructionText}>
                  Carga el catálogo comercial real de Miguel. El sistema mapeará nombres, costos y precios oficiales, clasificará coincidencias y protegerá las existencias y presentaciones actuales.
                </Text>

                <View style={styles.importSourceCards}>
                  {/* Opción 1: Archivo local */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickFileWeb}
                    style={styles.importOptionCard}
                  >
                    <View style={styles.importOptionIconWrap}>
                      <UploadCloud size={28} color={colors.primary[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.importOptionTitle}>1. Seleccionar archivo de tu equipo</Text>
                      <Text style={styles.importOptionDesc}>
                        Elige ProductosMiguel.csv u otro archivo desde tu explorador de archivos local.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Opción 2: Archivo oficial del proyecto */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLoadDemoCsv}
                    style={[styles.importOptionCard, styles.importOptionCardHighlight]}
                  >
                    <View style={[styles.importOptionIconWrap, { backgroundColor: colors.primary[100] }]}>
                      <Sparkles size={28} color={colors.primary[700]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.importOptionTitle, { color: colors.primary[900] }]}>
                        2. Cargar ProductosMiguel.csv del proyecto
                      </Text>
                      <Text style={styles.importOptionDesc}>
                        Carga directa del archivo oficial con los 456 registros reales de Don Miguel para demostración inmediata.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Archivo cargado preview */}
                {importFileName ? (
                  <View style={styles.fileSelectedBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <FileText size={22} color={colors.primary[700]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileSelectedName}>{importFileName}</Text>
                        <Text style={styles.fileSelectedSize}>
                          {(importCsvContent.length / 1024).toFixed(1)} KB • {importCsvContent.split('\n').length - 1} filas detectadas
                        </Text>
                      </View>
                      <CheckCircle2 size={20} color={colors.success[600]} />
                    </View>
                  </View>
                ) : null}

                {/* Botón generar preview */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleGeneratePreview}
                  disabled={!importCsvContent || importIsLoading}
                  style={[
                    styles.primaryActionBtn,
                    (!importCsvContent || importIsLoading) && styles.primaryActionBtnDisabled,
                  ]}
                >
                  {importIsLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>Generar Vista Previa y Clasificación</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* STAGE 2: VISTA PREVIA Y RESOLUCIÓN */}
            {importStage === 'preview' && importPreviewData && (
              <View style={{ flex: 1 }}>
                {/* Banner de archivo ya importado */}
                {importPreviewData.yaFueImportadoPreviamente && (
                  <View style={styles.importWarningBanner}>
                    <AlertCircle size={16} color="#92400E" />
                    <Text style={styles.importWarningText}>
                      ⚠️ Este archivo ya fue importado el{' '}
                      {new Date(importPreviewData.fechaUltimaImportacion || '').toLocaleString()}.
                      El servidor evitará importaciones duplicadas para proteger los datos.
                    </Text>
                  </View>
                )}

                {/* Métricas de Clasificación */}
                <View style={styles.metricRow}>
                  <View style={[styles.metricCard, { borderLeftColor: colors.neutral[400] }]}>
                    <Text style={styles.metricVal}>{importPreviewData.totalFilas}</Text>
                    <Text style={styles.metricLabel}>Total Filas</Text>
                  </View>
                  <View style={[styles.metricCard, { borderLeftColor: colors.success[600] }]}>
                    <Text style={[styles.metricVal, { color: colors.success[700] }]}>
                      {importPreviewData.totalNuevos}
                    </Text>
                    <Text style={styles.metricLabel}>Nuevos</Text>
                  </View>
                  <View style={[styles.metricCard, { borderLeftColor: colors.primary[600] }]}>
                    <Text style={[styles.metricVal, { color: colors.primary[700] }]}>
                      {importPreviewData.totalExistentes}
                    </Text>
                    <Text style={styles.metricLabel}>Existentes</Text>
                  </View>
                  <View style={[styles.metricCard, { borderLeftColor: colors.warning[600] }]}>
                    <Text style={[styles.metricVal, { color: colors.warning[700] }]}>
                      {importPreviewData.totalAmbiguos}
                    </Text>
                    <Text style={styles.metricLabel}>Ambiguos</Text>
                  </View>
                  <View style={[styles.metricCard, { borderLeftColor: colors.error[600] }]}>
                    <Text style={[styles.metricVal, { color: colors.error[700] }]}>
                      {importPreviewData.totalInvalidos}
                    </Text>
                    <Text style={styles.metricLabel}>Inválidos</Text>
                  </View>
                </View>

                {/* Tabs de Filtro y Botón rápido */}
                <View style={styles.filterAndActionsRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(['Todas', 'Nuevo', 'Existente', 'Ambiguo', 'Invalido'] as const).map((tab) => {
                        const count =
                          tab === 'Todas'
                            ? importPreviewData.totalFilas
                            : tab === 'Nuevo'
                            ? importPreviewData.totalNuevos
                            : tab === 'Existente'
                            ? importPreviewData.totalExistentes
                            : tab === 'Ambiguo'
                            ? importPreviewData.totalAmbiguos
                            : importPreviewData.totalInvalidos;

                        return (
                          <TouchableOpacity
                            key={tab}
                            onPress={() => {
                              setImportFilterTab(tab);
                              setImportPage(1);
                            }}
                            style={[
                              styles.importFilterTab,
                              importFilterTab === tab && styles.importFilterTabActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.importFilterTabText,
                                importFilterTab === tab && styles.importFilterTabTextActive,
                              ]}
                            >
                              {tab} ({count})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    onPress={handleAprobarSugerencias}
                    style={styles.applySuggestionsBtn}
                  >
                    <Check size={14} color={colors.primary[700]} />
                    <Text style={styles.applySuggestionsBtnText}>Restablecer sugerencias</Text>
                  </TouchableOpacity>
                </View>

                {/* Lista de Filas Pagina */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginTop: 8 }}>
                  {importPaginatedFilas.map((f) => {
                    const resolucion = importResoluciones[f.numeroFila] || {
                      numeroFila: f.numeroFila,
                      codigoCsv: f.codigoCsv,
                      nombreCsv: f.nombreCsv,
                      costoCsv: f.costoCsv || 0,
                      precioCsv: f.precioCsv || 0,
                      accion: 'Crear',
                    };

                    const badgeStyle =
                      f.clasificacion === 'Nuevo'
                        ? styles.badgeNuevo
                        : f.clasificacion === 'Existente'
                        ? styles.badgeExistente
                        : f.clasificacion === 'Ambiguo'
                        ? styles.badgeAmbiguo
                        : styles.badgeInvalido;

                    const badgeTextStyle =
                      f.clasificacion === 'Nuevo'
                        ? styles.badgeTextNuevo
                        : f.clasificacion === 'Existente'
                        ? styles.badgeTextExistente
                        : f.clasificacion === 'Ambiguo'
                        ? styles.badgeTextAmbiguo
                        : styles.badgeTextInvalido;

                    return (
                      <View key={f.numeroFila} style={styles.importRowCard}>
                        {/* Fila Top: # y Nombre */}
                        <View style={styles.importRowTop}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.importRowNum}>#{f.numeroFila}</Text>
                              <View style={[styles.classificationBadge, badgeStyle]}>
                                <Text style={[styles.classificationBadgeText, badgeTextStyle]}>
                                  {f.clasificacion}
                                </Text>
                              </View>
                              {f.codigoCsv ? (
                                <Text style={styles.importRowCode}>Origen: {f.codigoCsv}</Text>
                              ) : null}
                            </View>
                            <Text style={styles.importRowName}>{f.nombreCsv || '(Sin nombre)'}</Text>
                          </View>

                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.importRowPrice}>${(f.precioCsv || 0).toFixed(2)}</Text>
                            <Text style={styles.importRowCost}>Costo: ${(f.costoCsv || 0).toFixed(2)}</Text>
                          </View>
                        </View>

                        {/* Motivo de clasificación */}
                        {f.motivoClasificacion ? (
                          <Text style={styles.importRowMotivo}>ℹ️ {f.motivoClasificacion}</Text>
                        ) : null}

                        {/* Candidato si es existente o ambiguo */}
                        {f.candidatosCoincidentes.length > 0 && (
                          <View style={styles.candidatosBox}>
                            <Text style={styles.candidatosTitle}>
                              Candidatos coincidentes en catálogo:
                            </Text>
                            {f.candidatosCoincidentes.map((c) => (
                              <View key={c.codigo} style={styles.candidatoItem}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.candidatoNombre}>
                                    {c.nombre} <Text style={{ color: colors.neutral[500] }}>({c.codigo})</Text>
                                  </Text>
                                  <Text style={styles.candidatoInfo}>
                                    Precio actual: ${c.precioBase} • Costo: ${c.precioCompra || 0} • Stock actual: {c.existencia} {c.unidad}s
                                  </Text>
                                </View>
                                {resolucion.accion === 'Vincular' && resolucion.productoExistenteId === c.codigo ? (
                                  <View style={styles.linkedBadge}>
                                    <Check size={12} color={colors.primary[700]} />
                                    <Text style={styles.linkedBadgeText}>Vinculado</Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleSetResolucionAccion(f.numeroFila, 'Vincular', c.codigo)}
                                    style={styles.linkCandidateBtn}
                                  >
                                    <Text style={styles.linkCandidateBtnText}>Vincular a este</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Acciones para esta fila */}
                        <View style={styles.rowResolucionActions}>
                          <Text style={styles.resolucionLabel}>Acción:</Text>
                          <View style={styles.actionChipsRow}>
                            <TouchableOpacity
                              onPress={() => handleSetResolucionAccion(f.numeroFila, 'Crear')}
                              style={[
                                styles.actionChip,
                                resolucion.accion === 'Crear' && styles.actionChipActiveCrear,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.actionChipText,
                                  resolucion.accion === 'Crear' && styles.actionChipTextActive,
                                ]}
                              >
                                Crear nuevo (stock 0)
                              </Text>
                            </TouchableOpacity>

                            {f.candidatosCoincidentes.length > 0 && (
                              <TouchableOpacity
                                onPress={() =>
                                  handleSetResolucionAccion(
                                    f.numeroFila,
                                    'Vincular',
                                    f.productoCoincidenteId || f.candidatosCoincidentes[0]?.codigo
                                  )
                                }
                                style={[
                                  styles.actionChip,
                                  resolucion.accion === 'Vincular' && styles.actionChipActiveVincular,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.actionChipText,
                                    resolucion.accion === 'Vincular' && styles.actionChipTextActive,
                                  ]}
                                >
                                  Vincular (conservar stock)
                                </Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              onPress={() => handleSetResolucionAccion(f.numeroFila, 'Omitir')}
                              style={[
                                styles.actionChip,
                                resolucion.accion === 'Omitir' && styles.actionChipActiveOmitir,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.actionChipText,
                                  resolucion.accion === 'Omitir' && styles.actionChipTextActive,
                                ]}
                              >
                                Omitir
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Selector de Unidad de Venta si es Crear */}
                        {resolucion.accion === 'Crear' && (
                          <View style={styles.unidadConfirmRow}>
                            <Text style={styles.resolucionLabel}>Unidad de venta:</Text>
                            <View style={styles.unidadChipsRow}>
                              {[
                                { key: undefined, label: '⚠️ Pendiente' },
                                { key: 'pieza', label: 'Pieza' },
                                { key: 'paquete', label: 'Paquete' },
                                { key: 'caja', label: 'Caja' },
                                { key: 'kg', label: 'Kg' },
                              ].map((u) => {
                                const isSelected = resolucion.unidadConfirmada === u.key;
                                return (
                                  <TouchableOpacity
                                    key={u.label}
                                    onPress={() => handleSetResolucionUnidad(f.numeroFila, u.key)}
                                    style={[
                                      styles.unidadPickChip,
                                      isSelected && styles.unidadPickChipActive,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.unidadPickChipText,
                                        isSelected && styles.unidadPickChipTextActive,
                                      ]}
                                    >
                                      {u.label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Paginación */}
                {importTotalPages > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      disabled={importPage <= 1}
                      onPress={() => setImportPage((p) => Math.max(1, p - 1))}
                      style={[styles.pageBtn, importPage <= 1 && styles.pageBtnDisabled]}
                    >
                      <Text style={styles.pageBtnText}>◀ Anterior</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageNumberText}>
                      Página {importPage} de {importTotalPages} ({importFilteredFilas.length} registros)
                    </Text>
                    <TouchableOpacity
                      disabled={importPage >= importTotalPages}
                      onPress={() => setImportPage((p) => Math.min(importTotalPages, p + 1))}
                      style={[
                        styles.pageBtn,
                        importPage >= importTotalPages && styles.pageBtnDisabled,
                      ]}
                    >
                      <Text style={styles.pageBtnText}>Siguiente ▶</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Footer con Resumen y Continuar */}
                <View style={styles.importFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.footerSummaryText}>
                      <Text style={{ fontWeight: '700', color: colors.success[700] }}>
                        {importSummaryStats.crear}
                      </Text>{' '}
                      a crear ({importSummaryStats.pendientes} pendientes de unidad),{' '}
                      <Text style={{ fontWeight: '700', color: colors.primary[700] }}>
                        {importSummaryStats.vincular}
                      </Text>{' '}
                      a vincular,{' '}
                      <Text style={{ fontWeight: '700', color: colors.neutral[600] }}>
                        {importSummaryStats.omitir}
                      </Text>{' '}
                      a omitir
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setImportStage('select')}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryBtnText}>Atrás</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setImportStage('confirm')}
                      style={styles.primaryActionBtnSmall}
                    >
                      <Text style={styles.primaryActionBtnText}>Continuar a Confirmación</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* STAGE 3: CONFIRMACIÓN DE CAMBIOS */}
            {importStage === 'confirm' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                <View style={styles.confirmBox}>
                  <View style={styles.confirmHeaderRow}>
                    <AlertCircle size={26} color={colors.primary[700]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.confirmTitle}>Resumen de Cambios a Persistir</Text>
                      <Text style={styles.confirmSubtitle}>
                        La operación se ejecutará bajo una transacción en SQL Server.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.confirmList}>
                    <View style={styles.confirmItem}>
                      <Check size={18} color={colors.success[600]} />
                      <Text style={styles.confirmItemText}>
                        <Text style={{ fontWeight: '700' }}>{importSummaryStats.crear} productos nuevos</Text>{' '}
                        se darán de alta en catálogo con <Text style={{ fontWeight: '700' }}>existencia = 0</Text> (sin inventar existencias ficticias).
                      </Text>
                    </View>

                    <View style={styles.confirmItem}>
                      <Check size={18} color={colors.warning[600]} />
                      <Text style={styles.confirmItemText}>
                        <Text style={{ fontWeight: '700' }}>{importSummaryStats.pendientes} productos</Text>{' '}
                        quedarán como <Text style={{ fontWeight: '700' }}>'⚠️ Pendiente'</Text>, requiriendo confirmar su unidad en Catálogo antes de poder venderse.
                      </Text>
                    </View>

                    <View style={styles.confirmItem}>
                      <Check size={18} color={colors.primary[600]} />
                      <Text style={styles.confirmItemText}>
                        <Text style={{ fontWeight: '700' }}>{importSummaryStats.vincular} productos existentes</Text>{' '}
                        actualizarán exclusivamente su precio y costo. Sus existencias, presentaciones e historial permanecen 100% intactos.
                      </Text>
                    </View>

                    <View style={styles.confirmItem}>
                      <Check size={18} color={colors.neutral[500]} />
                      <Text style={styles.confirmItemText}>
                        <Text style={{ fontWeight: '700' }}>{importSummaryStats.omitir} filas</Text>{' '}
                        serán ignoradas sin realizar alteraciones.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.securityAuditBox}>
                    <Text style={styles.securityAuditText}>
                      🔒 <Text style={{ fontWeight: '700' }}>Auditoría activa:</Text> Se registrará un registro en la tabla{' '}
                      <Text style={{ fontWeight: '700' }}>ImportacionesCatalogo</Text> con el hash SHA-256 del archivo para impedir reimportaciones accidentales.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
                  <TouchableOpacity
                    onPress={() => setImportStage('preview')}
                    style={[styles.secondaryBtn, { flex: 1 }]}
                    disabled={importIsLoading}
                  >
                    <Text style={styles.secondaryBtnText}>Volver a Revisión</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleExecuteImport}
                    disabled={importIsLoading}
                    style={[
                      styles.primaryActionBtn,
                      { flex: 2 },
                      importIsLoading && styles.primaryActionBtnDisabled,
                    ]}
                  >
                    {importIsLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="#FFFFFF" />
                        <Text style={styles.primaryActionBtnText}>Confirmar e Importar Ahora</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* STAGE 4: RESULTADO PERSISTIDO */}
            {importStage === 'result' && (
              <View style={styles.resultContainer}>
                <View style={styles.resultIconWrap}>
                  <CheckCircle2 size={54} color={colors.success[600]} />
                </View>
                <Text style={styles.resultTitle}>¡Importación Exitosa!</Text>
                <Text style={styles.resultMessage}>{importResult?.message}</Text>

                <View style={styles.resultStatsBox}>
                  <View style={styles.resultStatRow}>
                    <Text style={styles.resultStatLabel}>Total registros procesados:</Text>
                    <Text style={styles.resultStatVal}>{importResult?.totalProcesados}</Text>
                  </View>
                  <View style={styles.resultStatRow}>
                    <Text style={styles.resultStatLabel}>Nuevos productos creados:</Text>
                    <Text style={[styles.resultStatVal, { color: colors.success[700] }]}>
                      {importResult?.totalCreados}
                    </Text>
                  </View>
                  <View style={styles.resultStatRow}>
                    <Text style={styles.resultStatLabel}>Productos existentes actualizados:</Text>
                    <Text style={[styles.resultStatVal, { color: colors.primary[700] }]}>
                      {importResult?.totalActualizados}
                    </Text>
                  </View>
                  <View style={styles.resultStatRow}>
                    <Text style={styles.resultStatLabel}>Pendientes de unidad de venta:</Text>
                    <Text style={[styles.resultStatVal, { color: colors.warning[700] }]}>
                      {importResult?.totalPendientesConfiguracion}
                    </Text>
                  </View>
                  <View style={styles.resultStatRow}>
                    <Text style={styles.resultStatLabel}>Filas omitidas:</Text>
                    <Text style={styles.resultStatVal}>{importResult?.totalOmitidos}</Text>
                  </View>
                </View>

                {importResult?.advertencias && importResult.advertencias.length > 0 && (
                  <View style={styles.advertenciasBox}>
                    <Text style={styles.advertenciasTitle}>Observaciones del servidor:</Text>
                    {importResult.advertencias.map((adv, idx) => (
                      <Text key={idx} style={styles.advertenciaText}>• {adv}</Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setImportModalVisible(false)}
                  style={styles.primaryActionBtn}
                >
                  <Text style={styles.primaryActionBtnText}>Ver Catálogo Actualizado ({productosList.length} productos)</Text>
                </TouchableOpacity>
              </View>
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
  importBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  importBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  importModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  importModalSheet: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '92%',
    ...shadows.floating,
  },
  importModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  importHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  importModalTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  importModalSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  importErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  importErrorText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.error[700],
    fontWeight: '600',
  },
  importWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  importWarningText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: '#92400E',
    fontWeight: '600',
  },
  importInstructionText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  importSourceCards: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  importOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  importOptionCardHighlight: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  importOptionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  importOptionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  importOptionDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 16,
  },
  fileSelectedBox: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fileSelectedName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  fileSelectedSize: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  primaryActionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.xs + 2,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  metricVal: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.neutral[800],
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginTop: 1,
  },
  filterAndActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  importFilterTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  importFilterTabActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  importFilterTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  importFilterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  applySuggestionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  applySuggestionsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
  },
  importRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: spacing.sm + 2,
    marginBottom: spacing.xs + 4,
  },
  importRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  importRowNum: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.neutral[400],
  },
  importRowCode: {
    fontSize: 10,
    color: colors.neutral[500],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  importRowName: {
    fontSize: fontSize.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 2,
  },
  importRowPrice: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary[700],
  },
  importRowCost: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  importRowMotivo: {
    fontSize: 10,
    color: colors.neutral[600],
    marginTop: 4,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classificationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeNuevo: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeExistente: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  badgeAmbiguo: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeInvalido: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeTextNuevo: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success[700],
  },
  badgeTextExistente: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary[700],
  },
  badgeTextAmbiguo: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  badgeTextInvalido: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.error[700],
  },
  candidatosBox: {
    marginTop: spacing.xs + 2,
    padding: spacing.xs + 2,
    backgroundColor: colors.primary[50],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  candidatosTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[900],
    marginBottom: 4,
  },
  candidatoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  candidatoNombre: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  candidatoInfo: {
    fontSize: 9,
    color: colors.neutral[600],
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary[800],
  },
  linkCandidateBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkCandidateBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary[700],
  },
  rowResolucionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs + 2,
  },
  resolucionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  actionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  actionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  actionChipActiveCrear: {
    backgroundColor: colors.success[600],
    borderColor: colors.success[700],
  },
  actionChipActiveVincular: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  actionChipActiveOmitir: {
    backgroundColor: colors.neutral[600],
    borderColor: colors.neutral[700],
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  actionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unidadConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  unidadPickChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  unidadPickChipActive: {
    backgroundColor: colors.neutral[800],
    borderColor: colors.neutral[900],
  },
  unidadPickChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  unidadPickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    marginTop: 4,
  },
  pageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  pageBtnDisabled: {
    opacity: 0.35,
  },
  pageBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  pageNumberText: {
    fontSize: 10,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  importFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    marginTop: spacing.xs,
  },
  footerSummaryText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
  secondaryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  confirmBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  confirmTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  confirmSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  confirmList: {
    gap: spacing.sm,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  confirmItemText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.neutral[800],
    lineHeight: 18,
  },
  securityAuditBox: {
    backgroundColor: colors.primary[50],
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginTop: spacing.md,
  },
  securityAuditText: {
    fontSize: 10,
    color: colors.primary[900],
    lineHeight: 15,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  resultMessage: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  resultStatsBox: {
    width: '100%',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 8,
    marginBottom: spacing.md,
  },
  resultStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[700],
  },
  resultStatVal: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  advertenciasBox: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  advertenciasTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  advertenciaText: {
    fontSize: 10,
    color: '#78350F',
    lineHeight: 14,
  },
});
