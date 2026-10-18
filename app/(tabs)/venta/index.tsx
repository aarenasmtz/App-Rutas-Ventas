import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ShoppingCart,
  ChevronRight,
  Clock,
  User,
  Check,
  X,
  Package,
  Star,
  Plus,
  Minus,
  SlidersHorizontal,
  ArrowUpToLine,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Store,
  UserPlus,
  ArrowLeft,
  Flame,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import { ConnectivityIndicator } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import { getPrecioPresentacion } from '@/utils/multipresentacion';
import type { Producto, Cliente, ItemCarrito, PresentacionConfig } from '@/types';

// Helper para normalizar texto (sin acentos, minúsculas)
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Cliente predeterminado para venta rápida de mostrador
const CLIENTE_GENERAL: Cliente = {
  id: 'general',
  nombre: 'Venta de Mostrador / General',
  propietario: 'Cliente General',
  direccion: 'Venta directa en ruta',
  ruta: 'Ruta General',
  diasVisita: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  saldo: 0,
  limiteCredito: 0,
  estado: 'Pendiente',
  ultimaVisita: '',
  telefono: '',
  activo: true,
  distanciaMock: '0m',
  historial: [],
  sugerido: [],
};

export default function VentaScreen() {
  const router = useRouter();
  const {
    carrito,
    addToCarrito,
    updateCarritoItem,
    removeFromCarrito,
    clearCarrito,
    clienteActivoId,
    setClienteActivoId,
    user,
  } = useApp();

  const { width: windowWidth, fontScale } = useWindowDimensions();

  // 3 columnas en móvil estándar cuando el ancho permita leer y tocar;
  // 2 columnas en pantallas muy estrechas (<355px) o texto ampliado por accesibilidad (>1.25)
  const numColumns = useMemo(() => {
    if (windowWidth < 355 || fontScale > 1.25) return 2;
    if (windowWidth >= 960) return 5;
    if (windowWidth >= 640) return 4;
    return 3;
  }, [windowWidth, fontScale]);

  const gapSize = 7; // Separación de 6–8 px
  const horizontalPadding = 16; // 8px de margen en cada lado
  const cardWidth = useMemo(() => {
    const availableWidth = Math.min(windowWidth, 1200) - horizontalPadding;
    return Math.floor((availableWidth - (numColumns - 1) * gapSize) / numColumns);
  }, [windowWidth, numColumns]);

  const userId = user?.id || 'default';

  // Datos del catálogo
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);

  // Búsqueda y filtros
  const [productSearch, setProductSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'favoritos' | 'frecuentes'>('todos');
  const [ordenModo, setOrdenModo] = useState<'mi_orden' | 'az'>('mi_orden');

  // Cliente selección y búsqueda
  const [clientSearch, setClientSearch] = useState('');
  const [isChangingClient, setIsChangingClient] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);

  // Formulario nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPropietario, setNuevoPropietario] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');

  // Modales interactivos de producto
  const [selectedMultiProd, setSelectedMultiProd] = useState<Producto | null>(null);
  const [qtyPromptItem, setQtyPromptItem] = useState<{
    producto: Producto;
    currentQty: number;
    cartIndex: number;
    presentacion?: PresentacionConfig;
  } | null>(null);
  const [manualQtyInput, setManualQtyInput] = useState('');

  // Modo Ordenar Personalizado (Spotify)
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [draftOrderIds, setDraftOrderIds] = useState<string[]>([]);

  // Favoritos y orden persistido
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);
  const [frecuenciaMap, setFrecuenciaMap] = useState<Record<string, number>>({});

  // Cargar datos
  const reloadData = useCallback(async () => {
    try {
      const [cls, prs, cats] = await Promise.all([
        DataService.getClientes(),
        DataService.getProductos(),
        DataService.getCategorias(),
      ]);
      setClientesList(cls || []);
      setProductosList(prs || []);
      setCategoriasList(cats || []);

      const favs = DataService.getFavoritos(userId);
      setFavoritoIds(new Set(favs));

      const ord = DataService.getOrdenPersonalizado(userId);
      setSavedOrderIds(ord);

      const pref = DataService.getSortPreference(userId);
      if (pref === 'az') setOrdenModo('az');
      else setOrdenModo('mi_orden');

      const frecs = DataService.getFrecuenciaVentas(30);
      setFrecuenciaMap(frecs);
    } catch (err) {
      console.warn('Error loading sale data:', err);
    }
  }, [userId]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Cliente activo
  const cliente = useMemo(() => {
    if (!clienteActivoId) return null;
    if (clienteActivoId === 'general') return CLIENTE_GENERAL;
    return clientesList.find((c) => String(c.id) === String(clienteActivoId)) || null;
  }, [clienteActivoId, clientesList]);

  // Lista de categorías
  const categorias = useMemo(() => {
    const defaultCats = [
      'Todas',
      'Jamón',
      'Salchicha',
      'Chorizo',
      'Quesos',
      'Carnes frías',
      'Abarrotes',
      'Mantequillas',
      'Mayonesas',
    ];
    if (categoriasList.length > 0) {
      const liveNames = categoriasList.map((c) => c.nombre);
      return ['Todas', ...Array.from(new Set([...defaultCats.slice(1), ...liveNames]))];
    }
    return defaultCats;
  }, [categoriasList]);

  // Clientes filtrados para la selección
  const filteredClients = useMemo(() => {
    const q = normalizeText(clientSearch);
    if (!q) return clientesList;
    return clientesList.filter((c) => {
      const matchNom = normalizeText(c.nombre).includes(q);
      const matchProp = normalizeText(c.propietario || '').includes(q);
      const matchTel = normalizeText(c.telefono || '').includes(q);
      const matchDir = normalizeText(c.direccion || '').includes(q);
      return matchNom || matchProp || matchTel || matchDir;
    });
  }, [clientSearch, clientesList]);

  // Obtener precio de producto para el cliente activo
  const getProductPrice = useCallback(
    (p: Producto, pres?: PresentacionConfig): number => {
      if (pres) {
        return getPrecioPresentacion(p, pres, cliente);
      }
      if (cliente?.precioEspecial?.[p.id]) {
        return cliente.precioEspecial[p.id];
      }
      return p.precioBase;
    },
    [cliente]
  );

  // Recalcular precios en carrito si el cliente cambia
  const handleSelectClient = (selected: Cliente) => {
    setClienteActivoId(selected.id);
    setIsChangingClient(false);

    // Si ya hay productos en carrito, actualizar precios especiales según el nuevo cliente
    if (carrito.length > 0) {
      carrito.forEach((item, idx) => {
        const nuevoPrecio = getProductPrice(item.producto, item.presentacion);
        if (nuevoPrecio !== item.precioFinal) {
          updateCarritoItem(idx, {
            ...item,
            precioLista: nuevoPrecio,
            precioFinal: nuevoPrecio,
            subtotal: Math.round(item.cantidad * nuevoPrecio * 100) / 100,
          });
        }
      });
    }
  };

  // Crear nuevo cliente rápido
  const handleGuardarNuevoCliente = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el nombre del negocio o cliente.');
      return;
    }
    try {
      const nuevo = await DataService.createCliente({
        nombre: nuevoNombre.trim(),
        propietario: nuevoPropietario.trim() || nuevoNombre.trim(),
        telefono: nuevoTelefono.trim() || 'Sin teléfono',
        direccion: nuevaDireccion.trim() || 'Ruta local',
        ruta: user?.rutaNombre || 'Ruta Centro',
        limiteCredito: 3000,
      });

      setShowNuevoClienteModal(false);
      setNuevoNombre('');
      setNuevoPropietario('');
      setNuevoTelefono('');
      setNuevaDireccion('');

      // Recargar y seleccionar cliente inmediatamente
      setClientesList((prev) => [nuevo, ...prev]);
      handleSelectClient(nuevo);
    } catch {
      Alert.alert('Error', 'No se pudo registrar el cliente.');
    }
  };

  // Toggle Favorito (Sólo cambia la estrella, no altera el carrito ni el orden)
  const handleToggleFavorito = (pId: string) => {
    const updatedList = DataService.toggleFavorito(pId, userId);
    setFavoritoIds(new Set(updatedList));
  };

  // Apertura del modo Ordenar
  const handleOpenOrderingMode = () => {
    // Tomar catálogo completo ordenado actualmente
    const baseList = [...productosList];
    const orderMap = new Map<string, number>();
    savedOrderIds.forEach((id, idx) => orderMap.set(id, idx));

    baseList.sort((a, b) => {
      const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
      const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
      return posA - posB;
    });

    setDraftOrderIds(baseList.map((p) => p.id));
    setIsOrderingMode(true);
  };

  // Guardar nuevo orden personalizado
  const handleSaveOrder = () => {
    DataService.saveOrdenPersonalizado(draftOrderIds, userId);
    setSavedOrderIds(draftOrderIds);
    setOrdenModo('mi_orden');
    DataService.saveSortPreference('mi_orden', userId);
    setIsOrderingMode(false);
  };

  // Mover producto en la lista draft
  const moveDraftItem = (index: number, direction: 'up' | 'down' | 'top') => {
    if (direction === 'top') {
      if (index === 0) return;
      const copy = [...draftOrderIds];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      setDraftOrderIds(copy);
      return;
    }

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= draftOrderIds.length) return;

    const copy = [...draftOrderIds];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setDraftOrderIds(copy);
  };

  // Filtro y ordenamiento del catálogo en pantalla
  const displayProducts = useMemo(() => {
    let prods = [...productosList];

    // 1. Filtrar por categoría
    if (categoriaActiva !== 'Todas') {
      prods = prods.filter(
        (p) => p.categoria?.toLowerCase() === categoriaActiva.toLowerCase()
      );
    }

    // 2. Filtrar por texto de búsqueda
    const q = normalizeText(productSearch);
    if (q) {
      prods = prods.filter((p) => {
        return (
          normalizeText(p.nombre).includes(q) ||
          normalizeText(p.categoria || '').includes(q) ||
          normalizeText(p.marca || '').includes(q) ||
          normalizeText(p.sku || '').includes(q)
        );
      });
    }

    // 3. Filtrar por pestaña: Todos / Favoritos / Frecuentes
    if (filtroTipo === 'favoritos') {
      prods = prods.filter((p) => favoritoIds.has(p.id));
    } else if (filtroTipo === 'frecuentes') {
      // Mostrar productos que tienen frecuencia de venta
      prods = prods.filter((p) => (frecuenciaMap[p.id] || 0) > 0);
    }

    // 4. Ordenamiento
    if (filtroTipo === 'frecuentes') {
      // Ordenar por número de ventas confirmadas en últimos 30 días descendente
      prods.sort((a, b) => (frecuenciaMap[b.id] || 0) - (frecuenciaMap[a.id] || 0));
    } else if (ordenModo === 'az') {
      prods.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else {
      // "Mi orden" personalizado de Miguel
      const orderMap = new Map<string, number>();
      savedOrderIds.forEach((id, idx) => orderMap.set(id, idx));

      prods.sort((a, b) => {
        const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        if (posA === posB) return a.nombre.localeCompare(b.nombre);
        return posA - posB;
      });
    }

    return prods;
  }, [
    productosList,
    categoriaActiva,
    productSearch,
    filtroTipo,
    ordenModo,
    favoritoIds,
    savedOrderIds,
    frecuenciaMap,
  ]);

  // Encontrar item en carrito para un producto
  const getCartInfoForProduct = useCallback(
    (pId: string) => {
      const items = carrito.filter((i) => i.producto.id === pId);
      const totalQty = items.reduce((s, i) => s + i.cantidad, 0);
      const firstIndex = carrito.findIndex((i) => i.producto.id === pId);
      return { inCart: totalQty > 0, totalQty, firstIndex, item: items[0] };
    },
    [carrito]
  );

  // Agregar 1 unidad de producto con presentación única
  const handleAddSingleQuick = (producto: Producto) => {
    if (producto.estadoConfiguracion === 'Pendiente') {
      Alert.alert(
        'Producto pendiente de configuración',
        `"${producto.nombre}" está marcado como pendiente de configuración.\n\n` +
          `Confirma su unidad y presentación en el Catálogo antes de venderlo.`
      );
      return;
    }

    const { inCart, firstIndex, item } = getCartInfoForProduct(producto.id);

    // Si ya está en carrito, incrementar en 1
    if (inCart && firstIndex >= 0 && item) {
      const newQty = item.cantidad + 1;
      const factor = item.presentacion?.piezasEquivalentes || 1;
      const unidadesRequeridas = newQty * factor;

      if (producto.existencia !== undefined && unidadesRequeridas > producto.existencia) {
        Alert.alert(
          'Inventario insuficiente',
          `Disponible en camioneta: ${producto.existencia} ${producto.unidad || 'unidad'}(s).\n` +
            `Ya tienes ${item.cantidad} en carrito.`
        );
        return;
      }

      updateCarritoItem(firstIndex, {
        ...item,
        cantidad: newQty,
        piezasTotales: unidadesRequeridas,
        subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
      });
      return;
    }

    // Agregar nuevo al carrito
    const pres =
      producto.presentaciones && producto.presentaciones.length > 0
        ? producto.presentaciones[0]
        : undefined;
    const factor = pres?.piezasEquivalentes || 1;
    const precio = getProductPrice(producto, pres);

    if (producto.existencia !== undefined && factor > producto.existencia) {
      Alert.alert(
        'Inventario insuficiente',
        `No hay suficiente stock en camioneta para "${producto.nombre}".\n` +
          `Disponible: ${producto.existencia} ${producto.unidad || 'unidad'}(s).`
      );
      return;
    }

    const cartItem: ItemCarrito = {
      producto,
      cantidad: 1,
      unidad: pres ? pres.tipo : producto.unidad || 'pieza',
      presentacion: pres,
      presentacionNombre: pres?.nombre,
      factorConversion: factor,
      piezasTotales: factor,
      precioLista: precio,
      descuento: 0,
      precioFinal: precio,
      subtotal: precio,
    };

    addToCarrito(cartItem);
  };

  // Decrementar producto desde la tarjeta
  const handleDecrementProduct = (producto: Producto) => {
    const { inCart, firstIndex, item } = getCartInfoForProduct(producto.id);
    if (!inCart || firstIndex < 0 || !item) return;

    if (item.cantidad <= 1) {
      removeFromCarrito(firstIndex);
    } else {
      const newQty = item.cantidad - 1;
      const factor = item.presentacion?.piezasEquivalentes || 1;
      updateCarritoItem(firstIndex, {
        ...item,
        cantidad: newQty,
        piezasTotales: newQty * factor,
        subtotal: Math.round(newQty * item.precioFinal * 100) / 100,
      });
    }
  };

  // Confirmar cantidad manual escrita
  const handleConfirmManualQty = () => {
    if (!qtyPromptItem) return;
    const val = parseFloat(manualQtyInput);
    if (isNaN(val) || val <= 0) {
      if (qtyPromptItem.cartIndex >= 0) {
        removeFromCarrito(qtyPromptItem.cartIndex);
      }
      setQtyPromptItem(null);
      return;
    }

    const { producto, presentacion, cartIndex } = qtyPromptItem;
    const factor = presentacion?.piezasEquivalentes || 1;
    const unidadesBase = Math.round(val * factor);

    if (producto.existencia !== undefined && unidadesBase > producto.existencia) {
      Alert.alert(
        'Inventario insuficiente',
        `Disponible en camioneta: ${producto.existencia} ${producto.unidad || 'unidad'}(s).\n` +
          `Solicitado: ${unidadesBase}.`
      );
      return;
    }

    const precio = getProductPrice(producto, presentacion);
    const subtotal = Math.round(val * precio * 100) / 100;

    if (cartIndex >= 0) {
      updateCarritoItem(cartIndex, {
        ...carrito[cartIndex],
        cantidad: val,
        piezasTotales: unidadesBase,
        subtotal,
      });
    } else {
      addToCarrito({
        producto,
        cantidad: val,
        unidad: presentacion ? presentacion.tipo : producto.unidad || 'pieza',
        presentacion,
        presentacionNombre: presentacion?.nombre,
        factorConversion: factor,
        piezasTotales: unidadesBase,
        precioLista: precio,
        descuento: 0,
        precioFinal: precio,
        subtotal,
      });
    }

    setQtyPromptItem(null);
  };

  // Totales de la barra inferior
  const cartTotal = carrito.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = carrito.length;
  const totalPiezas = carrito.reduce((s, i) => s + (i.piezasTotales || i.cantidad), 0);

  // ====================================================================
  // VISTA 1: SELECCIÓN DE CLIENTE (Si no hay cliente activo)
  // ====================================================================
  if (!cliente || isChangingClient) {
    return (
      <View style={styles.container}>
        {/* Cabecera selección cliente */}
        <View style={styles.clientPickHeader}>
          <View style={styles.clientPickTopRow}>
            {isChangingClient && (
              <TouchableOpacity
                onPress={() => setIsChangingClient(false)}
                style={styles.backBtn}
              >
                <ArrowLeft size={20} color={colors.neutral[800]} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.clientPickTitle}>
                {isChangingClient ? 'Cambiar cliente' : 'Selecciona un cliente'}
              </Text>
              <Text style={styles.clientPickSubtitle}>
                Elige el cliente para iniciar la nota de venta
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowNuevoClienteModal(true)}
              style={styles.nuevoClienteHeaderBtn}
            >
              <UserPlus size={16} color={colors.primary[700]} />
              <Text style={styles.nuevoClienteHeaderText}>+ Nuevo</Text>
            </TouchableOpacity>
          </View>

          {/* Buscador de clientes */}
          <View style={styles.searchWrap}>
            <Search size={18} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, negocio o teléfono..."
              placeholderTextColor={colors.neutral[400]}
              value={clientSearch}
              onChangeText={setClientSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {clientSearch.length > 0 && (
              <TouchableOpacity onPress={() => setClientSearch('')}>
                <X size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notificación de venta pendiente en curso */}
        {carrito.length > 0 && !isChangingClient && (
          <View style={styles.pendingSaleBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingSaleTitle}>Venta pendiente en curso</Text>
              <Text style={styles.pendingSaleSub}>
                {carrito.length} productos agregados ({formatCurrency(cartTotal)})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => clearCarrito()}
              style={styles.pendingSaleDiscardBtn}
            >
              <Text style={styles.pendingSaleDiscardText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.clientListScroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Opción rápida: Venta de Mostrador */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectClient(CLIENTE_GENERAL)}
            style={[styles.clientCardGeneral, shadows.card]}
          >
            <View style={styles.clientGeneralIconWrap}>
              <Store size={22} color={colors.neutral[0]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientGeneralName}>Venta de Mostrador / General</Text>
              <Text style={styles.clientGeneralSub}>Sin cuenta corriente · Pago inmediato</Text>
            </View>
            <ChevronRight size={18} color={colors.primary[600]} />
          </TouchableOpacity>

          <Text style={styles.clientSectionLabel}>Clientes de la Ruta ({filteredClients.length})</Text>

          {filteredClients.map((c) => {
            const hasSaldo = (c.saldo || 0) > 0;
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                onPress={() => handleSelectClient(c)}
                style={[styles.clientCard, shadows.card]}
              >
                <View style={styles.clientAvatarWrap}>
                  <User size={18} color={colors.primary[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientItemName} numberOfLines={1}>
                    {c.nombre}
                  </Text>
                  <Text style={styles.clientItemDetail} numberOfLines={1}>
                    {c.propietario ? `${c.propietario} · ` : ''}
                    {c.telefono ? `${c.telefono} · ` : ''}
                    {c.direccion || 'Ruta'}
                  </Text>
                </View>
                <View style={styles.clientItemRight}>
                  {hasSaldo ? (
                    <Text style={styles.clientSaldoDue}>Saldo: {formatCurrency(c.saldo)}</Text>
                  ) : (
                    <Text style={styles.clientSaldoOk}>Al corriente</Text>
                  )}
                  <ChevronRight size={16} color={colors.neutral[400]} />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredClients.length === 0 && (
            <View style={styles.emptyClientsWrap}>
              <Text style={styles.emptyClientsText}>
                No se encontraron clientes para "{clientSearch}".
              </Text>
              <TouchableOpacity
                onPress={() => setShowNuevoClienteModal(true)}
                style={styles.emptyClientsAddBtn}
              >
                <Text style={styles.emptyClientsAddBtnText}>+ Registrar a este cliente</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Modal Registrar Nuevo Cliente */}
        <Modal
          visible={showNuevoClienteModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNuevoClienteModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registrar Nuevo Cliente</Text>
                <TouchableOpacity onPress={() => setShowNuevoClienteModal(false)}>
                  <X size={20} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Nombre del Negocio / Tienda *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ej. Abarrotes La Lupita"
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Propietario / Encargado</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ej. Doña María López"
                  value={nuevoPropietario}
                  onChangeText={setNuevoPropietario}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Teléfono</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ej. 477 123 4567"
                  value={nuevoTelefono}
                  onChangeText={setNuevoTelefono}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Dirección / Ubicación</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ej. Calle Hidalgo #45, Col. Centro"
                  value={nuevaDireccion}
                  onChangeText={setNuevaDireccion}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowNuevoClienteModal(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGuardarNuevoCliente}
                  style={styles.modalSubmitBtn}
                >
                  <Text style={styles.modalSubmitText}>Guardar y Elegir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ====================================================================
  // VISTA 2: MOSAICO DE PRODUCTOS Y VENTA
  // ====================================================================
  return (
    <View style={styles.container}>
      {/* 1. ENCABEZADO SUPERIOR CON CLIENTE */}
      <View style={styles.catalogHeader}>
        <View style={styles.catalogTopRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsChangingClient(true)}
            style={styles.clientSelectedBadge}
          >
            <User size={15} color={colors.primary[700]} />
            <Text style={styles.clientSelectedName} numberOfLines={1}>
              {cliente.nombre}
            </Text>
            <Text style={styles.clientSelectedChangeBtn}>Cambiar</Text>
          </TouchableOpacity>

          <ConnectivityIndicator />
        </View>

        {/* Buscador de productos */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.neutral[400]}
            value={productSearch}
            onChangeText={setProductSearch}
          />
          {productSearch.length > 0 && (
            <TouchableOpacity onPress={() => setProductSearch('')}>
              <X size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categorías deslizables */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catsRow}
        >
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoriaActiva === cat && styles.catChipActive]}
              onPress={() => setCategoriaActiva(cat)}
            >
              <Text
                style={[
                  styles.catChipText,
                  categoriaActiva === cat && styles.catChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Barra de Filtros: Todos · Favoritos · Frecuentes + Botón Ordenar */}
        <View style={styles.filterTabsRow}>
          <View style={styles.filterTabsWrap}>
            <TouchableOpacity
              onPress={() => setFiltroTipo('todos')}
              style={[styles.filterTab, filtroTipo === 'todos' && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filtroTipo === 'todos' && styles.filterTabTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFiltroTipo('favoritos')}
              style={[styles.filterTab, filtroTipo === 'favoritos' && styles.filterTabActive]}
            >
              <Star
                size={13}
                color={filtroTipo === 'favoritos' ? '#B45309' : colors.neutral[500]}
                fill={filtroTipo === 'favoritos' ? '#F59E0B' : 'transparent'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filtroTipo === 'favoritos' && styles.filterTabTextActive,
                ]}
              >
                Favoritos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFiltroTipo('frecuentes')}
              style={[styles.filterTab, filtroTipo === 'frecuentes' && styles.filterTabActive]}
            >
              <Flame
                size={13}
                color={filtroTipo === 'frecuentes' ? colors.warning[600] : colors.neutral[500]}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filtroTipo === 'frecuentes' && styles.filterTabTextActive,
                ]}
              >
                Frecuentes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón Ordenar (Spotify-style) */}
          <View style={styles.sortControlsWrap}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const nextModo = ordenModo === 'mi_orden' ? 'az' : 'mi_orden';
                setOrdenModo(nextModo);
                DataService.saveSortPreference(nextModo, userId);
              }}
              style={styles.sortModeBtn}
            >
              <Text style={styles.sortModeBtnText}>
                {ordenModo === 'mi_orden' ? 'Mi orden' : 'A-Z'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenOrderingMode}
              style={styles.ordenarBtn}
              accessibilityLabel="Personalizar orden de productos"
            >
              <SlidersHorizontal size={14} color={colors.primary[700]} />
              <Text style={styles.ordenarBtnText}>Ordenar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. MOSAICO DE PRODUCTOS (3 Columnas en Móvil / 2 en Estrechas) */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={[
          styles.gridScrollContent,
          { paddingBottom: cartCount > 0 ? 115 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {displayProducts.map((p) => {
            const isFav = favoritoIds.has(p.id);
            const { inCart, totalQty, firstIndex, item } = getCartInfoForProduct(p.id);
            const hasMultiplePres = Boolean(
              p.manejaMultiplesPresentaciones || (p.presentaciones && p.presentaciones.length > 1)
            );
            const presDefault = p.presentaciones?.[0];
            const price = getProductPrice(p, presDefault);
            const isPendingConfig = p.estadoConfiguracion === 'Pendiente';
            const unitLabel = presDefault ? presDefault.nombre : p.unidad || 'pza';

            return (
              <TouchableOpacity
                key={p.id}
                activeOpacity={isPendingConfig ? 1 : 0.8}
                disabled={isPendingConfig}
                onPress={() => {
                  if (hasMultiplePres) {
                    setSelectedMultiProd(p);
                  } else {
                    handleAddSingleQuick(p);
                  }
                }}
                style={[
                  styles.productCard,
                  { width: cardWidth },
                  inCart && styles.productCardActive,
                  isPendingConfig && styles.productCardDisabled,
                  shadows.card,
                ]}
              >
                {/* Fila superior: Presentación/Unidad + Estrella Favorito en esquina */}
                <View style={styles.cardTopRow}>
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText} numberOfLines={1}>
                      {unitLabel}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.6}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleToggleFavorito(p.id);
                    }}
                    style={styles.starTouchArea}
                    accessibilityLabel={isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  >
                    <Star
                      size={15}
                      color={isFav ? '#F59E0B' : colors.neutral[300]}
                      fill={isFav ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Nombre del producto: permite varias líneas sin cortar información esencial */}
                <Text style={styles.productName} numberOfLines={3}>
                  {p.nombre}
                </Text>

                {/* Precio y Disponibilidad */}
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatCurrency(price)}</Text>
                  {isPendingConfig ? (
                    <Text style={styles.pendingBadge}>⚠️ Pendiente</Text>
                  ) : (
                    <Text style={styles.stockText}>
                      Disp: {p.existencia !== undefined ? p.existencia : 0}
                    </Text>
                  )}
                </View>

                {/* Controles de cantidad: ÚNICAMENTE cuando el producto está agregado */}
                {inCart && (
                  <View style={styles.cardStepperRow}>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleDecrementProduct(p);
                        }}
                        style={styles.stepperBtn}
                        accessibilityLabel="Disminuir cantidad"
                      >
                        <Minus size={13} color={colors.primary[700]} strokeWidth={3} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setQtyPromptItem({
                            producto: p,
                            currentQty: totalQty,
                            cartIndex: firstIndex,
                            presentacion: item?.presentacion,
                          });
                          setManualQtyInput(totalQty.toString());
                        }}
                        style={styles.stepperQtyTouch}
                        accessibilityLabel="Editar cantidad directamente"
                      >
                        <Text style={styles.stepperQtyText}>{totalQty}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleAddSingleQuick(p);
                        }}
                        style={styles.stepperBtn}
                        accessibilityLabel="Aumentar cantidad"
                      >
                        <Plus size={13} color={colors.primary[700]} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {displayProducts.length === 0 && (
          <View style={styles.emptyGridWrap}>
            <Text style={styles.emptyGridText}>No se encontraron productos en esta vista.</Text>
          </View>
        )}
      </ScrollView>

      {/* 3. BARRA FLOTANTE INFERIOR DE VENTA */}
      {cartCount > 0 && (
        <View style={[styles.bottomSaleBar, shadows.floating]}>
          <View style={styles.bottomSaleInfo}>
            <View style={styles.bottomCartBadge}>
              <ShoppingCart size={15} color={colors.neutral[0]} />
              <Text style={styles.bottomCartBadgeText}>{cartCount}</Text>
            </View>
            <View>
              <Text style={styles.bottomCartTotalLabel}>Total a cobrar</Text>
              <Text style={styles.bottomCartTotalAmount}>{formatCurrency(cartTotal)}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/venta/carrito')}
            style={styles.revisarBtn}
          >
            <Text style={styles.revisarBtnText}>Revisar ({totalPiezas})</Text>
            <ChevronRight size={18} color={colors.neutral[0]} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 1: SELECTOR DE PRESENTACIONES (Queso Castel, etc.) */}
      <Modal
        visible={!!selectedMultiProd}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMultiProd(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedMultiProd?.nombre}
                </Text>
                <Text style={styles.modalSub}>Selecciona la presentación a vender</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMultiProd(null)}>
                <X size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {selectedMultiProd?.presentaciones?.map((pres) => {
                const precio = getProductPrice(selectedMultiProd, pres);
                const factor = pres.piezasEquivalentes || 1;
                return (
                  <TouchableOpacity
                    key={pres.tipo + pres.nombre}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!selectedMultiProd) return;
                      // Validar inventario
                      if (
                        selectedMultiProd.existencia !== undefined &&
                        factor > selectedMultiProd.existencia
                      ) {
                        Alert.alert(
                          'Stock insuficiente',
                          `Solo hay ${selectedMultiProd.existencia} unidades base en camioneta.`
                        );
                        return;
                      }

                      addToCarrito({
                        producto: selectedMultiProd,
                        cantidad: 1,
                        unidad: pres.tipo,
                        presentacion: pres,
                        presentacionNombre: pres.nombre,
                        factorConversion: factor,
                        piezasTotales: factor,
                        precioLista: precio,
                        descuento: 0,
                        precioFinal: precio,
                        subtotal: precio,
                      });
                      setSelectedMultiProd(null);
                    }}
                    style={styles.presOptionRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presOptionName}>{pres.nombre}</Text>
                      <Text style={styles.presOptionSub}>
                        Equivale a {factor} unidad{factor === 1 ? '' : 'es'}
                      </Text>
                    </View>
                    <Text style={styles.presOptionPrice}>{formatCurrency(precio)}</Text>
                    <View style={styles.presAddBadge}>
                      <Plus size={14} color={colors.primary[700]} strokeWidth={2.8} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: INGRESO MANUAL DE CANTIDAD RÁPIDA */}
      <Modal
        visible={!!qtyPromptItem}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQtyPromptItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 320 }]}>
            <Text style={styles.modalTitle}>Capturar cantidad</Text>
            <Text style={styles.modalSub}>{qtyPromptItem?.producto.nombre}</Text>

            <TextInput
              style={styles.manualQtyInput}
              keyboardType="numeric"
              value={manualQtyInput}
              onChangeText={setManualQtyInput}
              autoFocus={true}
              selectTextOnFocus={true}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={() => setQtyPromptItem(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmManualQty}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ORDEN PERSONALIZADO ESTILO SPOTIFY */}
      <Modal
        visible={isOrderingMode}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsOrderingMode(false)}
      >
        <View style={styles.orderScreenContainer}>
          {/* Header Ordenar */}
          <View style={styles.orderScreenHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderScreenTitle}>Mi Orden Personalizado</Text>
              <Text style={styles.orderScreenSub}>
                Acomoda los productos en la posición exacta que desees
              </Text>
            </View>

            <View style={styles.orderHeaderActions}>
              <TouchableOpacity
                onPress={() => setIsOrderingMode(false)}
                style={styles.orderCancelBtn}
              >
                <Text style={styles.orderCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveOrder} style={styles.orderSaveBtn}>
                <Text style={styles.orderSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de productos para reordenar */}
          <ScrollView
            style={styles.orderListScroll}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {draftOrderIds.map((pId, idx) => {
              const prod = productosList.find((p) => p.id === pId);
              if (!prod) return null;
              const isFav = favoritoIds.has(prod.id);

              return (
                <View key={prod.id} style={styles.orderItemRow}>
                  <View style={styles.orderIndexBadge}>
                    <Text style={styles.orderIndexText}>#{idx + 1}</Text>
                  </View>

                  <GripVertical size={18} color={colors.neutral[400]} />

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.orderItemName} numberOfLines={1}>
                      {prod.nombre}
                    </Text>
                    <Text style={styles.orderItemSub}>
                      {prod.categoria} · {formatCurrency(prod.precioBase)}
                    </Text>
                  </View>

                  {isFav && <Star size={14} color="#F59E0B" fill="#F59E0B" />}

                  {/* Acciones de reordenamiento */}
                  <View style={styles.orderButtonsRow}>
                    <TouchableOpacity
                      onPress={() => moveDraftItem(idx, 'top')}
                      disabled={idx === 0}
                      style={[styles.orderActionBtn, idx === 0 && styles.orderActionDisabled]}
                      accessibilityLabel="Mover al inicio"
                    >
                      <ArrowUpToLine
                        size={15}
                        color={idx === 0 ? colors.neutral[300] : colors.primary[700]}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => moveDraftItem(idx, 'up')}
                      disabled={idx === 0}
                      style={[styles.orderActionBtn, idx === 0 && styles.orderActionDisabled]}
                      accessibilityLabel="Subir una posición"
                    >
                      <ChevronUp
                        size={16}
                        color={idx === 0 ? colors.neutral[300] : colors.primary[700]}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => moveDraftItem(idx, 'down')}
                      disabled={idx === draftOrderIds.length - 1}
                      style={[
                        styles.orderActionBtn,
                        idx === draftOrderIds.length - 1 && styles.orderActionDisabled,
                      ]}
                      accessibilityLabel="Bajar una posición"
                    >
                      <ChevronDown
                        size={16}
                        color={
                          idx === draftOrderIds.length - 1
                            ? colors.neutral[300]
                            : colors.primary[700]
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  /* ---------------------------------------------------- */
  /* VISTA SELECCIÓN DE CLIENTE                          */
  /* ---------------------------------------------------- */
  clientPickHeader: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  clientPickTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    paddingRight: 10,
  },
  clientPickTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  clientPickSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  nuevoClienteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  nuevoClienteHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[700],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.neutral[900],
  },
  pendingSaleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.warning[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pendingSaleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.warning[700],
  },
  pendingSaleSub: {
    fontSize: 11,
    color: colors.warning[700],
    marginTop: 1,
  },
  pendingSaleDiscardBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingSaleDiscardText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error[600],
  },
  clientListScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  clientCardGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.primary[500],
    marginBottom: 16,
  },
  clientGeneralIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientGeneralName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.primary[800],
  },
  clientGeneralSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  clientSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 8,
  },
  clientAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  clientItemDetail: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  clientItemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  clientSaldoDue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error[600],
  },
  clientSaldoOk: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[700],
  },
  emptyClientsWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyClientsText: {
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  emptyClientsAddBtn: {
    marginTop: 12,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  emptyClientsAddBtnText: {
    color: colors.neutral[0],
    fontWeight: '700',
    fontSize: 12.5,
  },

  /* ---------------------------------------------------- */
  /* VISTA CATÁLOGO Y MOSAICO                            */
  /* ---------------------------------------------------- */
  catalogHeader: {
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  catalogTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 6,
    maxWidth: '75%',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  clientSelectedName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[800],
  },
  clientSelectedChangeBtn: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    textDecorationLine: 'underline',
  },
  catsRow: {
    paddingVertical: 6,
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  catChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  catChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  catChipTextActive: {
    color: colors.neutral[0],
    fontWeight: '700',
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  filterTabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    padding: 2,
    gap: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 3,
  },
  filterTabActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.card,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  filterTabTextActive: {
    color: colors.neutral[900],
    fontWeight: '800',
  },
  sortControlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sortModeBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  ordenarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  ordenarBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[700],
  },

  /* Grid Mosaico (3 columnas en móvil / 2 en estrechas) */
  gridScroll: {
    flex: 1,
  },
  gridScrollContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 115,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7, // 6–8 px de separación
  },
  productCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 9,
    padding: 7,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    justifyContent: 'space-between',
  },
  productCardActive: {
    borderColor: colors.primary[600],
    borderWidth: 1.5,
    backgroundColor: '#F0F7FF',
  },
  productCardDisabled: {
    opacity: 0.6,
    backgroundColor: colors.neutral[50],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  unitBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    maxWidth: '70%',
  },
  unitBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  starTouchArea: {
    padding: 2,
  },
  productName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 14.5,
    minHeight: 29,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary[700],
  },
  stockText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  pendingBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning[700],
  },
  cardStepperRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: colors.primary[600],
    overflow: 'hidden',
    height: 28,
  },
  stepperBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  stepperQtyTouch: {
    flex: 1.2,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary[800],
  },
  disabledActionWrap: {
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  disabledActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  emptyGridWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyGridText: {
    fontSize: 13,
    color: colors.neutral[500],
  },

  /* Barra Flotante de Venta */
  bottomSaleBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomSaleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 4,
  },
  bottomCartBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  bottomCartTotalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  bottomCartTotalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  revisarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  revisarBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[0],
  },

  /* Modales Genéricos */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  modalSub: {
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 2,
  },
  presOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  presOptionName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  presOptionSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  presOptionPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary[700],
    marginRight: 10,
  },
  presAddBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  manualQtyInput: {
    borderWidth: 1.5,
    borderColor: colors.primary[600],
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 10,
    marginVertical: 14,
    color: colors.neutral[900],
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  modalSubmitBtn: {
    flex: 1.4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.neutral[0],
  },

  /* Formulario modal nuevo cliente */
  formField: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },

  /* Pantalla Completa Ordenar (Spotify) */
  orderScreenContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  orderScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  orderScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  orderScreenSub: {
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 2,
  },
  orderHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  orderCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
  },
  orderCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  orderSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  orderSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  orderListScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  orderIndexBadge: {
    width: 26,
    alignItems: 'center',
  },
  orderIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[400],
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  orderItemSub: {
    fontSize: 10.5,
    color: colors.neutral[500],
    marginTop: 1,
  },
  orderButtonsRow: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  orderActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderActionDisabled: {
    opacity: 0.3,
  },
});
