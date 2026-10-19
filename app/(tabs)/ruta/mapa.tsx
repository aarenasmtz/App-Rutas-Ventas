import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Navigation,
  Layers,
  ExternalLink,
  Compass,
  Phone,
  ShoppingCart,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { DataService } from '@/services/mockDataService';
import { getRutaDiaActual } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import type { Cliente } from '@/types';

let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch {}
}

// Función Haversine para cálculo de distancia real entre 2 coordenadas GPS
function calculateRealDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Paradas de ruta predeterminadas en León, Gto (usadas como ruta base cuando no hay clientes en la BD)
const DEFAULT_PARADAS_LEON: Cliente[] = [
  {
    id: 'cli_leon_1',
    nombre: 'Abarrotes La Lupita',
    propietario: 'María Elena Morales',
    direccion: 'San Juan de Dios #104',
    colonia: 'San Juan de Dios',
    ciudad: 'León, Gto',
    ruta: 'Ruta León',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 450,
    limiteCredito: 3000,
    estado: 'Pendiente',
    ultimaVisita: '2026-10-15',
    telefono: '4771234567',
    latitud: 21.1162,
    longitud: -101.6811,
    activo: true,
    historial: [],
    sugerido: [],
  },
  {
    id: 'cli_leon_2',
    nombre: 'Cremería El Coecillo',
    propietario: 'Roberto Hernández',
    direccion: 'Calle Vicente Guerrero #210',
    colonia: 'El Coecillo',
    ciudad: 'León, Gto',
    ruta: 'Ruta León',
    diasVisita: ['Lun', 'Mié'],
    saldo: 0,
    limiteCredito: 2500,
    estado: 'Pendiente',
    ultimaVisita: '2026-10-14',
    telefono: '4779876543',
    latitud: 21.1275,
    longitud: -101.6685,
    activo: true,
    historial: [],
    sugerido: [],
  },
  {
    id: 'cli_leon_3',
    nombre: 'Carnicería Los Compadres',
    propietario: 'Ignacio Vega',
    direccion: 'Blvd. Mariano Escobedo #502',
    colonia: 'León Moderno',
    ciudad: 'León, Gto',
    ruta: 'Ruta León',
    diasVisita: ['Lun', 'Jue'],
    saldo: 1200,
    limiteCredito: 5000,
    estado: 'Visitado',
    ultimaVisita: '2026-10-17',
    telefono: '4774567890',
    latitud: 21.1090,
    longitud: -101.6690,
    activo: true,
    historial: [],
    sugerido: [],
  },
  {
    id: 'cli_leon_4',
    nombre: 'Mini Súper Obregón',
    propietario: 'Guadalupe Rocha',
    direccion: 'Calle Álvaro Obregón #320',
    colonia: 'Obrera',
    ciudad: 'León, Gto',
    ruta: 'Ruta León',
    diasVisita: ['Lun', 'Mar', 'Mié'],
    saldo: 0,
    limiteCredito: 2000,
    estado: 'Pendiente',
    ultimaVisita: '2026-10-12',
    latitud: 21.1350,
    longitud: -101.6870,
    activo: true,
    historial: [],
    sugerido: [],
  },
  {
    id: 'cli_leon_5',
    nombre: 'Tienda La Esperanza',
    propietario: 'Carmen Salgado',
    direccion: 'Blvd. San Pedro #1405',
    colonia: 'San Pedro',
    ciudad: 'León, Gto',
    ruta: 'Ruta León',
    diasVisita: ['Lun', 'Vie'],
    saldo: 320,
    limiteCredito: 1500,
    estado: 'Pendiente',
    ultimaVisita: '2026-10-16',
    telefono: '4773456789',
    latitud: 21.1020,
    longitud: -101.6520,
    activo: true,
    historial: [],
    sugerido: [],
  },
];

export default function MapaScreen() {
  const router = useRouter();
  const { clienteId } = useLocalSearchParams<{ clienteId?: string }>();
  const { setClienteActivoId } = useApp();

  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showStopsSheet, setShowStopsSheet] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webViewRef = useRef<any>(null);

  // Obtener geolocalización real del dispositivo si está disponible
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Permiso denegado o no disponible en entorno: no inventar datos
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Cargar clientes de la ruta
  useEffect(() => {
    let isMounted = true;
    const fetchClientes = async () => {
      try {
        const list = await DataService.getClientes();
        if (!isMounted) return;
        const active = (list ?? []).filter((c) => c.activo !== false);
        const resolved = active.length > 0 ? active : DEFAULT_PARADAS_LEON;
        setClientesList(resolved);

        if (clienteId) {
          const match = resolved.find((c) => String(c.id) === String(clienteId));
          if (match) {
            setSelectedClient(match);
            return;
          }
        }
        setSelectedClient(resolved[0] || null);
      } catch {
        if (isMounted) {
          setClientesList(DEFAULT_PARADAS_LEON);
          setSelectedClient(DEFAULT_PARADAS_LEON[0]);
        }
      }
    };
    fetchClientes();
    return () => {
      isMounted = false;
    };
  }, [clienteId]);

  const leonClientes = useMemo(() => {
    return clientesList.filter((c) => c.activo !== false);
  }, [clientesList]);

  // Índice de la parada seleccionada (1-based para UI)
  const selectedIndex = useMemo(() => {
    if (!selectedClient) return 0;
    const idx = leonClientes.findIndex((c) => String(c.id) === String(selectedClient.id));
    return idx >= 0 ? idx : 0;
  }, [leonClientes, selectedClient]);

  // Distancia real calculada (solo si hay coordenadas reales de usuario y cliente)
  const realDistanceLabel = useMemo(() => {
    if (!userLocation || !selectedClient?.latitud || !selectedClient?.longitud) {
      return null; // NUNCA mostrar distancias inventadas como "500 m"
    }
    const distKm = calculateRealDistanceKm(
      userLocation.lat,
      userLocation.lng,
      selectedClient.latitud,
      selectedClient.longitud
    );
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m`;
    }
    return `${distKm.toFixed(1)} km`;
  }, [userLocation, selectedClient]);

  // Enviar mensaje al mapa (Leaflet dentro de iframe o WebView)
  const sendToMap = useCallback((msg: any) => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, []);

  // Escuchar selección de marcadores desde Leaflet
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'CLIENT_CLICKED') {
          const match = leonClientes.find((c) => String(c.id) === String(data.clientId));
          if (match) {
            setSelectedClient(match);
          }
        }
      } catch {}
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('message', handleWindowMessage);
      return () => window.removeEventListener('message', handleWindowMessage);
    }
  }, [leonClientes]);

  // Cuando cambia el cliente seleccionado desde React, avisar a Leaflet para resaltar
  useEffect(() => {
    if (selectedClient) {
      sendToMap({ type: 'SELECT_CLIENT', clientId: selectedClient.id });
    }
  }, [selectedClient, sendToMap]);

  // Abrir GPS en Google Maps para parada individual
  const handleOpenGps = (cliente: Cliente) => {
    const lat = cliente.latitud;
    const lng = cliente.longitud;
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    } else {
      const query = encodeURIComponent(`${cliente.nombre}, ${cliente.direccion}, León, Guanajuato`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  // Abrir ruta completa en Google Maps (Acción secundaria identificada)
  const handleOpenFullRouteGps = () => {
    if (leonClientes.length === 0) return;
    const stops = leonClientes.slice(0, 8);
    const last = stops[stops.length - 1];
    const destination = `${last.latitud || 21.1090},${last.longitud || -101.6750}`;
    const waypoints = stops.slice(0, -1).map((s) => `${s.latitud || 21.1221},${s.longitud || -101.6828}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Controles del mapa
  const handleFitAll = () => {
    sendToMap({ type: 'FIT_ALL' });
  };

  const handleLocateUser = () => {
    if (userLocation) {
      sendToMap({ type: 'LOCATE_USER', lat: userLocation.lat, lng: userLocation.lng });
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          sendToMap({ type: 'LOCATE_USER', lat: loc.lat, lng: loc.lng });
        },
        () => {
          sendToMap({ type: 'FIT_ALL' });
        }
      );
    } else {
      sendToMap({ type: 'FIT_ALL' });
    }
  };

  const handleIniciarVenta = async (cliente: Cliente) => {
    try {
      const list = await DataService.getClientes();
      const exists = (list || []).some((c) => String(c.id) === String(cliente.id));
      if (!exists) {
        await DataService.createCliente(cliente);
      }
    } catch {}
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/venta');
  };

  const handleVerCliente = (cliente: Cliente) => {
    router.push(('/(tabs)/ruta/cliente/' + cliente.id) as any);
  };

  const handleSelectStopFromSheet = (cliente: Cliente) => {
    setSelectedClient(cliente);
    sendToMap({ type: 'SELECT_CLIENT', clientId: cliente.id });
    setShowStopsSheet(false);
    setTimeout(() => {
      sendToMap({ type: 'INVALIDATE_SIZE' });
    }, 200);
  };

  const handleCloseStopsSheet = () => {
    setShowStopsSheet(false);
    setTimeout(() => {
      sendToMap({ type: 'INVALIDATE_SIZE' });
    }, 200);
  };

  // HTML optimizado de Leaflet con OpenStreetMap
  const leafletMapHtml = useMemo(() => {
    const defaultCenterLat = 21.1221;
    const defaultCenterLng = -101.6828;

    const focused = selectedClient || (leonClientes.length > 0 ? leonClientes[0] : null);
    const centerLat = focused?.latitud || defaultCenterLat;
    const centerLng = focused?.longitud || defaultCenterLng;
    const initialZoom = focused?.latitud && focused?.longitud ? 15.5 : 13.5;

    const markersData = leonClientes.map((c, i) => {
      let lat = c.latitud;
      let lng = c.longitud;
      const isTarget = focused ? String(c.id) === String(focused.id) : i === 0;

      // Respetar estrictamente coordenadas reales o georreferenciación aproximada
      if (lat === undefined || lat === null || lng === undefined || lng === null) {
        const col = (c.colonia || '').toLowerCase();
        if (col.includes('coecillo')) { lat = 21.1275; lng = -101.6685; }
        else if (col.includes('san juan') || col.includes('dios')) { lat = 21.1162; lng = -101.6811; }
        else if (col.includes('moderno')) { lat = 21.1090; lng = -101.6690; }
        else if (col.includes('echeveste')) { lat = 21.1680; lng = -101.6890; }
        else if (col.includes('obrera')) { lat = 21.1350; lng = -101.6870; }
        else {
          lat = defaultCenterLat + ((i % 5) - 2) * 0.007;
          lng = defaultCenterLng + ((i % 4) - 1.5) * 0.007;
        }
      }

      return {
        id: c.id,
        index: i + 1,
        lat,
        lng,
        estado: c.estado,
        isSelected: isTarget,
      };
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body, #map {
            width: 100%;
            height: 100%;
            background: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .custom-pin-wrap {
            background: transparent;
            border: none;
          }
          /* Marcador en forma de gota moderna con número visible y legible */
          .custom-pin {
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: #2563eb;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.35);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .custom-pin span {
            transform: rotate(45deg);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 800;
            font-size: 13px;
            line-height: 1;
            color: #ffffff;
          }
          .custom-pin.completed {
            background: #059669;
          }
          /* Marcador seleccionado: resalta por borde amber/gold, forma, escala y z-index */
          .custom-pin.selected {
            width: 38px;
            height: 38px;
            background: #1e3a8a;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 0 3.5px #f59e0b, 0 8px 20px rgba(15, 23, 42, 0.5);
            transform: rotate(-45deg) scale(1.15);
            z-index: 9999 !important;
          }
          .custom-pin.selected span {
            font-size: 14px;
            color: #fef08a;
          }
          /* Indicador de ubicación del usuario */
          .user-marker-pulse {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #0284c7;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.35);
            animation: userPulse 2s infinite;
          }
          @keyframes userPulse {
            0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.5); }
            70% { box-shadow: 0 0 0 12px rgba(2, 132, 199, 0); }
            100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
          }
          /* Controles de zoom compactos e integrados */
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12) !important;
            border-radius: 10px !important;
            overflow: hidden;
            margin: 10px !important;
          }
          .leaflet-control-zoom a {
            background: #ffffff !important;
            color: #1e293b !important;
            border-bottom: 1px solid #f1f5f9 !important;
            width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
            font-size: 16px !important;
          }
          .leaflet-control-zoom a:hover {
            background: #f8fafc !important;
            color: #0f172a !important;
          }
          /* Atribución obligatoria OSM visible y compacta */
          .leaflet-control-attribution {
            font-size: 9px !important;
            background: rgba(255, 255, 255, 0.8) !important;
            padding: 1px 6px !important;
            color: #64748b !important;
            border-top-left-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var stops = ${JSON.stringify(markersData)};
          var initialCenter = [${centerLat}, ${centerLng}];
          var initialZoom = ${initialZoom};

          var map = L.map('map', {
            zoomControl: true,
            attributionControl: true
          }).setView(initialCenter, initialZoom);

          map.attributionControl.setPrefix(false);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          var markerMap = {};
          var latlngs = [];
          var userMarker = null;

          stops.forEach(function(s) {
            latlngs.push([s.lat, s.lng]);

            var isCompleted = s.estado === 'Venta realizada' || s.estado === 'Visitado';
            var classes = 'custom-pin ' + (s.isSelected ? 'selected ' : '') + (isCompleted ? 'completed ' : '');

            var pinHtml = '<div id="pin-' + s.id + '" class="' + classes + '"><span>' + s.index + '</span></div>';

            var icon = L.divIcon({
              className: 'custom-pin-wrap',
              html: pinHtml,
              iconSize: [36, 36],
              iconAnchor: [18, 32]
            });

            var marker = L.marker([s.lat, s.lng], {
              icon: icon,
              zIndexOffset: s.isSelected ? 1000 : 10
            }).addTo(map);

            // Al hacer click en el marcador, avisar a la pantalla sin abrir globo
            marker.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              selectMarker(s.id, false);
              var msg = { type: 'CLIENT_CLICKED', clientId: s.id };
              if (window.parent) {
                window.parent.postMessage(msg, '*');
              }
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(msg));
              }
            });

            markerMap[s.id] = { marker: marker, data: s };
          });

          // Trazado de ruta conectando paradas de forma limpia
          if (latlngs.length > 1) {
            L.polyline(latlngs, {
              color: '#2563eb',
              weight: 3.5,
              opacity: 0.7,
              dashArray: '6, 8',
              lineJoin: 'round'
            }).addTo(map);
          }

          function selectMarker(id, shouldPan) {
            Object.keys(markerMap).forEach(function(key) {
              var el = document.getElementById('pin-' + key);
              if (el) {
                if (String(key) === String(id)) {
                  el.classList.add('selected');
                  markerMap[key].marker.setZIndexOffset(1000);
                  if (shouldPan) {
                    map.panTo([markerMap[key].data.lat, markerMap[key].data.lng], {
                      animate: true,
                      duration: 0.35
                    });
                  }
                } else {
                  el.classList.remove('selected');
                  markerMap[key].marker.setZIndexOffset(10);
                }
              }
            });
          }

          function fitAllStops() {
            if (latlngs.length > 1) {
              map.fitBounds(latlngs, { padding: [35, 35], maxZoom: 16 });
            } else if (latlngs.length === 1) {
              map.setView(latlngs[0], 16);
            }
          }

          function setUserPosition(lat, lng) {
            if (userMarker) {
              userMarker.setLatLng([lat, lng]);
            } else {
              var userIcon = L.divIcon({
                className: 'custom-pin-wrap',
                html: '<div class="user-marker-pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
            }
            map.setView([lat, lng], 16);
          }

          // Escuchar comandos desde React Native
          window.addEventListener('message', function(event) {
            var data = event.data;
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) {}
            }
            if (!data) return;

            if (data.type === 'SELECT_CLIENT') {
              selectMarker(data.clientId, true);
            } else if (data.type === 'FIT_ALL') {
              fitAllStops();
            } else if (data.type === 'LOCATE_USER') {
              if (data.lat && data.lng) {
                setUserPosition(data.lat, data.lng);
              }
            } else if (data.type === 'INVALIDATE_SIZE') {
              setTimeout(function() { map.invalidateSize(); }, 60);
            }
          });

          window.addEventListener('resize', function() {
            map.invalidateSize();
          });
        </script>
      </body>
      </html>
    `;
  }, [leonClientes, selectedClient]);

  return (
    <View style={styles.container}>
      {/* 1. CABECERA COMPACTA */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
          accessibilityLabel="Regresar"
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={colors.neutral[800]} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Mapa de Ruta León
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {getRutaDiaActual()} · {leonClientes.length}{' '}
            {leonClientes.length === 1 ? 'parada' : 'paradas'}
          </Text>
        </View>

        {leonClientes.length > 0 && (
          <TouchableOpacity
            style={styles.headerFullRouteBtn}
            onPress={handleOpenFullRouteGps}
            activeOpacity={0.8}
            accessibilityLabel="Navegar ruta completa en GPS"
          >
            <Navigation size={13} color={colors.primary[700]} />
            <Text style={styles.headerFullRouteText}>Ruta GPS</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. ÁREA DEL MAPA (Ocupa el espacio restante sin empujar hacia abajo) */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef as any}
            srcDoc={leafletMapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Mapa León Guanajuato"
          />
        ) : NativeWebView ? (
          <NativeWebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletMapHtml }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(e: any) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                if (data?.type === 'CLIENT_CLICKED') {
                  const match = leonClientes.find((c) => String(c.id) === String(data.clientId));
                  if (match) setSelectedClient(match);
                }
              } catch {}
            }}
          />
        ) : (
          <View style={styles.fallbackBox}>
            <MapPin size={28} color={colors.primary[600]} />
            <Text style={styles.fallbackTitle}>León, Guanajuato</Text>
            <Text style={styles.fallbackSub}>Coordenadas: 21.1221, -101.6828</Text>
          </View>
        )}

        {/* Controles simplificados y limpios sobre el mapa */}
        <View style={styles.mapControlsGroup}>
          <TouchableOpacity
            style={styles.mapCtrlBtn}
            activeOpacity={0.85}
            onPress={handleFitAll}
            accessibilityLabel="Ajustar todas las paradas"
          >
            <Maximize2 size={16} color={colors.neutral[700]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapCtrlBtn}
            activeOpacity={0.85}
            onPress={handleLocateUser}
            accessibilityLabel="Mi ubicación"
          >
            <Compass size={16} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. FICHA ÚNICA COMPACTA DEL CLIENTE SELECCIONADO */}
      {selectedClient ? (
        <View style={styles.selectedClientCard}>
          {/* Fila superior: Parada #N, Nombre, Dirección/Distancia real y botón Ver paradas */}
          <View style={styles.clientTopRow}>
            <View style={styles.stopBadge}>
              <Text style={styles.stopBadgeText}>#{selectedIndex + 1}</Text>
            </View>

            <View style={styles.clientDetails}>
              <View style={styles.clientTitleRow}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {selectedClient.nombre}
                </Text>
                {selectedClient.saldo && selectedClient.saldo > 0 ? (
                  <Text style={styles.clientSaldoBadge}>
                    Debe ${selectedClient.saldo.toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.clientAddress} numberOfLines={1}>
                {realDistanceLabel ? `${realDistanceLabel} · ` : ''}
                {selectedClient.propietario ? `${selectedClient.propietario} · ` : ''}
                {selectedClient.direccion}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnVerParadas}
              activeOpacity={0.8}
              onPress={() => setShowStopsSheet(true)}
              accessibilityLabel="Ver lista de paradas"
            >
              <Layers size={13} color={colors.primary[700]} />
              <Text style={styles.btnVerParadasText}>
                Paradas ({leonClientes.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fila de acciones principales: Vender (primario), Cómo llegar (secundario), Llamar, Detalle */}
          <View style={styles.clientActionsRow}>
            <TouchableOpacity
              style={styles.btnVender}
              activeOpacity={0.85}
              onPress={() => handleIniciarVenta(selectedClient)}
            >
              <ShoppingCart size={15} color="#FFFFFF" />
              <Text style={styles.btnVenderText}>Vender</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnComoLlegar}
              activeOpacity={0.85}
              onPress={() => handleOpenGps(selectedClient)}
            >
              <Navigation size={14} color={colors.primary[700]} />
              <Text style={styles.btnComoLlegarText}>Cómo llegar</Text>
            </TouchableOpacity>

            {selectedClient.telefono ? (
              <TouchableOpacity
                style={styles.btnIconAction}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`tel:${selectedClient.telefono}`)}
                accessibilityLabel="Llamar al cliente"
              >
                <Phone size={15} color={colors.neutral[700]} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.btnIconAction}
              activeOpacity={0.85}
              onPress={() => handleVerCliente(selectedClient)}
              accessibilityLabel="Ver ficha del cliente"
            >
              <ExternalLink size={14} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyClientCard}>
          <MapPin size={20} color={colors.primary[500]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyClientTitle}>Sin paradas programadas</Text>
            <Text style={styles.emptyClientSub}>No hay clientes asignados a la ruta de hoy.</Text>
          </View>
          <TouchableOpacity
            style={styles.emptyClientBtn}
            onPress={() => router.push('/(tabs)/clientes')}
          >
            <Text style={styles.emptyClientBtnText}>Ver clientes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. PANEL INFERIOR DE PARADAS (Abierto únicamente al tocar 'Ver paradas') */}
      <Modal
        visible={showStopsSheet}
        transparent
        animationType="slide"
        onRequestClose={handleCloseStopsSheet}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseStopsSheet}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Paradas de la Ruta</Text>
                <Text style={styles.sheetSubtitle}>
                  {leonClientes.length} paradas · Toca una para ubicarla en el mapa
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={handleCloseStopsSheet}
                accessibilityLabel="Cerrar panel de paradas"
              >
                <X size={18} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetList}
              contentContainerStyle={styles.sheetListContent}
              showsVerticalScrollIndicator={true}
            >
              {leonClientes.map((c, i) => {
                const isSelected = selectedClient?.id === c.id;
                const isAttended = c.estado === 'Venta realizada' || c.estado === 'Visitado';
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.stopItemCard, isSelected && styles.stopItemCardActive]}
                    onPress={() => handleSelectStopFromSheet(c)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.stopItemNumber,
                        isSelected && styles.stopItemNumberActive,
                        isAttended && styles.stopItemNumberAttended,
                      ]}
                    >
                      {isAttended ? (
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.stopItemNumberText,
                            (isSelected || isAttended) && styles.stopItemNumberTextActive,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>

                    <View style={styles.stopItemDetails}>
                      <View style={styles.stopItemNameRow}>
                        <Text
                          style={[
                            styles.stopItemName,
                            isSelected && styles.stopItemNameActive,
                          ]}
                          numberOfLines={1}
                        >
                          {c.nombre}
                        </Text>
                        {c.saldo && c.saldo > 0 ? (
                          <Text style={styles.stopItemSaldo}>${c.saldo.toLocaleString()}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.stopItemAddress} numberOfLines={1}>
                        {c.propietario ? `${c.propietario} · ` : ''}{c.direccion}
                      </Text>
                    </View>

                    <ChevronRight
                      size={18}
                      color={isSelected ? colors.primary[600] : colors.neutral[400]}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    backgroundColor: colors.neutral[50],
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  // Cabecera compacta
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: spacing.xs + 2,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  headerFullRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  headerFullRouteText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  // Contenedor del mapa adaptable
  mapArea: {
    flex: 1,
    minHeight: 180,
    marginHorizontal: spacing.xs + 2,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  fallbackBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  fallbackTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginTop: spacing.xs,
  },
  fallbackSub: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  // Controles flotantes limpios
  mapControlsGroup: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs + 2,
    flexDirection: 'column',
    gap: 6,
    zIndex: 10,
  },
  mapCtrlBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.card,
  },
  // Ficha única compacta
  selectedClientCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    marginHorizontal: spacing.xs + 2,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.card,
  },
  clientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 6,
  },
  stopBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  clientDetails: {
    flex: 1,
  },
  clientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    flexShrink: 1,
  },
  clientSaldoBadge: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.error[600],
    backgroundColor: colors.error[50],
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  clientAddress: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  btnVerParadas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  btnVerParadasText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  clientActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnVender: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
  },
  btnVenderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  btnComoLlegar: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  btnComoLlegarText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  btnIconAction: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  // Estado vacío
  emptyClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.xs + 2,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  emptyClientTitle: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  emptyClientSub: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  emptyClientBtn: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  emptyClientBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  // Panel Modal de Paradas
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '62%',
    paddingBottom: Platform.OS === 'ios' ? 24 : spacing.sm,
    ...shadows.floating,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginTop: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sheetTitle: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  sheetSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  sheetList: {
    paddingHorizontal: spacing.sm + 2,
  },
  sheetListContent: {
    paddingVertical: spacing.xs + 2,
    gap: 6,
  },
  stopItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs + 3,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.xs + 2,
  },
  stopItemCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  stopItemNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopItemNumberActive: {
    backgroundColor: colors.primary[600],
  },
  stopItemNumberAttended: {
    backgroundColor: colors.success[600],
  },
  stopItemNumberText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  stopItemNumberTextActive: {
    color: '#FFFFFF',
  },
  stopItemDetails: {
    flex: 1,
  },
  stopItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stopItemName: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    flex: 1,
  },
  stopItemNameActive: {
    color: colors.primary[900],
  },
  stopItemSaldo: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.error[600],
  },
  stopItemAddress: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 1,
  },
});
