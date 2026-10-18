import type { Cliente } from '@/types';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  FileText,
  ShoppingBag,
  Home,
  Share2,
  Printer,
  User,
  Download,
  Copy,
  Check,
  ImageIcon,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { DataService } from '@/services/mockDataService';
import { AppShell, MoneyDisplay } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import { ticketPrinter } from '@/services/ticketPrinterService';
import { ticketImageService } from '@/services/ticketImageService';
import TicketModal from '@/components/TicketModal';


const defaultCliente: Cliente = {
  id: 'general',
  nombre: 'Venta de Mostrador / General',
  propietario: 'Cliente General',
  direccion: 'Venta directa en ruta',
  ruta: 'Ruta Lunes',
  diasVisita: ['Lun', 'Mié', 'Vie'],
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

export default function ConfirmacionScreen() {
  const router = useRouter();
  const {
    ventaTotal,
    pagos,
    carrito,
    clearCarrito,
    clienteActivoId,
    setClienteActivoId,
    ultimoFolioVenta,
    user,
  } = useApp();

  const [rawCliente, setRawCliente] = useState<Cliente | null>(null);
  const cliente = rawCliente || defaultCliente;

  useEffect(() => {
    if (clienteActivoId) {
      DataService.getClienteById(clienteActivoId).then((c: Cliente | undefined) => {
        if (c) {
          setRawCliente(c);
          // Actualizar historial del cliente en memoria
          const nuevaEntradaHistorial = {
            id: ultimoFolioVenta || `F-${Date.now()}`,
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
            total: ventaTotal,
            items: carrito.map((i) => ({
              productoNombre: i.producto.nombre,
              cantidad: i.cantidad,
              unidad: i.producto.unidad,
            })),
            estado: (pagos.some((p) => p.metodo === 'Crédito') ? 'Crédito' : 'Pagado') as any,
          };
          if (!c.historial) c.historial = [];
          c.historial.unshift(nuevaEntradaHistorial);
          c.estado = 'Venta realizada';
          c.ultimaCompra = 'Hoy';
        }
      });
    }

    // Registrar evento en bitácora
    DataService.registrarBitacora({
      modulo: 'Ventas',
      accion: 'Venta Registrada',
      detalle: `Venta Folio ${ultimoFolioVenta || 'N/A'} por ${formatCurrency(ventaTotal)} a ${cliente.nombre}`,
      usuario: user?.nombre || 'Miguel',
    }).catch(() => {});
  }, [clienteActivoId]);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketImgUrl, setTicketImgUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Folio de la venta real o respaldo simulado
  const folioVenta = ultimoFolioVenta || 'FOL-20261011-001';
  const fechaHora = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const pagoCredito = pagos.find((p) => p.metodo === 'Crédito')?.monto || 0;
  const nuevoSaldo = cliente.saldo + pagoCredito;

  // Construir datos estructurados del ticket (con detección correcta de productos por kilo)
  const ticketData = {
    folio: folioVenta,
    fecha: fechaHora,
    clienteNombre: cliente.nombre,
    clientePropietario: cliente.propietario,
    clienteDireccion: cliente.direccion,
    vendedorNombre: user?.nombre || 'Miguel',
    rutaNombre: cliente.ruta || 'Ruta Lunes',
    items: carrito.map((item) => {
      const isWeight = Boolean(
        item.producto.precioPorPeso ||
        item.producto.unidad === 'kg' ||
        item.unidad === 'kg' ||
        ['jamón', 'jamon', 'salchicha', 'chorizo', 'quesos', 'queso', 'carnes frías', 'carnes frias'].includes(
          (item.producto.categoria || '').toLowerCase()
        )
      );
      const unitLabel = isWeight ? 'kg' : (item.presentacion?.tipo || item.producto.unidad || 'pza');
      return {
        nombre: item.producto.nombre,
        presentacion: unitLabel,
        isWeight,
        cantidad: item.cantidad,
        piezasTotales: item.piezasTotales,
        precioUnitario: item.precioFinal,
        subtotal: item.subtotal,
      };
    }),
    subtotal: ventaTotal,
    descuento: 0,
    total: ventaTotal,
    pagos: pagos.map((p) => ({ metodo: p.metodo, monto: p.monto })),
    saldoAnterior: cliente.saldo,
    pagoCredito,
    nuevoSaldo,
    clienteTelefono: cliente.telefono,
  };

  // Generar imagen del ticket inmediatamente
  useEffect(() => {
    try {
      const url = ticketImageService.generateDataUrl(ticketData);
      if (url) {
        setTicketImgUrl(url);
      }
    } catch (err) {
      console.warn('Error generating ticket image preview:', err);
    }
  }, [folioVenta, ventaTotal, carrito.length]);

  const ticketText58 = ticketPrinter.generateVentaText(ticketData, 58);
  const ticketText80 = ticketPrinter.generateVentaText(ticketData, 80);

  // Compartir ticket como IMAGEN (vía Web Share API para adjuntar en WhatsApp)
  const handleShareImageWhatsApp = async () => {
    try {
      const res = await ticketImageService.shareTicketAsImage(ticketData, cliente.telefono);
      if (res.method === 'download-and-whatsapp') {
        Alert.alert(
          'Imagen descargada',
          'El comprobante en imagen se ha guardado en tus descargas / fotos y se abrió WhatsApp para que lo adjuntes.'
        );
      }
    } catch {
      await ticketPrinter.shareTicketWhatsAppText(ticketData, cliente.telefono);
    }
  };

  // Descargar archivo PNG a la galería/descargas
  const handleDownloadImage = async () => {
    const success = await ticketImageService.downloadImage(ticketData);
    if (success) {
      Alert.alert('Descargado', `El comprobante Ticket_${ticketData.folio}.png se guardó en tu dispositivo.`);
    }
  };

  // Copiar imagen al portapapeles
  const handleCopyImage = async () => {
    const success = await ticketImageService.copyImageToClipboard(ticketData);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      Alert.alert('Copiado', 'La imagen del ticket ha sido copiada al portapapeles.');
    } else {
      Alert.alert('Aviso', 'Puedes descargar la imagen directamente con el botón "Descargar PNG".');
    }
  };

  const handlePrintPdf = () => {
    ticketPrinter.openPdfPrintTicket(ticketData);
  };

  const handleNuevaVenta = () => {
    clearCarrito();
    setClienteActivoId(null);
    router.replace('/(tabs)/venta');
  };

  const handleIrInicio = () => {
    clearCarrito();
    setClienteActivoId(null);
    router.replace('/(tabs)');
  };

  return (
    <AppShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ícono de Éxito y Título */}
        <View style={styles.successHeader}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color={colors.success[600]} strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>✓ Venta registrada</Text>
          <Text style={styles.successSubtitle}>Folio: #{folioVenta}</Text>
          <Text style={styles.dateText}>{fechaHora}</Text>
        </View>

        {/* Resumen Financiero de la Venta */}
        <View style={[styles.mainCard, shadows.card]}>
          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <User size={16} color={colors.primary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{cliente.nombre}</Text>
              <Text style={styles.clientOwner}>{cliente.propietario} · {cliente.direccion}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Total de la venta</Text>
            <MoneyDisplay amount={ventaTotal} size="xl" color={colors.primary[700]} />
          </View>

          {/* Desglose de Métodos de Pago */}
          <View style={styles.pagosSection}>
            <Text style={styles.sectionSubtitle}>Desglose de pago recibido:</Text>
            {pagos.map((p, i) => (
              <View key={i} style={styles.pagoItem}>
                <Text style={styles.pagoMethodName}>{p.metodo}</Text>
                <MoneyDisplay amount={p.monto} size="sm" color={colors.neutral[800]} />
              </View>
            ))}
          </View>

          {/* Impacto en Saldo del Cliente si hubo crédito */}
          {pagoCredito > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.saldoRow}>
                <View>
                  <Text style={styles.saldoLabel}>Crédito en esta venta</Text>
                  <MoneyDisplay amount={pagoCredito} size="sm" color={colors.warning[700]} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.saldoLabel}>Nuevo saldo del cliente</Text>
                  <MoneyDisplay amount={nuevoSaldo} size="sm" color={colors.error[600]} />
                </View>
              </View>
            </>
          )}
        </View>

        {/* ========================================================= */}
        {/* BOTONES PRINCIPALES DE ACCIÓN                            */}
        {/* ========================================================= */}
        <View style={styles.primaryActionsContainer}>
          {/* Acción Principal: COMPARTIR COMPROBANTE */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleShareImageWhatsApp}
            style={[styles.btnCompartirHero, shadows.card]}
            accessibilityLabel="Compartir comprobante de venta"
          >
            <Share2 size={22} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.btnCompartirHeroText}>Compartir comprobante</Text>
          </TouchableOpacity>

          {/* Acción Secundaria: NUEVA VENTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNuevaVenta}
            style={[styles.btnNuevaVenta, shadows.card]}
            accessibilityLabel="Iniciar una nueva venta"
          >
            <ShoppingBag size={20} color={colors.neutral[800]} strokeWidth={2.2} />
            <Text style={styles.btnNuevaVentaText}>Nueva venta</Text>
          </TouchableOpacity>

          {/* Accesos Discretos: Ver comprobante / Descargar / Ir al Inicio */}
          <View style={styles.discreteLinksRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowTicketModal(true)}
              style={styles.discreteLink}
            >
              <FileText size={15} color={colors.primary[700]} />
              <Text style={styles.discreteLinkText}>Ver comprobante</Text>
            </TouchableOpacity>

            <Text style={styles.discreteLinkDivider}>·</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDownloadImage}
              style={styles.discreteLink}
            >
              <Download size={15} color={colors.primary[700]} />
              <Text style={styles.discreteLinkText}>Guardar imagen</Text>
            </TouchableOpacity>

            <Text style={styles.discreteLinkDivider}>·</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIrInicio}
              style={styles.discreteLink}
            >
              <Home size={15} color={colors.neutral[600]} />
              <Text style={[styles.discreteLinkText, { color: colors.neutral[600] }]}>Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de Ticket Térmico Completo */}
        <TicketModal
          visible={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Comprobante de Venta"
          ticketText58={ticketText58}
          ticketText80={ticketText80}
          onShareWhatsApp={handleShareImageWhatsApp}
          onPrintPdf={handlePrintPdf}
        />
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    marginVertical: 14,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.success[100],
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[700],
    marginTop: 2,
  },
  dateText: {
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 2,
  },
  mainCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 16,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  clientOwner: {
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 12,
  },
  amountBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pagosSection: {
    marginTop: 8,
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 10,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[600],
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pagoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  pagoMethodName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saldoLabel: {
    fontSize: 10.5,
    color: colors.neutral[500],
    marginBottom: 2,
  },

  /* Acciones Principales */
  primaryActionsContainer: {
    gap: 10,
  },
  btnCompartirHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary[600],
    borderRadius: 14,
    paddingVertical: 15,
  },
  btnCompartirHeroText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  btnNuevaVenta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  btnNuevaVentaText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  discreteLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  discreteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  discreteLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary[700],
  },
  discreteLinkDivider: {
    color: colors.neutral[300],
    fontSize: 14,
  },
});

