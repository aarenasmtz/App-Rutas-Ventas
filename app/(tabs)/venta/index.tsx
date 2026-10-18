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
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ShoppingCart,
  ChevronRight,
  Clock,
  Flame,
  User,
  Check,
  X,
  Layers,
  Package,
  Boxes,
  LayoutGrid,
  List,
  Star,
  Sparkles,
  Plus,
  Store,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import {
  mockProductos,
  mockCategorias,
  mockClientes,
  DataService,
} from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import { Card, ConnectivityIndicator } from '@/components/shared';
import { formatCurrency, getStockEstado } from '@/utils/helpers';
import { getPrecioPresentacion, desglosarInventario } from '@/utils/multipresentacion';
import type { Producto, Cliente, ItemCarrito, PresentacionConfig } from '@/types';

// Helper para detectar productos que se venden por kilo (Carnes frías, quesos, embutidos)
export function isProductoPorKilo(p: Producto): boolean {
  // Los productos multipresentación o por paquete NUNCA se venden por kilo
  if (p.manejaMultiplesPresentaciones === true) return false;
  if (p.unidad?.toLowerCase() === 'paquete') return false;
  if (p.precioPorPeso === false) return false;
  if (p.precioPorPeso === true) return true;
  if (p.unidad?.toLowerCase() === 'kg' || p.unidad?.toLowerCase() === 'kilo') return true;

  const cat = (p.categoria || '').toLowerCase();
  const kiloCategorias = [
    'jamón',
    'jamon',
    'salchicha',
    'chorizo',
    'carnes frías',
    'carnes frias',
  ];
  if (kiloCategorias.includes(cat)) return true;
  const nom = (p.nombre || '').toLowerCase();
  if (
    nom.includes('jamón') ||
    nom.includes('jamon') ||
    nom.includes('salchicha') ||
    nom.includes('chorizo') ||
    nom.includes('tocino') ||
    nom.includes('pepperoni')
  ) {
    return true;
  }
  return false;
}

export default function VentaScreen() {
  const router = useRouter();
  const {
    carrito,
    addToCarrito,
    clienteActivoId,
    setClienteActivoId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [showQtyModal, setShowQtyModal] = useState<Producto | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [viewMode, setViewMode] = useState<'mosaico' | 'lista'>('mosaico');

  const handleOpenQtyModal = (p: Producto) => {
    if (p.estadoConfiguracion === 'Pendiente') {
      Alert.alert(
        'Producto pendiente de configuración',
        `"${p.nombre}" proviene del catálogo importado y está marcado como pendiente de configuración.\n\n` +
          `Debes ingresar a Más > Catálogo de Productos y confirmar su unidad de venta (pieza, paquete o kg) antes de poder venderlo.`
      );
      return;
    }
    setShowQtyModal(p);
  };

  // Estados de datos vivos (VPS / fallback local)
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [productosList, setProductosList] = useState<Producto[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadLiveData = async () => {
      try {
        const [cls, prs, cats] = await Promise.all([
          DataService.getClientes(),
          DataService.getProductos(),
          DataService.getCategorias(),
        ]);
        if (mounted) {
          setClientesList(cls ?? []);
          setProductosList(prs ?? []);
          setCategoriasList(cats ?? []);
        }
      } catch (err) {
        console.warn('Error loading live data in VentaScreen:', err);
      }
    };
    loadLiveData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isClientModalOpen) {
      DataService.getClientes().then((cls) => {
        if (cls && Array.isArray(cls)) {
          setClientesList(cls);
        }
      });
    }
  }, [isClientModalOpen]);

  const effectiveClientes = clientesList;
  const effectiveProductos = productosList;

  // Lista unificada de categorías
  const categorias = useMemo(() => {
    const defaultCats = [
      'Todas',
      'Jamón',
      'Salchicha',
      'Chorizo',
      'Quesos',
      'Carnes frías',
      'Abarrotes',
      'Enlatados',
      'Mantequillas',
      'Mayonesas',
    ];
    if (categoriasList.length > 0) {
      const liveNames = categoriasList.map((c) => c.nombre);
      return ['Todas', ...Array.from(new Set([...defaultCats.slice(1), ...liveNames]))];
    }
    return defaultCats;
  }, [categoriasList]);

  // Cliente activo
  const cliente = useMemo(() => {
    if (!clienteActivoId) return null;
    return (
      effectiveClientes.find((c) => c.id === clienteActivoId) ||

      null
    );
  }, [effectiveClientes, clienteActivoId]);

  // Ranking dinámico de productos más vendidos / sugeridos por cliente
  const sugeridosData = useMemo(() => {
    const stats: Record<string, { count: number; totalQty: number; avgQty: number }> = {};

    if (cliente) {
      if (cliente.historial && cliente.historial.length > 0) {
        cliente.historial.forEach((v) => {
          if (v.items) {
            v.items.forEach((it) => {
              const prod = effectiveProductos.find(
                (p) => p.nombre.toLowerCase().trim() === it.productoNombre.toLowerCase().trim()
              );
              const key = prod ? prod.id : it.productoNombre;
              if (!stats[key]) stats[key] = { count: 0, totalQty: 0, avgQty: 0 };
              stats[key].count += 1;
              stats[key].totalQty += it.cantidad || 1;
            });
          }
        });
      }

      if (cliente.sugerido && cliente.sugerido.length > 0) {
        cliente.sugerido.forEach((s) => {
          if (!stats[s.productoId]) {
            stats[s.productoId] = { count: 3, totalQty: s.cantidad || 2, avgQty: s.cantidad || 2 };
          } else {
            stats[s.productoId].count += 2;
            stats[s.productoId].totalQty += s.cantidad || 1;
          }
        });
      }
    }

    Object.keys(stats).forEach((k) => {
      const st = stats[k];
      st.avgQty = Math.max(1, Math.round(st.totalQty / st.count));
    });

    const resultado = Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count || b[1].totalQty - a[1].totalQty)
      .map(([idOrName, st]) => {
        const prod = effectiveProductos.find(
          (p) => p.id === idOrName || p.nombre.toLowerCase().trim() === idOrName.toLowerCase().trim()
        );
        if (!prod) return null;
        return {
          producto: prod,
          cantidadSugerida: st.avgQty,
          frecuencia: st.count,
          esTopCliente: true,
          esSugeridoGeneral: false,
        };
      })
      .filter(Boolean) as {
        producto: Producto;
        cantidadSugerida: number;
        frecuencia: number;
        esTopCliente: boolean;
        esSugeridoGeneral: boolean;
      }[];

    if (resultado.length === 0 && effectiveProductos.length > 0) {
      return effectiveProductos.slice(0, 4).map((p) => ({
        producto: p,
        cantidadSugerida: isProductoPorKilo(p) ? 1 : 2,
        frecuencia: 1,
        esTopCliente: false,
        esSugeridoGeneral: true,
      }));
    }

    return resultado;
  }, [cliente, effectiveProductos]);

  const sugeridosMap = useMemo(() => {
    const map = new Map<string, {
      producto: Producto;
      cantidadSugerida: number;
      frecuencia: number;
      esTopCliente: boolean;
      esSugeridoGeneral: boolean;
    }>();
    sugeridosData.forEach((s) => map.set(s.producto.id, s));
    return map;
  }, [sugeridosData]);

  // Productos frecuentes del cliente seleccionado
  const productosFrecuentes = useMemo(() => {
    if (!cliente || !cliente.sugerido) return [];
    return cliente.sugerido
      .map((s) => effectiveProductos.find((p) => p.id === s.productoId))
      .filter(Boolean) as Producto[];
  }, [cliente, effectiveProductos]);

  // Filtrado de productos por texto y categoría
  const filtered = useMemo(() => {
    return effectiveProductos.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q);

      const matchCat =
        categoriaActiva === 'Todas' ||
        p.categoria.toLowerCase() === categoriaActiva.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [effectiveProductos, search, categoriaActiva]);

  // Totales de carrito
  const cartTotal = carrito.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = carrito.length;

  // Precio final según cliente (respeta precios especiales pactados por Don Juan / Miguel)
  const getPrecio = (producto: Producto): number => {
    if (cliente?.precioEspecial?.[producto.id]) {
      return cliente.precioEspecial[producto.id];
    }
    return producto.precioBase;
  };

  // Agregar al carrito según el flujo de venta rápida de Miguel y soporte multipresentación
  const handleAddProduct = (producto: Producto, cantidad: number, presentacion?: PresentacionConfig) => {
    if (producto.estadoConfiguracion === 'Pendiente') {
      Alert.alert(
        'Producto pendiente de configuración',
        `"${producto.nombre}" está pendiente de configuración. Confirma su unidad y presentación en Catálogo antes de venderlo.`
      );
      return;
    }

    const isMultipres = Boolean(producto.manejaMultiplesPresentaciones || (producto.presentaciones && producto.presentaciones.length > 1));
    const isWeight = !isMultipres && isProductoPorKilo(producto);
    const pres = presentacion || (producto.presentaciones && producto.presentaciones.length > 0 ? producto.presentaciones[0] : undefined);
    const precioUnitario = pres ? getPrecioPresentacion(producto, pres, cliente) : getPrecio(producto);
    const factor = pres?.piezasEquivalentes || 1;
    const unidadesBase = isWeight ? cantidad : Math.round(cantidad * factor);

    // Validación preventiva de inventario disponible en camioneta (Req. 14 / AUD-002)
    const yaEnCarrito = carrito
      .filter((i) => i.producto.id === producto.id)
      .reduce((s, i) => s + (i.piezasTotales || i.cantidad * (i.factorConversion || 1)), 0);

    const requeridasTotales = yaEnCarrito + unidadesBase;

    if (producto.existencia !== undefined && requeridasTotales > producto.existencia) {
      const disponible = Math.max(0, producto.existencia - yaEnCarrito);
      const unidadStr = producto.unidad || 'unidad';
      Alert.alert(
        'Inventario insuficiente',
        `No hay suficiente stock en camioneta para "${producto.nombre}".\n\n` +
          `Disponible en camioneta: ${disponible} ${unidadStr}(s)\n` +
          `Solicitado en esta selección: ${unidadesBase} ${unidadStr}(s)` +
          (yaEnCarrito > 0 ? `\n(Ya agregaste ${yaEnCarrito} ${unidadStr}(s) previamente al carrito)` : '')
      );
      return;
    }

    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;

    const item: ItemCarrito = {
      producto: {
        ...producto,
        unidad: isWeight ? 'kg' : (producto.unidad || 'pieza'),
        precioPorPeso: isWeight,
      },
      cantidad,
      unidad: pres ? pres.tipo : (isWeight ? 'kg' : producto.unidad || 'pieza'),
      presentacion: pres,
      presentacionNombre: pres?.nombre,
      factorConversion: factor,
      piezasTotales: unidadesBase,
      precioLista: precioUnitario,
      descuento: 0,
      precioFinal: precioUnitario,
      subtotal,
    };

    addToCarrito(item);
    setShowQtyModal(null);
  };

  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* ENCABEZADO DE VENTA                                       */}
      {/* ========================================================= */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Nueva venta</Text>
            {cliente ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsClientModalOpen(true)}
                style={styles.clientSelectorRow}
              >
                <Text style={styles.subtitle}>
                  Cliente: <Text style={styles.clientNameHighlight}>{cliente.nombre}</Text>
                </Text>
                <ChevronRight size={14} color={colors.primary[600]} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsClientModalOpen(true)}
                style={styles.clientSelectorRow}
              >
                <Text style={[styles.subtitle, { color: colors.warning[700], fontWeight: '600' }]}>
                  ⚠️ Toca para seleccionar cliente
                </Text>
                <ChevronRight size={14} color={colors.warning[700]} />
              </TouchableOpacity>
            )}
          </View>
          <ConnectivityIndicator />
        </View>

        {/* Buscador de productos */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categorías deslizables */}
        <View style={styles.controlsBar}>
          <ScrollView
            style={{ flex: 1 }}
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
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'mosaico' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('mosaico')}
            >
              <LayoutGrid size={15} color={viewMode === 'mosaico' ? colors.primary[700] : colors.neutral[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'lista' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('lista')}
            >
              <List size={15} color={viewMode === 'lista' ? colors.primary[700] : colors.neutral[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* LISTADO DE PRODUCTOS                                      */}
      {/* ========================================================= */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Banner para seleccionar cliente si no hay uno activo */}
        {!cliente && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.selectClientBanner}
            onPress={() => setIsClientModalOpen(true)}
          >
            <View style={styles.selectClientIconCircle}>
              <User size={22} color={colors.primary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectClientTitle}>Seleccionar Cliente de Ruta</Text>
              <Text style={styles.selectClientSub}>
                Toca aquí para asignar cliente o realizar venta de mostrador
              </Text>
            </View>
            <View style={styles.selectClientActionBadge}>
              <Text style={styles.selectClientActionText}>Elegir</Text>
              <ChevronRight size={14} color={colors.primary[700]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Sección de Venta Sugerida (Top Productos del cliente / ruta) */}
        {sugeridosData.length > 0 && !search && categoriaActiva === 'Todas' && (
          <View style={styles.sugeridaSection}>
            <View style={styles.sugeridaHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color={colors.warning[600]} />
                <Text style={styles.sugeridaTitle}>
                  {cliente ? `Venta Sugerida · ${cliente.nombre}` : 'Venta Sugerida (Top Productos)'}
                </Text>
              </View>
              <View style={styles.sugeridaBadge}>
                <Text style={styles.sugeridaBadgeText}>
                  {cliente && cliente.historial?.length ? 'Top más comprados' : 'Más vendidos'}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sugeridaScroll}
            >
              {sugeridosData.map((sug) => {
                const isWeight = isProductoPorKilo(sug.producto);
                const presBase = sug.producto.presentaciones?.[0];
                const precio = presBase ? getPrecioPresentacion(sug.producto, presBase, cliente) : getPrecio(sug.producto);
                const displayUnit = isWeight ? 'kg' : (sug.producto.unidad || 'pza');

                return (
                  <View key={'sug-' + sug.producto.id} style={styles.sugeridaCard}>
                    <View style={styles.sugeridaCardTop}>
                      <View style={styles.sugeridaStarBadge}>
                        <Star size={11} color="#B45309" fill="#F59E0B" />
                        <Text style={styles.sugeridaStarText}>
                          {sug.esTopCliente ? 'Top Cliente' : 'Top Ruta'}
                        </Text>
                      </View>
                      <Text style={styles.sugeridaCardPrice}>{formatCurrency(precio)}</Text>
                    </View>

                    <Text style={styles.sugeridaCardName} numberOfLines={2}>
                      {sug.producto.nombre}
                    </Text>

                    <Text style={styles.sugeridaCardQty}>
                      Sugerido: <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                        {sug.cantidadSugerida} {displayUnit}{sug.cantidadSugerida === 1 ? '' : 's'}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.sugeridaAddBtn}
                      onPress={() => handleAddProduct(sug.producto, sug.cantidadSugerida)}
                    >
                      <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.sugeridaAddBtnText}>
                        + Agregar {sug.cantidadSugerida}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        {false && (
          <>
            <View style={styles.sectionLabelRow}>
              <Flame size={15} color={colors.warning[600]} />
              <Text style={styles.sectionLabel}>Frecuentes del cliente</Text>
            </View>
            {productosFrecuentes.map((p) => (
              <ProductRow
                key={'freq-' + p.id}
                producto={p}
                precio={getPrecio(p)}
                cliente={cliente}
                onPress={() => setShowQtyModal(p)}
              />
            ))}
          </>
        )}

        {/* Catálogo completo */}
        <View style={styles.sectionLabelRow}>
          <Clock size={15} color={colors.neutral[400]} />
          <Text style={styles.sectionLabel}>
            {categoriaActiva === 'Todas' ? 'Catálogo de Productos' : categoriaActiva} ({filtered.length})
          </Text>
        </View>
        {viewMode === 'mosaico' ? (
          <View style={styles.mosaicGrid}>
            {filtered.map((p) => (
              <ProductGridCard
                key={p.id}
                producto={p}
                precio={getPrecio(p)}
                cliente={cliente}
                sugerido={sugeridosMap.get(p.id)}
                onPress={() => handleOpenQtyModal(p)}
              />
            ))}
          </View>
        ) : (
          filtered.map((p) => (
            <ProductRow
              key={p.id}
              producto={p}
              precio={getPrecio(p)}
              cliente={cliente}
              sugerido={sugeridosMap.get(p.id)}
              onPress={() => handleOpenQtyModal(p)}
            />
          ))
        )}
        {/*
          <ProductRow
            key={p.id}
            producto={p}
            precio={getPrecio(p)}
            cliente={cliente}
            onPress={() => setShowQtyModal(p)}
          />
        */}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No se encontraron productos.</Text>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* BARRA FLOTANTE DE CARRITO (CUANDO HAY ARTÍCULOS)          */}
      {/* ========================================================= */}
      {cartCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push('/(tabs)/venta/carrito')}
          style={styles.cartBar}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>
              {cartCount} {cartCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarTotal}>{formatCurrency(cartTotal)}</Text>
            <View style={styles.cartBarBtn}>
              <Text style={styles.cartBarBtnText}>Ver carrito</Text>
              <ChevronRight size={18} color={colors.neutral[0]} />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CANTIDAD (FLUJO RÁPIDO EXACTO DE MIGUEL)         */}
      {/* ========================================================= */}
      {showQtyModal && (
        <QtyModal
          producto={showQtyModal}
          precio={getPrecio(showQtyModal)}
          cliente={cliente}
          onClose={() => setShowQtyModal(null)}
          onConfirm={handleAddProduct}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL PARA CAMBIAR CLIENTE ACTIVO                         */}
      {/* ========================================================= */}
      <Modal
        visible={isClientModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClientModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsClientModalOpen(false)}
          />
          <View style={styles.clientPickerCard}>
            <View style={styles.clientPickerHeaderRow}>
              <Text style={styles.clientPickerTitle}>Seleccionar cliente</Text>
              <TouchableOpacity
                onPress={() => setIsClientModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* Buscador de Clientes */}
            <View style={styles.clientSearchWrap}>
              <Search size={16} color={colors.neutral[400]} />
              <TextInput
                style={styles.clientSearchInput}
                placeholder="Buscar cliente, dueño, calle o ID..."
                placeholderTextColor={colors.neutral[400]}
                value={clientSearch}
                onChangeText={setClientSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {clientSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setClientSearch('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Opción Venta Mostrador */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.clientGeneralBtn,
                clienteActivoId === 'general' && styles.clientGeneralBtnActive,
              ]}
              onPress={() => {
                setClienteActivoId('general');
                setIsClientModalOpen(false);
              }}
            >
              <View style={styles.clientGeneralIcon}>
                <Store size={18} color={colors.primary[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientGeneralTitle}>Venta de Mostrador / General</Text>
                <Text style={styles.clientGeneralSub}>Sin cuenta de crédito · Pago de contado</Text>
              </View>
              {clienteActivoId === 'general' && <Check size={18} color={colors.primary[600]} />}
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">
              {effectiveClientes
                .filter((c) => {
                  if (c.activo === false) return false;
                  if (!clientSearch.trim()) return true;
                  const q = clientSearch.toLowerCase().trim();
                  const matchNombre = (c.nombre || '').toLowerCase().includes(q);
                  const matchProp = (c.propietario || '').toLowerCase().includes(q);
                  const matchDir = (c.direccion || '').toLowerCase().includes(q);
                  const matchCol = (c.colonia || '').toLowerCase().includes(q);
                  const matchRuta = (c.ruta || '').toLowerCase().includes(q);
                  const matchId = String(c.id || '').toLowerCase().includes(q);
                  return matchNombre || matchProp || matchDir || matchCol || matchRuta || matchId;
                })
                .map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.clientItem,
                    cliente?.id === c.id && styles.clientItemActive,
                  ]}
                  onPress={() => {
                    setClienteActivoId(c.id);
                    setIsClientModalOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientItemName}>{c.nombre}</Text>
                    <Text style={styles.clientItemSub}>
                      {c.propietario || 'Cliente de ruta'} · {c.direccion || c.colonia || 'León, Gto'}
                    </Text>
                  </View>
                  {cliente?.id === c.id && <Check size={18} color={colors.primary[600]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// FILA DE PRODUCTO INDIVIDUAL
// =========================================================
function ProductRow({
  producto,
  precio,
  cliente,
  sugerido,
  onPress,
}: {
  producto: Producto;
  precio: number;
  cliente: Cliente | null;
  sugerido?: { cantidadSugerida: number; frecuencia: number; esTopCliente: boolean };
  onPress: () => void;
}) {
  const isMultipres = Boolean(
    producto.manejaMultiplesPresentaciones ||
    (producto.presentaciones && producto.presentaciones.length > 1)
  );
  const isWeight = !isMultipres && isProductoPorKilo(producto);
  const stockEstado = getStockEstado(producto.existencia, isWeight);
  const stockColor =
    stockEstado === 'Normal'
      ? colors.success[600]
      : stockEstado === 'Bajo'
      ? colors.warning[600]
      : colors.error[500];

  const displayUnit = isWeight ? 'kg' : producto.unidad || 'pieza';

  const presBase = producto.presentaciones && producto.presentaciones.length > 0
    ? producto.presentaciones[0]
    : null;
  const precioMostrar = presBase ? getPrecioPresentacion(producto, presBase, cliente) : precio;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.productCard}>
        <View style={styles.productIcon}>
          {isMultipres ? (
            <Boxes size={22} color={colors.primary[600]} />
          ) : (
            <Text style={styles.productIconText}>
              {producto.categoria ? producto.categoria.charAt(0).toUpperCase() : 'P'}
            </Text>
          )}
        </View>
        <View style={styles.productInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.productName}>{producto.nombre}</Text>
            {sugerido && (
              <View style={styles.rowSugeridoBadge}>
                <Star size={10} color="#B45309" fill="#F59E0B" />
                <Text style={styles.rowSugeridoBadgeText}>
                  {sugerido.esTopCliente ? 'Top Cliente' : 'Sugerido'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <Text style={styles.productCat}>{producto.categoria}</Text>
            {isMultipres && (
              <View style={styles.multipresBadge}>
                <Layers size={10} color={colors.primary[700]} />
                <Text style={styles.multipresBadgeText}>
                  {producto.presentaciones?.length || 3} presentaciones
                </Text>
              </View>
            )}
          </View>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>
              <Text style={{ color: stockColor, fontWeight: fontWeight.semibold }}>
                {isWeight ? producto.existencia.toFixed(1) : producto.existencia} {displayUnit}s
              </Text>
              {' · '}
              <Text style={{ color: stockColor }}>{stockEstado}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>{formatCurrency(precioMostrar)}</Text>
          <Text style={styles.productUnit}>/{presBase?.nombre || displayUnit}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// =========================================================
// TARJETA DE PRODUCTO EN MOSAICO (DISEÑO EN CUADRÍCULA)
// =========================================================
function ProductGridCard({
  producto,
  precio,
  cliente,
  sugerido,
  onPress,
}: {
  producto: Producto;
  precio: number;
  cliente: Cliente | null;
  sugerido?: { cantidadSugerida: number; frecuencia: number; esTopCliente: boolean };
  onPress: () => void;
}) {
  const isMultipres = Boolean(
    producto.manejaMultiplesPresentaciones ||
    (producto.presentaciones && producto.presentaciones.length > 1)
  );
  const isWeight = !isMultipres && isProductoPorKilo(producto);
  const stockEstado = getStockEstado(producto.existencia, isWeight);
  const stockColor =
    stockEstado === 'Normal'
      ? colors.success[600]
      : stockEstado === 'Bajo'
      ? colors.warning[600]
      : colors.error[500];

  const displayUnit = isWeight ? 'kg' : producto.unidad || 'pza';
  const presBase = producto.presentaciones && producto.presentaciones.length > 0
    ? producto.presentaciones[0]
    : null;
  const precioMostrar = presBase ? getPrecioPresentacion(producto, presBase, cliente) : precio;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.gridCard, sugerido && styles.gridCardSugerido]}
    >
      {sugerido && (
        <View style={styles.gridSugeridoBadge}>
          <Star size={10} color="#B45309" fill="#F59E0B" />
          <Text style={styles.gridSugeridoBadgeText}>
            {sugerido.esTopCliente ? 'Top Cliente' : 'Sugerido'}
          </Text>
        </View>
      )}

      <View style={styles.gridTopMeta}>
        <Text style={styles.gridCatText} numberOfLines={1}>
          {producto.marca || producto.categoria}
        </Text>
        {isMultipres && (
          <View style={styles.gridMultiBadge}>
            <Layers size={9} color={colors.primary[700]} />
            <Text style={styles.gridMultiBadgeText}>Multi</Text>
          </View>
        )}
      </View>

      <Text style={styles.gridNameText} numberOfLines={2}>
        {producto.nombre}
      </Text>

      <View style={styles.gridStockRow}>
        <View style={[styles.gridStockDot, { backgroundColor: stockColor }]} />
        <Text style={[styles.gridStockText, { color: stockColor }]}>
          {isWeight ? producto.existencia.toFixed(1) : producto.existencia} {displayUnit}s
        </Text>
      </View>

      <View style={styles.gridBottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.gridPriceVal}>{formatCurrency(precioMostrar)}</Text>
          <Text style={styles.gridPriceUnit}>/{presBase?.nombre || displayUnit}</Text>
        </View>
        <View style={styles.gridAddBtn}>
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =========================================================
// MODAL DE VENTA DE MIGUEL (SOPORTE MULTIPRESENTACIÓN REAL)
// =========================================================
function QtyModal({
  producto,
  precio,
  cliente,
  onClose,
  onConfirm,
}: {
  producto: Producto;
  precio: number;
  cliente: Cliente | null;
  onClose: () => void;
  onConfirm: (p: Producto, c: number, pres?: PresentacionConfig) => void;
}) {
  const isMultipres = Boolean(
    producto.manejaMultiplesPresentaciones ||
    (producto.presentaciones && producto.presentaciones.length > 1)
  );
  const isWeight = !isMultipres && isProductoPorKilo(producto);

  // Presentaciones activas
  const presentaciones = useMemo(() => {
    if (producto.presentaciones && producto.presentaciones.length > 0) {
      return [...producto.presentaciones]
        .filter((pr) => pr.activa !== false)
        .sort((a, b) => (a.orden || 1) - (b.orden || 1));
    }
    return [];
  }, [producto.presentaciones]);

  // Presentación seleccionada
  const [selectedPres, setSelectedPres] = useState<PresentacionConfig | undefined>(
    presentaciones.length > 0 ? presentaciones[0] : undefined
  );

  const [qty, setQty] = useState(isWeight ? 0.5 : 1);

  const pesos = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
  const piezas = [1, 2, 3, 5, 10, 12];
  const opciones = isWeight ? pesos : piezas;

  const displayUnit = isMultipres
    ? (selectedPres?.nombre || selectedPres?.tipo || producto.unidad || 'paquete')
    : (isWeight ? 'kg' : producto.unidad || 'pieza');

  const precioUnitario = useMemo(() => {
    if (isMultipres && selectedPres) {
      return getPrecioPresentacion(producto, selectedPres, cliente);
    }
    return precio;
  }, [isMultipres, selectedPres, producto, cliente, precio]);

  const factor = isMultipres && selectedPres ? selectedPres.piezasEquivalentes : 1;
  const unidadesBaseADescontar = isWeight ? qty : Math.round(qty * factor);
  const excedeExistencia = !isWeight && unidadesBaseADescontar > producto.existencia;

  const handleMinus = () => {
    if (isWeight) {
      setQty((q) => Math.max(0.25, Math.round((q - 0.25) * 1000) / 1000));
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handlePlus = () => {
    if (isWeight) {
      setQty((q) => Math.round((q + 0.25) * 1000) / 1000);
    } else {
      setQty((q) => q + 1);
    }
  };

  const subtotal = Math.round(qty * precioUnitario * 100) / 100;

  return (
    <View style={modalStyles.overlay}>
      <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />

        <View style={{ marginBottom: spacing.xs }}>
          <Text style={modalStyles.title}>{producto.nombre}</Text>
          <Text style={modalStyles.subtitle}>
            {formatCurrency(precioUnitario)} por {displayUnit}
          </Text>
        </View>

        {/* Mosaico de Selección de Presentaciones */}
        {isMultipres && presentaciones.length > 0 && (
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={modalStyles.label}>Selecciona la presentación:</Text>
            <View style={modalStyles.mosaicContainer}>
              {presentaciones.map((pr) => {
                const isSelected = selectedPres?.tipo === pr.tipo;
                const prPrecio = getPrecioPresentacion(producto, pr, cliente);
                return (
                  <TouchableOpacity
                    key={pr.tipo}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPres(pr)}
                    style={[
                      modalStyles.mosaicCard,
                      isSelected && modalStyles.mosaicCardActive,
                    ]}
                  >
                    {isSelected && (
                      <View style={modalStyles.mosaicCheckBadge}>
                        <Check size={10} color={colors.neutral[0]} />
                      </View>
                    )}
                    <Text
                      style={[
                        modalStyles.mosaicTitle,
                        isSelected && modalStyles.mosaicTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {pr.nombre.toUpperCase()}
                    </Text>
                    <Text style={modalStyles.mosaicPrice}>
                      {formatCurrency(prPrecio)}
                    </Text>
                    <Text style={modalStyles.mosaicDeduction}>
                      {pr.piezasEquivalentes === 1
                        ? `1 ${producto.unidad || 'paquete'}`
                        : `${pr.piezasEquivalentes} ${producto.unidad || 'paquete'}s`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Indicador de impacto en inventario unificado */}
        <View style={modalStyles.stockDeductionBanner}>
          <View style={{ flex: 1 }}>
            <Text style={modalStyles.stockBannerText}>
              Descuento de inventario:{' '}
              <Text style={{ fontWeight: 'bold', color: colors.primary[800] }}>
                {unidadesBaseADescontar} {producto.unidad || 'paquete'}{unidadesBaseADescontar === 1 ? '' : 's'}
              </Text>
            </Text>
            <Text style={modalStyles.stockAvailText}>
              Existencia disponible: {producto.existencia} {producto.unidad || 'paquete'}s
            </Text>
          </View>
          {excedeExistencia && (
            <Text style={modalStyles.stockWarningText}>⚠️ Stock insuficiente</Text>
          )}
        </View>

        <Text style={modalStyles.label}>Cantidad</Text>

        {/* Stepper principal */}
        <View style={modalStyles.qtyRow}>
          <TouchableOpacity
            style={modalStyles.qtyBtn}
            activeOpacity={0.7}
            onPress={handleMinus}
          >
            <Text style={modalStyles.qtyBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={modalStyles.qtyDisplay}>
            {isWeight ? `${qty.toFixed(3)} kg` : `${qty} ${displayUnit}`}
          </Text>

          <TouchableOpacity
            style={modalStyles.qtyBtn}
            activeOpacity={0.7}
            onPress={handlePlus}
          >
            <Text style={modalStyles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Opciones rápidas */}
        <View style={modalStyles.opcionesRow}>
          {opciones.map((o) => (
            <TouchableOpacity
              key={o}
              style={[modalStyles.opcionChip, qty === o && modalStyles.opcionChipActive]}
              onPress={() => setQty(o)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  modalStyles.opcionText,
                  qty === o && modalStyles.opcionTextActive,
                ]}
              >
                {isWeight ? o.toFixed(3) : o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subtotal en tiempo real */}
        <View style={modalStyles.totalRow}>
          <Text style={modalStyles.totalLabel}>Subtotal</Text>
          <Text style={modalStyles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>

        {/* Botón de confirmar */}
        <TouchableOpacity
          style={[modalStyles.addBtn, excedeExistencia && { backgroundColor: colors.neutral[400] }]}
          activeOpacity={0.88}
          disabled={excedeExistencia}
          onPress={() => onConfirm(producto, qty, selectedPres)}
        >
          <ShoppingCart size={20} color={colors.neutral[0]} />
          <Text style={modalStyles.addBtnText}>
            {excedeExistencia ? 'Inventario insuficiente' : 'Agregar al carrito'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.neutral[0],
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  clientSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientNameHighlight: {
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.neutral[900],
  },
  catsRow: {
    gap: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  catChipActive: {
    backgroundColor: colors.primary[600],
  },
  catChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  catChipTextActive: {
    color: colors.neutral[0],
  },
  list: {
    flex: 1,
    padding: spacing.md,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  productCat: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 1,
  },
  productMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  productStock: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  productUnit: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  emptyWrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.neutral[400],
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 22,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadows.floating,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  cartBarText: {
    fontSize: fontSize.base,
    color: colors.neutral[300],
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartBarTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  cartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  cartBarBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  clientPickerCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    ...shadows.floating,
  },
  clientPickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  clientItemActive: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
  },
  clientItemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  clientItemSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  multipresBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  multipresBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  cambiarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginLeft: 6,
  },
  cambiarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[700],
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  viewModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  selectClientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  selectClientIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  selectClientTitle: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary[900],
  },
  selectClientSub: {
    fontSize: 11,
    color: colors.primary[700],
    marginTop: 2,
  },
  selectClientActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  selectClientActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[800],
  },
  sugeridaSection: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sugeridaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  sugeridaTitle: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: '#92400E',
  },
  sugeridaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sugeridaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  sugeridaScroll: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  sugeridaCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...shadows.card,
  },
  sugeridaCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sugeridaStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  sugeridaStarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  sugeridaCardPrice: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.neutral[800],
  },
  sugeridaCardName: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[900],
    height: 32,
    marginBottom: 2,
  },
  sugeridaCardQty: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 6,
  },
  sugeridaAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: radius.sm,
    paddingVertical: 5,
    gap: 4,
  },
  sugeridaAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mosaicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.card,
  },
  gridCardSugerido: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  gridSugeridoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.sm,
    zIndex: 1,
  },
  gridSugeridoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  gridTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingRight: 20,
  },
  gridCatText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
    textTransform: 'uppercase',
  },
  gridMultiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gridMultiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary[700],
  },
  gridNameText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    height: 38,
    marginBottom: 4,
  },
  gridStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  gridStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridStockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 6,
  },
  gridPriceVal: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  gridPriceUnit: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  gridAddBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSugeridoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    marginLeft: 4,
  },
  rowSugeridoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  clientPickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  clientSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  clientSearchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
    paddingVertical: Platform.OS === 'web' ? 8 : 4,
    paddingHorizontal: 4,
    minHeight: 36,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  clientGeneralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  clientGeneralBtnActive: {
    borderColor: colors.primary[600],
    borderWidth: 1.5,
  },
  clientGeneralIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientGeneralTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: '800',
    color: colors.primary[900],
  },
  clientGeneralSub: {
    fontSize: 10,
    color: colors.primary[700],
    marginTop: 1,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs + 2,
  },
  mosaicContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  mosaicCard: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    position: 'relative',
  },
  mosaicCardActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  mosaicCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosaicTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    letterSpacing: 0.5,
  },
  mosaicTitleActive: {
    color: colors.primary[700],
  },
  mosaicPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
    marginVertical: 2,
  },
  mosaicDeduction: {
    fontSize: 10,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  stockDeductionBanner: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[100],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBannerText: {
    fontSize: fontSize.xs,
    color: colors.primary[900],
  },
  stockAvailText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  stockWarningText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.error[600],
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  qtyDisplay: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    minWidth: 140,
    textAlign: 'center',
  },
  opcionesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  opcionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  opcionChipActive: {
    backgroundColor: colors.primary[600],
  },
  opcionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  opcionTextActive: {
    color: colors.neutral[0],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  addBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
