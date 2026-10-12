import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ClipboardCheck,
  Check,
  AlertTriangle,
  Plus,
  Minus,
  MessageSquare,
  Package,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { mockRevisionItems, DataService } from '@/services/mockDataService';
import { AppShell, PageHeader } from '@/components/DesignSystem';
import type { RevisionItem } from '@/types';

export default function RevisionInventarioScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const liveItems = await DataService.getRevisionItems();
        setItems(liveItems ?? []);
      } catch {
        // Fallback to initial
      }
    };
    fetchItems();
  }, []);

  const revisadosCount = items.filter((i) => i.revisado).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((revisadosCount / totalCount) * 100) : 0;

  const correctos = items.filter((i) => i.revisado && i.diferencia === 0).length;
  const faltantes = items.filter((i) => i.revisado && i.diferencia < 0).length;
  const sobrantes = items.filter((i) => i.revisado && i.diferencia > 0).length;

  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);

  const getHoraActualFormateada = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const toggleRevisado = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const nextRevisado = !updated[index].revisado;
      updated[index] = {
        ...updated[index],
        revisado: nextRevisado,
        fechaRevision: nextRevisado ? getHoraActualFormateada() : undefined,
        revisadoPor: nextRevisado ? 'Miguel' : undefined,
      };
      return updated;
    });
  };

  const handleConfirmarCuadrado = async (index: number) => {
    setCheckingIndex(index);
    // Simulación de respuesta inmediata con feedback visual de guardado
    await new Promise((resolve) => setTimeout(resolve, 350));
    setItems((prev) => {
      const updated = [...prev];
      const sis = updated[index].sistema;
      updated[index] = {
        ...updated[index],
        fisico: sis,
        diferencia: 0,
        revisado: true,
        fechaRevision: getHoraActualFormateada(),
        revisadoPor: 'Miguel',
      };
      return updated;
    });
    setCheckingIndex(null);
  };

  const updateFisico = (index: number, newFisico: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const sistema = updated[index].sistema;
      updated[index] = {
        ...updated[index],
        fisico: newFisico,
        diferencia: newFisico - sistema,
        revisado: true,
        fechaRevision: getHoraActualFormateada(),
        revisadoPor: 'Miguel',
      };
      return updated;
    });
  };

  const updateComentario = (index: number, comentario: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        comentario,
      };
      return updated;
    });
  };

  const handleFinalizarRevision = async () => {
    const todosRevisados = items.filter((i) => i.revisado);

    if (todosRevisados.length === 0) {
      Alert.alert(
        'Sin Productos Revisados',
        'Por favor verifica al menos un producto antes de guardar la auditoría.'
      );
      return;
    }

    const ajustes = todosRevisados.map((i) => ({
      productoId: i.productoId,
      cantidadSistema: i.sistema,
      cantidadFisica: i.fisico,
      diferencia: i.diferencia,
      motivo: i.comentario || (i.diferencia === 0 ? 'Físico verificado y cuadrado' : (i.diferencia < 0 ? 'Faltante en ruta' : 'Sobrante en ruta')),
    }));

    setGuardando(true);
    try {
      await DataService.autorizarRevision({
        empleadoId: 'USR001',
        fechaRevision: new Date().toISOString(),
        ajustes,
      });

      // Recargar datos actualizados
      const refreshed = await DataService.getRevisionItems();
      if (refreshed && refreshed.length > 0) {
        // Preservar timestamps de bitácora local
        const hora = getHoraActualFormateada();
        setItems(refreshed.map(r => ({
          ...r,
          fechaRevision: r.revisado ? (r.fechaRevision || hora) : undefined,
          revisadoPor: r.revisado ? (r.revisadoPor || 'Miguel') : undefined,
        })));
      }
      await DataService.getProductos();

      const conDiferencia = ajustes.filter((a) => a.diferencia !== 0).length;
      const mensaje = conDiferencia > 0
        ? `Se auditaron ${ajustes.length} productos. Se aplicaron ${conDiferencia} ajustes en existencias en SQL Server.`
        : `¡Auditoría 100% Cuadrada! Se verificaron ${ajustes.length} productos sin ningún faltante ni sobrante. Bitácora guardada exitosamente.`;

      Alert.alert('Auditoría Guardada', mensaje, [
        { text: 'Permanecer aquí' },
        { text: 'Volver al Menú Más', onPress: () => router.replace('/(tabs)/mas') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la auditoría');
    } finally {
      setGuardando(false);
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
        title="Revisión Rápida de Inventario"
        subtitle="Auditoría física vs sistema"
        onBack={handleBack}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Barra de Progreso: X / Y revisados */}
        <View style={[styles.progressCard, shadows.card]}>
          <View style={styles.progressTop}>
            <View style={styles.progressTitleRow}>
              <ClipboardCheck size={20} color={colors.primary[600]} />
              <Text style={styles.progressTitle}>Progreso de revisión</Text>
            </View>
            <Text style={styles.progressFraction}>
              {revisadosCount} / {totalCount} revisados ({progressPct}%)
            </Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Resumen de Hallazgos */}
          <View style={styles.findingsRow}>
            <View style={styles.findingItem}>
              <View style={[styles.dot, { backgroundColor: colors.success[500] }]} />
              <Text style={styles.findingText}>Correctos: <Text style={{ fontWeight: 'bold' }}>{correctos}</Text></Text>
            </View>

            <View style={styles.findingItem}>
              <View style={[styles.dot, { backgroundColor: colors.error[500] }]} />
              <Text style={styles.findingText}>Faltantes: <Text style={{ fontWeight: 'bold', color: colors.error[600] }}>{faltantes}</Text></Text>
            </View>

            <View style={styles.findingItem}>
              <View style={[styles.dot, { backgroundColor: colors.warning[500] }]} />
              <Text style={styles.findingText}>Sobrantes: <Text style={{ fontWeight: 'bold', color: colors.warning[600] }}>{sobrantes}</Text></Text>
            </View>
          </View>
        </View>

        {/* Lista de productos a auditar */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeading}>Productos en ruta para verificar:</Text>

          {items.map((item, index) => {
            const hasDiff = item.diferencia !== 0;

            return (
              <View
                key={item.productoId}
                style={[
                  styles.itemCard,
                  shadows.card,
                  item.revisado && styles.itemCardRevisado,
                  hasDiff && styles.itemCardDiff,
                ]}
              >
                {/* Cabecera del item con Checkbox */}
                <View style={styles.itemTop}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleRevisado(index)}
                    style={[styles.checkbox, item.revisado && styles.checkboxChecked]}
                  >
                    {item.revisado && <Check size={16} color={colors.neutral[0]} strokeWidth={3} />}
                  </TouchableOpacity>

                  <View style={styles.itemDetails}>
                    {item.marca && <Text style={styles.itemBrand}>{item.marca}</Text>}
                    <Text style={styles.itemName}>{item.productoNombre}</Text>
                  </View>
                </View>

                {/* Comparación Sistema vs Físico */}
                <View style={styles.quantitiesRow}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyLabel}>Sistema</Text>
                    <Text style={styles.qtyValue}>{item.sistema} {item.unidad}</Text>
                  </View>

                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyLabel}>Físico contado</Text>
                    <View style={styles.stepperMini}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => updateFisico(index, Math.max(0, item.fisico - 1))}
                        style={styles.stepBtn}
                      >
                        <Minus size={14} color={colors.neutral[700]} />
                      </TouchableOpacity>
                      <Text style={styles.stepperText}>{item.fisico}</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => updateFisico(index, item.fisico + 1)}
                        style={[styles.stepBtn, styles.stepBtnPlus]}
                      >
                        <Plus size={14} color={colors.neutral[0]} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyLabel}>Diferencia</Text>
                    <Text
                      style={[
                        styles.diffText,
                        item.diferencia === 0
                          ? styles.diffOk
                          : item.diferencia < 0
                          ? styles.diffNeg
                          : styles.diffPos,
                      ]}
                    >
                      {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia} {item.unidad}
                    </Text>
                  </View>
                </View>

                {/* Bitácora de Auditoría en la misma Card */}
                {item.revisado ? (
                  <View style={styles.bitacoraBadge}>
                    <CheckCircle2 size={13} color="#15803d" />
                    <Text style={styles.bitacoraBadgeText}>
                      ✓ Auditado hoy a las {item.fechaRevision || '5:00 PM'} por {item.revisadoPor || 'Miguel'} · {item.diferencia === 0 ? 'Cuadrado (0 faltante)' : `Dif: ${item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia} ${item.unidad}`}
                    </Text>
                  </View>
                ) : item.diferencia === 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleConfirmarCuadrado(index)}
                    disabled={checkingIndex === index}
                    style={styles.quickCuadrarBtn}
                  >
                    {checkingIndex === index ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : (
                      <>
                        <Check size={14} color="#16a34a" strokeWidth={2.5} />
                        <Text style={styles.quickCuadrarBtnText}>✓ Confirmar Cuadrado (0 Dif)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}

                {/* Campo de comentario/justificación */}
                <View style={styles.commentWrap}>
                  <MessageSquare size={14} color={colors.neutral[400]} />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Agregar nota o justificación (ej. Faltan dos piezas)..."
                    placeholderTextColor={colors.neutral[400]}
                    value={item.comentario}
                    onChangeText={(txt) => updateComentario(index, txt)}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Botón de cierre de revisión */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={guardando}
            onPress={handleFinalizarRevision}
            style={[styles.finishBtn, guardando && { opacity: 0.65 }]}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.neutral[0]} />
            ) : (
              <>
                <CheckCircle2 size={20} color={colors.neutral[0]} />
                <Text style={styles.finishBtnText}>Guardar y Autorizar Ajustes</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            * Los ajustes con diferencias impactan directamente el kardex e inventario en SQL Server.
          </Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  progressCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  progressFraction: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  progressBarBg: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: radius.full,
  },
  findingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  findingText: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  listSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  itemCardRevisado: {
    borderColor: colors.primary[300],
    backgroundColor: '#fafcff',
  },
  itemCardDiff: {
    borderColor: colors.error[100],
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  itemDetails: {
    flex: 1,
  },
  itemBrand: {
    fontSize: fontSize.xs - 1,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  quantitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  qtyBox: {
    alignItems: 'center',
  },
  qtyLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  qtyValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    padding: 2,
    gap: 4,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPlus: {
    backgroundColor: colors.primary[600],
  },
  stepperText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    minWidth: 16,
    textAlign: 'center',
  },
  diffText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  diffOk: {
    color: colors.success[600],
  },
  diffNeg: {
    color: colors.error[600],
  },
  diffPos: {
    color: colors.warning[600],
  },
  commentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.neutral[800],
    padding: 0,
  },
  footerSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  finishBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  finishBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  footerNote: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 16,
  },
  bitacoraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  bitacoraBadgeText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
  quickCuadrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.2,
    borderColor: '#86efac',
    borderRadius: radius.md,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  quickCuadrarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
});
