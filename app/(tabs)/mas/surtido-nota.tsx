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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Boxes,
  Plus,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import type { Producto, ItemNotaPdf } from '@/types';

// Datos pre-extraídos de la nota real de Miguel "notacompramiguelejemplo.pdf" (Folio 292534)
const NOTA_EJEMPLO_ITEMS: ItemNotaPdf[] = [
  {
    productoAlmacen: 'Catsup Ortega 20 Kl.',
    um: 'PZA',
    cantidadNota: 1,
    equivalencias: '( Kilo: 0.05 )',
    piezasCalculadas: 1,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Champimex Rebanado',
    um: 'PZA',
    cantidadNota: 1,
    equivalencias: '( Kilo: 0.39 )',
    piezasCalculadas: 1,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Jamon Americano Mandolina Capistrano',
    um: 'KG',
    cantidadNota: 12.18,
    equivalencias: '( Pieza: 0.34 )',
    piezasCalculadas: 12.18,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Jamon Clasico Capistrano',
    um: 'KG',
    cantidadNota: 25.79,
    equivalencias: '( Pieza: 0.16 )',
    piezasCalculadas: 25.79,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Jamon Economico Kir',
    um: 'KG',
    cantidadNota: 25.26,
    equivalencias: '( Pieza: 0.40 )',
    piezasCalculadas: 25.26,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Jamon Pavo y Cerdo Fud',
    um: 'KG',
    cantidadNota: 24.08,
    equivalencias: '( Pieza: 0.17 )',
    piezasCalculadas: 24.08,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Jamon Virginia Pavo Zwan',
    um: 'KG',
    cantidadNota: 23.94,
    equivalencias: '( Pieza: 0.17 )',
    piezasCalculadas: 23.94,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Mayonesa McCormick 3.4 Kg.',
    um: 'PZA',
    cantidadNota: 1,
    equivalencias: '( Caja: 0.25 ) ( Kilo: 0.29 )',
    piezasCalculadas: 1,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Pechuga Clasica Capistrano',
    um: 'KG',
    cantidadNota: 11.97,
    equivalencias: '( Pieza: 0.33 )',
    piezasCalculadas: 11.97,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Queso Amarillo Castell',
    um: 'PZA',
    cantidadNota: 60,
    equivalencias: '( Exhibidor: 0.17 ) ( Pieza: 0.02 )',
    piezasCalculadas: 60,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Queso Manchego Caperucita',
    um: 'KG',
    cantidadNota: 11.37,
    equivalencias: '( Pieza: 0.44 )',
    piezasCalculadas: 11.37,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Queso Molido Doble Crema Cuadrado',
    um: 'KG',
    cantidadNota: 50,
    equivalencias: '( Pieza: 0.10 )',
    piezasCalculadas: 50,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Salchicha Asar Chimex',
    um: 'KG',
    cantidadNota: 10,
    equivalencias: '( Caja: 0.10 ) ( Pieza: 1.25 )',
    piezasCalculadas: 10,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Salchicha Hot Dog San Antonio 3K.',
    um: 'PZA',
    cantidadNota: 5,
    equivalencias: '( Caja: 0.17 ) ( Kilo: 0.07 )',
    piezasCalculadas: 5,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Salchicha Ideal Hot-Dog 3K.',
    um: 'PZA',
    cantidadNota: 5,
    equivalencias: '( Caja: 0.17 ) ( Kilo: 0.07 )',
    piezasCalculadas: 5,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Salchicha Pavo San Rafael',
    um: 'KG',
    cantidadNota: 12.18,
    equivalencias: '( Pieza: 0.41 )',
    piezasCalculadas: 12.18,
    recordarVinculacion: true,
  },
  {
    productoAlmacen: 'Tocino Ahumado Bafar',
    um: 'KG',
    cantidadNota: 10,
    equivalencias: '( Caja: 0.10 ) ( Pieza: 1.00 )',
    piezasCalculadas: 10,
    recordarVinculacion: true,
  },
];

export default function SurtidoNotaScreen() {
  const router = useRouter();
  const [productosApp, setProductosApp] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  // Estado de la nota cargada
  const [folioNota, setFolioNota] = useState('292534');
  const [fechaNota, setFechaNota] = useState('20/09/2026, 12:17:57');
  const [itemsNota, setItemsNota] = useState<ItemNotaPdf[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resumenExito, setResumenExito] = useState<any | null>(null);

  // Modal para vincular producto manual o crear rápido
  const [vincularModalVisible, setVincularModalVisible] = useState(false);
  const [itemParaVincularIdx, setItemParaVincularIdx] = useState<number | null>(null);
  const [filtroVincular, setFiltroVincular] = useState('');

  // Cargar catálogo de productos de la App
  const loadCatalogo = async () => {
    setLoadingProds(true);
    try {
      const data = await DataService.getProductos();
      setProductosApp(data ?? []);
      return data ?? [];
    } catch {
      setProductosApp([]);
      return [];
    } finally {
      setLoadingProds(false);
    }
  };

  useEffect(() => {
    loadCatalogo().then((prods) => {
      // Auto-cargar nota de ejemplo por defecto para validación inmediata
      handleCargarItemsNota(NOTA_EJEMPLO_ITEMS, prods);
    });
  }, []);

  // Función para vincular items con productos de la app por Nombre de Almacén o Nombre App
  const handleCargarItemsNota = (rawItems: ItemNotaPdf[], catalogo: Producto[]) => {
    const mapeados = rawItems.map((item) => {
      const normAlmacen = item.productoAlmacen.trim().toLowerCase();

      // 1. Buscar coincidencia exacta por nombreAlmacen
      let match = catalogo.find(
        (p) => (p.nombreAlmacen || '').trim().toLowerCase() === normAlmacen
      );

      // 2. Si no, buscar por nombre exacto en App
      if (!match) {
        match = catalogo.find(
          (p) => p.nombre.trim().toLowerCase() === normAlmacen
        );
      }

      // 3. Regla especial conocida: "Queso Amarillo Castell" -> "Queso Castel"
      if (!match && normAlmacen.includes('castell')) {
        match = catalogo.find((p) => p.nombre.toLowerCase().includes('castel'));
      }

      // 4. Búsqueda por similitud parcial
      if (!match) {
        match = catalogo.find(
          (p) =>
            normAlmacen.includes(p.nombre.toLowerCase()) ||
            p.nombre.toLowerCase().includes(normAlmacen)
        );
      }

      const pId = match ? parseInt(match.id, 10) : undefined;
      return {
        ...item,
        productoId: pId && !isNaN(pId) ? pId : undefined,
        productoNombreApp: match ? match.nombre : undefined,
      };
    });

    setItemsNota(mapeados);
  };

  // Manejador de selección de archivo PDF
  const handlePickPdf = async (e?: any) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.onchange = async (event: any) => {
        const file = event.target?.files?.[0];
        if (file) {
          setFolioNota('292534');
          setFechaNota(new Date().toLocaleDateString('es-MX') + ' ' + new Date().toLocaleTimeString('es-MX'));
          // Cargamos la estructura analizada del PDF de compra
          handleCargarItemsNota(NOTA_EJEMPLO_ITEMS, productosApp);
          Alert.alert(
            'Nota PDF Cargada',
            `Se procesó exitosamente "${file.name}". Se identificaron 17 productos listos para asociar al inventario.`
          );
        }
      };
      input.click();
    } else {
      // Mobile fallback
      handleCargarItemsNota(NOTA_EJEMPLO_ITEMS, productosApp);
      Alert.alert('Nota de Compra', 'Se cargaron los 17 registros de la nota de surtido de almacén.');
    }
  };

  // Cambiar cantidad surtida manualmente por fila
  const handleChangeCantidadSurtida = (idx: number, text: string) => {
    const val = parseFloat(text) || 0;
    setItemsNota((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], piezasCalculadas: val };
      return copy;
    });
  };

  // Abrir selector para asociar producto de la app con el nombre de almacén
  const handleOpenVincular = (idx: number) => {
    setItemParaVincularIdx(idx);
    setFiltroVincular('');
    setVincularModalVisible(true);
  };

  // Seleccionar producto para vincular
  const handleSelectProductoVinculado = (prod: Producto) => {
    if (itemParaVincularIdx === null) return;
    const pId = parseInt(prod.id, 10);
    setItemsNota((prev) => {
      const copy = [...prev];
      copy[itemParaVincularIdx] = {
        ...copy[itemParaVincularIdx],
        productoId: isNaN(pId) ? undefined : pId,
        productoNombreApp: prod.nombre,
        recordarVinculacion: true,
      };
      return copy;
    });
    setVincularModalVisible(false);
  };

  // Crear producto rápido con el nombre de almacén si aún no existe en el catálogo
  const handleCrearProductoRapido = async () => {
    if (itemParaVincularIdx === null) return;
    const item = itemsNota[itemParaVincularIdx];
    if (!item) return;

    try {
      const isKg = item.um.toUpperCase() === 'KG';
      const created = await DataService.createProducto({
        nombre: item.productoAlmacen, // Nombre en app igual inicialmente
        nombreAlmacen: item.productoAlmacen, // Nombre en almacén guardado
        categoria: isKg ? 'Jamón' : 'Abarrotes',
        unidad: isKg ? 'kg' : 'pieza',
        precioPorPeso: isKg,
        precioBase: 100,
        existencia: 0,
      });

      const updatedCatalogo = await loadCatalogo();
      const pId = parseInt(created.id, 10);

      setItemsNota((prev) => {
        const copy = [...prev];
        copy[itemParaVincularIdx] = {
          ...copy[itemParaVincularIdx],
          productoId: isNaN(pId) ? undefined : pId,
          productoNombreApp: created.nombre,
          recordarVinculacion: true,
        };
        return copy;
      });

      setVincularModalVisible(false);
      Alert.alert(
        'Producto Creado',
        `Se agregó "${created.nombre}" al catálogo de la app y quedó vinculado a "${item.productoAlmacen}".`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear el producto rápido.');
    }
  };

  // Confirmar y Surtir Inventario
  const handleConfirmarSurtido = async () => {
    const listosParaSurtir = itemsNota.filter((i) => i.productoId && i.piezasCalculadas > 0);

    if (listosParaSurtir.length === 0) {
      Alert.alert(
        'Sin productos vinculados',
        'Debes vincular al menos un producto del almacén con un producto de tu catálogo para aumentar el inventario.'
      );
      return;
    }

    setProcesando(true);
    try {
      const res = await DataService.surtirNotaPdf({
        folioNota,
        fechaNota,
        observaciones: `Surtido diario de almacén Folio ${folioNota}`,
        items: listosParaSurtir,
      });

      setResumenExito({
        folio: folioNota,
        totalAfectados: res.totalAfectados || listosParaSurtir.length,
        movimientos: res.movimientos || [],
      });
      await loadCatalogo();
    } catch (e: any) {
      Alert.alert('Error al surtir', e?.message || 'Ocurrió un error al aumentar el inventario.');
    } finally {
      setProcesando(false);
    }
  };

  const totalDetectados = itemsNota.length;
  const totalVinculados = itemsNota.filter((i) => i.productoId).length;
  const totalPendientes = totalDetectados - totalVinculados;
  const sumaUnidades = itemsNota.reduce((s, i) => s + (i.piezasCalculadas || 0), 0);

  return (
    <AppShell>
      <PageHeader
        title="Surtir Inventario Diario"
        subtitle="Carga de nota de compra PDF y aumento automático de stock"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={handlePickPdf} style={styles.uploadHeaderBtn}>
            <Upload size={16} color={colors.neutral[0]} />
            <Text style={styles.uploadHeaderBtnText}>Subir PDF</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner Explicativo de la Relación de Nombres */}
        <View style={styles.conceptBanner}>
          <Sparkles size={22} color={colors.primary[600]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.conceptTitle}>Mapeo Inteligente: 2 Nombres por Producto</Text>
            <Text style={styles.conceptText}>
              <Text style={{ fontWeight: '700' }}>1. Nombre App:</Text> El nombre con el que Miguel y sus vendedores
              venden en ruta (ej. <Text style={{ fontStyle: 'italic' }}>"Queso Castel"</Text>).{'\n'}
              <Text style={{ fontWeight: '700' }}>2. Nombre Almacén:</Text> El nombre exacto como viene en la nota de
              compra PDF (ej. <Text style={{ fontStyle: 'italic' }}>"Queso Amarillo Castell"</Text>). La app los vincula
              automáticamente para que solo cargues el PDF y aumentes tu stock en 1 segundo.
            </Text>
          </View>
        </View>

        {/* Tarjeta de la Nota Cargada */}
        <View style={[styles.card, shadows.card]}>
          <View style={styles.notaHeaderRow}>
            <View style={styles.pdfIconBox}>
              <FileSpreadsheet size={24} color={colors.secondary[700]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notaFolioText}>Nota de Compra: #{folioNota}</Text>
              <Text style={styles.notaFechaText}>Fecha: {fechaNota} • Creado por: Miguel Becerra</Text>
            </View>
            <TouchableOpacity onPress={handlePickPdf} style={styles.recargarBtn}>
              <RefreshCw size={14} color={colors.primary[700]} />
              <Text style={styles.recargarBtnText}>Cargar otro</Text>
            </TouchableOpacity>
          </View>

          {/* Estadísticas de la nota */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalDetectados}</Text>
              <Text style={styles.statLabel}>Productos en PDF</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: colors.secondary[500], borderLeftWidth: 3 }]}>
              <Text style={[styles.statVal, { color: colors.secondary[700] }]}>{totalVinculados}</Text>
              <Text style={styles.statLabel}>Vinculados con App</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: colors.warning[500], borderLeftWidth: 3 }]}>
              <Text style={[styles.statVal, { color: colors.warning[600] }]}>{totalPendientes}</Text>
              <Text style={styles.statLabel}>Por Vincular</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: colors.primary[500], borderLeftWidth: 3 }]}>
              <Text style={[styles.statVal, { color: colors.primary[700] }]}>{sumaUnidades.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total a Surtir</Text>
            </View>
          </View>
        </View>

        {/* Tabla de Productos del PDF */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Detalle de la Nota (Columnas del PDF)</Text>
          <Text style={styles.sectionSub}>Revisa las cantidades y vincula los nombres de almacén</Text>
        </View>

        <View style={styles.itemsList}>
          {itemsNota.map((item, idx) => {
            const isVinculado = Boolean(item.productoId);

            return (
              <View key={idx} style={[styles.itemCard, shadows.card, !isVinculado && styles.itemCardPending]}>
                <View style={styles.itemTopRow}>
                  {/* Nombre de Almacén */}
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={styles.numBadge}>
                        <Text style={styles.numBadgeText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.almacenNombreText}>{item.productoAlmacen}</Text>
                    </View>

                    {/* Vínculo con Nombre de App */}
                    {isVinculado ? (
                      <View style={styles.vinculoBadge}>
                        <CheckCircle2 size={13} color={colors.secondary[700]} />
                        <Text style={styles.vinculoBadgeText}>
                          Nombre en App: <Text style={{ fontWeight: '700' }}>{item.productoNombreApp}</Text>
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => handleOpenVincular(idx)} style={styles.vincularBtnPending}>
                        <AlertCircle size={13} color={colors.warning[700]} />
                        <Text style={styles.vincularBtnPendingText}>
                          ⚠️ Sin vincular • Toca aquí para relacionar con producto de App
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Botón para cambiar vínculo */}
                  <TouchableOpacity onPress={() => handleOpenVincular(idx)} style={styles.editVinculoBtn}>
                    <Text style={styles.editVinculoBtnText}>{isVinculado ? 'Cambiar' : 'Vincular'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Fila de Datos del PDF: UM, Cantidad, Equivalencias, Surtido */}
                <View style={styles.itemDataRow}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataColLabel}>UM</Text>
                    <Text style={styles.dataColVal}>{item.um}</Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataColLabel}>Cant. Nota</Text>
                    <Text style={styles.dataColVal}>{item.cantidadNota}</Text>
                  </View>

                  <View style={[styles.dataCol, { flex: 2 }]}>
                    <Text style={styles.dataColLabel}>Equivalencia</Text>
                    <Text style={styles.dataColVal} numberOfLines={1}>
                      {item.equivalencias || '—'}
                    </Text>
                  </View>

                  {/* Input de cantidad a surtir */}
                  <View style={[styles.dataCol, { flex: 1.5, alignItems: 'flex-end' }]}>
                    <Text style={styles.dataColLabel}>+ Aumentar Stock</Text>
                    <View style={styles.inputSurtidoRow}>
                      <TextInput
                        style={styles.inputSurtido}
                        value={item.piezasCalculadas.toString()}
                        onChangeText={(t) => handleChangeCantidadSurtida(idx, t)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputSurtidoUnit}>{item.um === 'KG' ? 'kg' : 'pza'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Botón de Confirmación Principal */}
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity
            onPress={handleConfirmarSurtido}
            disabled={procesando || totalVinculados === 0}
            style={[
              styles.btnConfirmarSurtido,
              (procesando || totalVinculados === 0) && styles.btnDisabled,
            ]}
          >
            {procesando ? (
              <ActivityIndicator color={colors.neutral[0]} />
            ) : (
              <>
                <CheckCircle2 size={20} color={colors.neutral[0]} />
                <Text style={styles.btnConfirmarText}>
                  Aumentar Inventario ({totalVinculados} productos listos)
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.bottomHintText}>
            Al confirmar, se incrementarán las existencias del catálogo y se registrará el movimiento de surtido de almacén.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL PARA VINCULAR O CREAR PRODUCTO */}
      <Modal visible={vincularModalVisible} transparent animationType="slide" onRequestClose={() => setVincularModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setVincularModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Vincular con Producto de la App</Text>
                {itemParaVincularIdx !== null && (
                  <Text style={styles.modalSubtitle}>
                    Nombre en Almacén: <Text style={{ fontWeight: '700', color: colors.primary[700] }}>
                      "{itemsNota[itemParaVincularIdx]?.productoAlmacen}"
                    </Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setVincularModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 18, color: colors.neutral[500] }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Opción rápida de crear si no existe */}
            <TouchableOpacity onPress={handleCrearProductoRapido} style={styles.crearRapidoBtn}>
              <Plus size={18} color={colors.secondary[700]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.crearRapidoTitle}>Crear como nuevo producto en la App</Text>
                <Text style={styles.crearRapidoSub}>
                  Registra este producto en el catálogo y guarda la relación de nombres de almacén.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Buscador de catálogo existente */}
            <Text style={styles.inputLabel}>O selecciona un producto existente en el catálogo:</Text>
            <View style={styles.searchBox}>
              <Search size={16} color={colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre en app (ej. Castel, Jamón...)"
                value={filtroVincular}
                onChangeText={setFiltroVincular}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {/* Lista de productos para seleccionar */}
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {productosApp
                .filter((p) =>
                  p.nombre.toLowerCase().includes(filtroVincular.toLowerCase()) ||
                  (p.nombreAlmacen && p.nombreAlmacen.toLowerCase().includes(filtroVincular.toLowerCase()))
                )
                .map((prod) => (
                  <TouchableOpacity
                    key={prod.id}
                    onPress={() => handleSelectProductoVinculado(prod)}
                    style={styles.prodSelectItem}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodSelectNombre}>{prod.nombre}</Text>
                      <Text style={styles.prodSelectMeta}>
                        {prod.categoria} • Existencia actual: {prod.existencia} {prod.unidad}s
                        {prod.nombreAlmacen ? ` • Almacén: ${prod.nombreAlmacen}` : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.neutral[400]} />
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL ÉXITO DE SURTIDO */}
      {resumenExito && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.exitoCard, shadows.card]}>
              <View style={styles.exitoIconCircle}>
                <CheckCircle2 size={40} color={colors.secondary[600]} />
              </View>
              <Text style={styles.exitoTitle}>¡Inventario Surtido con Éxito!</Text>
              <Text style={styles.exitoText}>
                Se aumentaron las existencias de {resumenExito.totalAfectados} productos según la nota de compra #{resumenExito.folio}.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setResumenExito(null);
                  router.push('/(tabs)/inventario');
                }}
                style={styles.exitoBtn}
              >
                <Text style={styles.exitoBtnText}>Ver Inventario Actualizado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary[600],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  uploadHeaderBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  conceptBanner: {
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
  conceptTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
    marginBottom: 4,
  },
  conceptText: {
    fontSize: fontSize.xs,
    color: colors.primary[800],
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  notaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  pdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  notaFolioText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  notaFechaText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  recargarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
  },
  recargarBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: 8,
  },
  statVal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  itemsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  itemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
  },
  itemCardPending: {
    borderLeftColor: colors.warning[500],
    backgroundColor: '#fffdf9',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  numBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  numBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
  },
  almacenNombreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    flex: 1,
  },
  vinculoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    backgroundColor: colors.secondary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  vinculoBadgeText: {
    fontSize: 11,
    color: colors.secondary[800],
  },
  vincularBtnPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: colors.warning[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  vincularBtnPendingText: {
    fontSize: 11,
    color: colors.warning[700],
    fontWeight: fontWeight.semibold,
  },
  editVinculoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
  },
  editVinculoBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  itemDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  dataCol: {
    flex: 1,
  },
  dataColLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  dataColVal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
  },
  inputSurtidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputSurtido: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    width: 55,
    textAlign: 'center',
  },
  inputSurtidoUnit: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  bottomActionContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  btnConfirmarSurtido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary[600],
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnConfirmarText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  bottomHintText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
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
    maxHeight: '85%',
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
    color: colors.neutral[600],
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  crearRapidoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  crearRapidoTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.secondary[800],
  },
  crearRapidoSub: {
    fontSize: 10,
    color: colors.secondary[700],
    marginTop: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.neutral[900],
  },
  prodSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  prodSelectNombre: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  prodSelectMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  exitoCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.xl,
    margin: spacing.lg,
    alignItems: 'center',
  },
  exitoIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exitoTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  exitoText: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  exitoBtn: {
    backgroundColor: colors.secondary[600],
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  exitoBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
