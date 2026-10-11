import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Printer, Copy, Check, X, Share2, Receipt } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { ticketPrinter } from '@/services/ticketPrinterService';

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  ticketText58: string;
  ticketText80?: string;
  onShareWhatsApp?: () => void;
  onPrintPdf?: () => void;
}

export default function TicketModal({
  visible,
  onClose,
  title = 'Comprobante Térmico',
  ticketText58,
  ticketText80,
  onShareWhatsApp,
  onPrintPdf,
}: TicketModalProps) {
  const [paperWidth, setPaperWidth] = useState<58 | 80>(58);
  const [copied, setCopied] = useState(false);

  const activeText = paperWidth === 80 && ticketText80 ? ticketText80 : ticketText58;

  const handlePrint = () => {
    if (onPrintPdf) {
      onPrintPdf();
      return;
    }
    const success = ticketPrinter.printTicketWeb(activeText, title, paperWidth);
    if (!success && Platform.OS !== 'web') {
      Alert.alert(
        'Modo Portátil',
        'En dispositivos móviles puedes conectar tu impresora Bluetooth térmica o compartir el texto ESC/POS.'
      );
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      Alert.alert('Copiado', 'Texto del ticket listo para enviar.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, shadows.floating]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Receipt size={18} color={colors.primary[600]} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {/* Selector de Ancho de Papel */}
          <View style={styles.widthSelector}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaperWidth(58)}
              style={[styles.widthBtn, paperWidth === 58 && styles.widthBtnActive]}
            >
              <Text style={[styles.widthText, paperWidth === 58 && styles.widthTextActive]}>
                58 mm (Portátil)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaperWidth(80)}
              style={[styles.widthBtn, paperWidth === 80 && styles.widthBtnActive]}
            >
              <Text style={[styles.widthText, paperWidth === 80 && styles.widthTextActive]}>
                80 mm (Mostrador)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vista Previa del Papel Térmico */}
          <View style={styles.paperContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.paperScroll}
            >
              <Text
                style={[
                  styles.thermalText,
                  paperWidth === 80 && { fontSize: 13, letterSpacing: -0.2 },
                ]}
              >
                {activeText}
              </Text>
            </ScrollView>
          </View>

          {/* Botones de Acción */}
          <View style={styles.footer}>
            {onShareWhatsApp && (
              <TouchableOpacity activeOpacity={0.85} onPress={onShareWhatsApp} style={styles.whatsAppBtn}>
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.whatsAppBtnText}>Compartir por WhatsApp</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.85} onPress={handlePrint} style={styles.printBtn}>
              <Printer size={18} color={colors.neutral[0]} />
              <Text style={styles.printBtnText}>Imprimir / Guardar PDF</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleCopy} style={styles.copyBtn}>
                {copied ? (
                  <Check size={16} color={colors.success[600]} />
                ) : (
                  <Copy size={16} color={colors.neutral[600]} />
                )}
                <Text style={styles.copyBtnText}>{copied ? '¡Copiado!' : 'Copiar Texto'}</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xxl,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.full,
  },
  widthSelector: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.sm,
  },
  widthBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  widthBtnActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.card,
  },
  widthText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral[600],
  },
  widthTextActive: {
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  paperContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E8E3DC',
    padding: spacing.sm,
    maxHeight: 380,
  },
  paperScroll: {
    paddingVertical: spacing.xs,
  },
  thermalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 15,
    color: '#1C1917',
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#25D366',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  whatsAppBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  printBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
  },
  copyBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  cancelBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[500],
  },
});
