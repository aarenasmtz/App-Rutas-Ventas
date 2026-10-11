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
import { mockClientes } from '@/services/mockDataService';
import { AppShell, MoneyDisplay } from '@/components/DesignSystem';
import { formatCurrency } from '@/utils/helpers';
import { ticketPrinter } from '@/services/ticketPrinterService';
import { ticketImageService } from '@/services/ticketImageService';
import TicketModal from '@/components/TicketModal';

export default function ConfirmacionScreen() {
  const router = useRouter();
  const {
    ventaTotal,
    pagos,
    carrito,
    clearCarrito,
    clienteActivoId,
    ultimoFolioVenta,
  } = useApp();

  const cliente = mockClientes.find((c) => c.id === clienteActivoId) || mockClientes[0];
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
    vendedorNombre: 'Miguel',
    rutaNombre: cliente.ruta || 'Ruta Centro',
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
    router.replace('/(tabs)/venta');
  };

  const handleIrInicio = () => {
    clearCarrito();
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
        {/* TARJETA DE COMPROBANTE EN IMAGEN (PNG)                     */}
        {/* ========================================================= */}
        <View style={[styles.ticketImageCard, shadows.card]}>
          <View style={styles.ticketImageHeader}>
            <View style={styles.ticketBadge}>
              <ImageIcon size={14} color={colors.primary[700]} />
              <Text style={styles.ticketBadgeText}>COMPROBANTE EN IMAGEN</Text>
            </View>
            <Text style={styles.ticketImageSub}>
              Listo para enviar por WhatsApp o guardar en fotos
            </Text>
          </View>

          {/* Vista previa gráfica del ticket */}
          {ticketImgUrl ? (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: ticketImgUrl }}
                style={styles.renderedImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.loadingImageBox}>
              <Text style={styles.loadingImageText}>Generando comprobante en imagen...</Text>
            </View>
          )}

          {/* Botones de acción del comprobante en imagen */}
          <View style={styles.imageActionsWrap}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleShareImageWhatsApp}
              style={styles.btnShareWhatsAppImage}
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.btnShareWhatsAppImageText}>
                Compartir Imagen por WhatsApp
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryImageRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDownloadImage}
                style={styles.btnSecondaryImage}
              >
                <Download size={16} color={colors.primary[700]} />
                <Text style={styles.btnSecondaryImageText}>Descargar PNG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCopyImage}
                style={styles.btnSecondaryImage}
              >
                {isCopied ? (
                  <>
                    <Check size={16} color={colors.success[600]} />
                    <Text style={[styles.btnSecondaryImageText, { color: colors.success[600] }]}>
                      ¡Copiado!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color={colors.neutral[700]} />
                    <Text style={styles.btnSecondaryImageText}>Copiar Imagen</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Acciones complementarias */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePrintPdf}
            style={styles.btnPdf}
          >
            <FileText size={18} color={colors.primary[700]} />
            <Text style={styles.btnPdfText}>Imprimir / Guardar en PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNuevaVenta}
            style={styles.btnPrimary}
          >
            <ShoppingBag size={20} color={colors.neutral[0]} />
            <Text style={styles.btnPrimaryText}>Nueva venta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowTicketModal(true)}
            style={styles.btnSecondary}
          >
            <Printer size={18} color={colors.neutral[700]} />
            <Text style={styles.btnSecondaryText}>Ver ticket térmico digital (ESC/POS)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleIrInicio}
            style={styles.btnTertiary}
          >
            <Home size={18} color={colors.neutral[600]} />
            <Text style={styles.btnTertiaryText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE TICKET TÉRMICO (58mm / 80mm) */}
      <TicketModal
        visible={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Ticket de Venta en Ruta"
        ticketText58={ticketText58}
        ticketText80={ticketText80}
        onShareWhatsApp={handleShareImageWhatsApp}
        onPrintPdf={handlePrintPdf}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  successSubtitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    marginTop: 2,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
  mainCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    marginBottom: spacing.lg,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  clientOwner: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.md,
  },
  amountBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  amountLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pagosSection: {
    marginTop: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  pagoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagoMethodName: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
    fontWeight: fontWeight.medium,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saldoLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  ticketImageCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[100],
    marginBottom: spacing.lg,
  },
  ticketImageHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  ticketBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
    letterSpacing: 0.5,
  },
  ticketImageSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 6,
  },
  imagePreviewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  renderedImage: {
    width: '100%',
    height: 420,
    borderRadius: radius.lg,
  },
  loadingImageBox: {
    height: 200,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  loadingImageText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  imageActionsWrap: {
    gap: spacing.sm,
  },
  btnShareWhatsAppImage: {
    backgroundColor: '#25D366',
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnShareWhatsAppImageText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondaryImageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnSecondaryImage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
  },
  btnSecondaryImageText: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
  },
  actionsContainer: {
    marginHorizontal: spacing.md,
    gap: spacing.sm + 2,
  },
  btnPdf: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
  },
  btnPdfText: {
    color: colors.primary[700],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnPrimary: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnPrimaryText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnSecondary: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnSecondaryText: {
    color: colors.neutral[700],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  btnTertiary: {
    backgroundColor: 'transparent',
    borderRadius: radius.xl,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnTertiaryText: {
    color: colors.neutral[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
