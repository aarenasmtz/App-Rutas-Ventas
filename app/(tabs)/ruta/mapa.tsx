import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Navigation,
  Layers,
  ExternalLink,
  Compass,
  Phone,
  ShoppingCart,
  Maximize2,
  RotateCcw,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { ScreenHeader, Card, Badge } from '@/components/shared';
import { DataService, mockClientes } from '@/services/mockDataService';
import { useApp } from '@/context/AppContext';
import type { Cliente } from '@/types';

let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch {}
}

export default function MapaScreen() {
  const router = useRouter();
  const { setClienteActivoId } = useApp();
  const [clientesList, setClientesList] = useState<Cliente[]>(mockClientes);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(mockClientes[0]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const list = await DataService.getClientes();
        if (list && list.length > 0) {
          setClientesList(list);
          setSelectedClient(list[0]);
        }
      } catch {}
    };
    fetchClientes();
  }, []);

  const leonClientes = useMemo(() => {
    return clientesList.filter((c) => c.activo !== false);
  }, [clientesList]);

  // Abrir GPS en Google Maps para parada individual
  const handleOpenGps = (cliente: Cliente) => {
    const lat = cliente.latitud || 21.1221;
    const lng = cliente.longitud || -101.6828;
    const query = encodeURIComponent(`${cliente.nombre}, ${cliente.direccion}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  // Abrir ruta completa de entrega en León en Google Maps
  const handleOpenFullRouteGps = () => {
    if (leonClientes.length === 0) return;
    const stops = leonClientes.slice(0, 8);
    const origin = `${stops[0].latitud || 21.1221},${stops[0].longitud || -101.6828}`;
    const destination = `${stops[stops.length - 1].latitud || 21.1090},${stops[stops.length - 1].longitud || -101.6750}`;
    const waypoints = stops.slice(1, -1).map((s) => `${s.latitud},${s.longitud}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleIniciarVenta = (cliente: Cliente) => {
    setClienteActivoId(cliente.id);
    router.push('/(tabs)/venta');
  };

  const handleVerCliente = (cliente: Cliente) => {
    router.push(('/(tabs)/ruta/cliente/' + cliente.id) as any);
  };

  // Generar HTML interactivo con Leaflet y OpenStreetMap centrado en León, Guanajuato
  const leafletMapHtml = useMemo(() => {
    const centerLat = 21.1221;
    const centerLng = -101.6828;

    const markersData = leonClientes.map((c, i) => ({
      id: c.id,
      index: i + 1,
      nombre: c.nombre.replace(/'/g, "\\'"),
      propietario: (c.propietario || '').replace(/'/g, "\\'"),
      direccion: (c.direccion || '').replace(/'/g, "\\'"),
      lat: c.latitud || (centerLat + (i * 0.005 - 0.01)),
      lng: c.longitud || (centerLng + (i * 0.004 - 0.008)),
      saldo: c.saldo || 0,
      telefono: c.telefono || '',
    }));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .custom-pin {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #2563eb;
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.35);
            transition: transform 0.2s;
          }
          .custom-pin.first {
            background: #16a34a;
            border-color: #fef08a;
            width: 36px;
            height: 36px;
            font-size: 15px;
          }
          .custom-pin:hover {
            transform: scale(1.15);
          }
          .leaflet-popup-content-wrapper {
            border-radius: 14px;
            padding: 4px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.18);
          }
          .popup-content {
            padding: 6px 4px;
            min-width: 170px;
          }
          .popup-badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 6px;
            margin-bottom: 4px;
          }
          .popup-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .popup-addr {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .popup-saldo {
            font-size: 11px;
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 8px;
          }
          .popup-btn {
            display: block;
            text-align: center;
            background: #2563eb;
            color: #ffffff !important;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([${centerLat}, ${centerLng}], 13.5);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var stops = ${JSON.stringify(markersData)};
          var latlngs = [];

          stops.forEach(function(s, index) {
            latlngs.push([s.lat, s.lng]);
            var isFirst = index === 0;

            var icon = L.divIcon({
              className: 'custom-pin-wrap',
              html: '<div class="custom-pin ' + (isFirst ? 'first' : '') + '">' + s.index + '</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            var marker = L.marker([s.lat, s.lng], { icon: icon }).addTo(map);

            var popupHtml = '<div class="popup-content">' +
              '<span class="popup-badge">Parada #' + s.index + '</span>' +
              '<div class="popup-name">' + s.nombre + '</div>' +
              '<div class="popup-addr">' + s.direccion + '</div>' +
              (s.saldo > 0 ? '<div class="popup-saldo">Saldo: $' + s.saldo.toLocaleString() + '</div>' : '') +
              '<a href="https://www.google.com/maps/search/?api=1&query=' + s.lat + ',' + s.lng + '" target="_blank" class="popup-btn">📍 Abrir en GPS</a>' +
              '</div>';

            marker.bindPopup(popupHtml);
          });

          // Polilínea trazada de ruta entre clientes de León
          if (latlngs.length > 1) {
            L.polyline(latlngs, {
              color: '#2563eb',
              weight: 4,
              opacity: 0.75,
              dashArray: '8, 8'
            }).addTo(map);
          }
        </script>
      </body>
      </html>
    `;
  }, [leonClientes]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Mapa de Ruta León, Gto"
        subtitle={`Ruta Centro · ${leonClientes.length} negocios programados`}
        onBack={() => router.back()}
      />

      {/* ÁREA DEL MAPA REAL INTERACTIVO */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={leafletMapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Mapa León Guanajuato"
          />
        ) : NativeWebView ? (
          <NativeWebView
            originWhitelist={['*']}
            source={{ html: leafletMapHtml }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        ) : (
          <View style={styles.fallbackBox}>
            <MapPin size={32} color={colors.primary[600]} />
            <Text style={styles.fallbackTitle}>León, Guanajuato</Text>
            <Text style={styles.fallbackSub}>Coordenadas: 21.1221, -101.6828</Text>
          </View>
        )}

        {/* Botón flotante para abrir ruta completa en GPS */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.gpsFullRouteBtn}
            activeOpacity={0.85}
            onPress={handleOpenFullRouteGps}
          >
            <Navigation size={18} color="#FFFFFF" />
            <Text style={styles.gpsFullRouteText}>Navegar Ruta en GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Etiqueta de ciudad */}
        <View style={styles.cityBadge}>
          <Compass size={14} color={colors.primary[700]} />
          <Text style={styles.cityBadgeText}>León, Guanajuato · GPS en Vivo</Text>
        </View>
      </View>

      {/* DETALLE DE PARADA SELECCIONADA / LISTA */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {selectedClient && (
          <View style={styles.selectedClientCard}>
            <View style={styles.selHeader}>
              <View style={styles.selBadge}>
                <Text style={styles.selBadgeText}>CLIENTE ACTIVO</Text>
              </View>
              <Text style={styles.selDistText}>{selectedClient.distanciaMock || 'León, Gto'}</Text>
            </View>

            <Text style={styles.selName}>{selectedClient.nombre}</Text>
            <Text style={styles.selAddr}>{selectedClient.propietario} · {selectedClient.direccion}</Text>

            <View style={styles.selButtonsRow}>
              <TouchableOpacity
                style={styles.btnActionVender}
                activeOpacity={0.85}
                onPress={() => handleIniciarVenta(selectedClient)}
              >
                <ShoppingCart size={16} color="#FFFFFF" />
                <Text style={styles.btnActionVenderText}>Vender</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnActionGps}
                activeOpacity={0.85}
                onPress={() => handleOpenGps(selectedClient)}
              >
                <ExternalLink size={16} color={colors.primary[700]} />
                <Text style={styles.btnActionGpsText}>GPS</Text>
              </TouchableOpacity>

              {selectedClient.telefono && (
                <TouchableOpacity
                  style={styles.btnActionPhone}
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(`tel:${selectedClient.telefono}`)}
                >
                  <Phone size={16} color={colors.neutral[700]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <Text style={styles.sheetTitle}>Paradas programadas en León, Gto:</Text>
        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          {leonClientes.map((c, i) => {
            const isSelected = selectedClient?.id === c.id;
            return (
              <Card
                key={c.id}
                style={[styles.stopCard, isSelected && styles.stopCardActive]}
                onPress={() => setSelectedClient(c)}
              >
                <View style={[styles.stopNumber, i === 0 && styles.stopNumberCurrent, isSelected && styles.stopNumberSelected]}>
                  <Text style={[styles.stopNumberText, (i === 0 || isSelected) && styles.stopNumberTextCurrent]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{c.nombre}</Text>
                  <Text style={styles.stopAddress} numberOfLines={1}>
                    {c.direccion}
                  </Text>
                </View>
                <View style={styles.stopRight}>
                  {i === 0 ? (
                    <Badge label="Próximo" color="azul" />
                  ) : (
                    <Text style={styles.stopTime}>~{(9 + i * 0.5).toFixed(1).replace('.', ':')}0</Text>
                  )}
                  <TouchableOpacity
                    style={styles.navIconBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenGps(c);
                    }}
                  >
                    <Navigation size={14} color={colors.primary[600]} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  mapArea: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginTop: spacing.xs,
  },
  fallbackSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  floatingControls: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  gpsFullRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.card,
  },
  gpsFullRouteText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
  },
  cityBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadows.card,
    zIndex: 10,
  },
  cityBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
  },
  bottomSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.md,
    maxHeight: 330,
    ...shadows.floating,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  selectedClientCard: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  selHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  selBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  selDistText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  selName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  selAddr: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  selButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  btnActionVender: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  btnActionVenderText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  btnActionGps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  btnActionGpsText: {
    color: colors.primary[700],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  btnActionPhone: {
    backgroundColor: colors.neutral[0],
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  sheetTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  sheetList: {
    maxHeight: 140,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  stopCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50] + '40',
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberCurrent: {
    backgroundColor: colors.success[600],
  },
  stopNumberSelected: {
    backgroundColor: colors.primary[600],
  },
  stopNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  stopNumberTextCurrent: {
    color: colors.neutral[0],
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  stopAddress: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 1,
  },
  stopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stopTime: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  navIconBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
  },
});
