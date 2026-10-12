import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Banknote, Smartphone, Check, Printer, Search, ArrowLeft, User, DollarSign } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { ScreenHeader } from '@/components/shared';
import { formatCurrency } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import { DataService, mockClientes } from '@/services/mockDataService';
import { ticketPrinter } from '@/services/ticketPrinterService';
import TicketModal from '@/components/TicketModal';
import type { Cliente } from '@/types';

type FiltroTab = 'saldo' | 'todos';

export default function CobranzaScreen() {
  const router = useRouter();
  const { user, clienteActivoId } = useApp();
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(clienteActivoId || null);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [abonoRegistrado, setAbonoRegistrado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFiltro, setTabFiltro] = useState<FiltroTab>('saldo');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/mas');
    }
  };

  const loadClientes = async () => {
    try {
      const todos = await DataService.getClientes();
      setClientesList(todos ?? []);
    } catch {
      setClientesList([]);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const cliente = useMemo(() => {
    return clientesList.find((c) => c.id === clienteId) || null;
  }, [clientesList, clienteId]);

  const filteredClientes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clientesList.filter((c) => {
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.propietario && c.propietario.toLowerCase().includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (tabFiltro === 'saldo') {
        return c.saldo > 0;
      }
      return true;
    });
  }, [clientesList, search, tabFiltro]);

  const montoNum = parseFloat(monto) || 0;
  const saldoPrevio = cliente ? cliente.saldo : 0;
  const nuevoSaldo = Math.max(0, saldoPrevio - montoNum);

  const handleRegistrar = async () => {
    if (!cliente) {
      Alert.alert('Selecciona un cliente', 'Por favor selecciona un cliente para aplicar el abono.');
      return;
    }
    if (montoNum <= 0) {
      Alert.alert('Monto inválido', 'Ingresa una cantidad mayor a 0 para abonar.');
      return;
    }

    setLoading(true);
    try {
      await DataService.registrarAbono({
        clienteId: cliente.id,
        monto: montoNum,
        metodoPago: metodo,
        comentario: 'Abono registrado en ruta',
        empleadoId: user?.id || '1',
      });

      // Actualizar localmente el saldo del cliente
      setClientesList((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, saldo: nuevoSaldo } : c))
      );

      setAbonoRegistrado(true);
      await loadClientes();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setClienteId(null);
    setMonto('');
    setAbonoRegistrado(false);
  };

  if (abonoRegistrado && cliente) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Cobranza" onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.confirmContent}>
          <View style={styles.successIcon}>
            <Check size={48} color={colors.success[600]} strokeWidth={3} />
          </View>
          <Text style={styles.confirmTitle}>¡Abono registrado!</Text>
          <Text style={styles.confirmClient}>{cliente.nombre}</Text>
          {cliente.propietario ? <Text style={styles.confirmOwner}>{cliente.propietario}</Text> : null}

          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Abono aplicado</Text>
              <Text style={[styles.confirmValue, { color: colors.success[700], fontWeight: 'bold' }]}>
                {formatCurrency(montoNum)}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Método de pago</Text>
              <Text style={styles.confirmValue}>{metodo}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Saldo anterior</Text>
              <Text style={styles.confirmValue}>{formatCurrency(saldoPrevio)}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.confirmLabelNuevo}>Nuevo saldo</Text>
              <Text
                style={[
                  styles.confirmValueNuevo,
                  { color: nuevoSaldo > 0 ? colors.warning[600] : colors.success[600] },
                ]}
              >
                {formatCurrency(nuevoSaldo)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor: colors.neutral[0],
                borderWidth: 1.5,
                borderColor: colors.primary[500],
                marginBottom: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              },
            ]}
            onPress={() => setShowTicketModal(true)}
          >
            <Printer size={18} color={colors.primary[600]} />
            <Text style={[styles.confirmBtnText, { color: colors.primary[700] }]}>Imprimir Recibo Térmico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleReset}>
            <Text style={styles.confirmBtnText}>Registrar otro abono</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.neutral[200], marginTop: spacing.sm }]}
            onPress={() => router.replace('/(tabs)/mas')}
          >
            <Text style={[styles.confirmBtnText, { color: colors.neutral[800] }]}>Volver al Menú Más</Text>
          </TouchableOpacity>
        </ScrollView>

        <TicketModal
          visible={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Recibo de Cobranza"
          ticketText58={ticketPrinter.generateCobranzaText(
            {
              folio: `REC-${Date.now().toString().slice(-6)}`,
              fecha: new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              clienteNombre: cliente.nombre,
              clientePropietario: cliente.propietario,
              vendedorNombre: user?.nombre || 'Miguel',
              montoAbonado: montoNum,
              metodoPago: metodo,
              saldoAnterior: saldoPrevio,
              nuevoSaldo: nuevoSaldo,
            },
            58
          )}
          ticketText80={ticketPrinter.generateCobranzaText(
            {
              folio: `REC-${Date.now().toString().slice(-6)}`,
              fecha: new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              clienteNombre: cliente.nombre,
              clientePropietario: cliente.propietario,
              vendedorNombre: user?.nombre || 'Miguel',
              montoAbonado: montoNum,
              metodoPago: metodo,
              saldoAnterior: saldoPrevio,
              nuevoSaldo: nuevoSaldo,
            },
            80
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Cobranza en Ruta" subtitle="Registrar abono de cliente" onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Filtros y buscador de clientes */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente, dueño o dirección..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tabFiltro === 'saldo' && styles.tabBtnActive]}
            onPress={() => setTabFiltro('saldo')}
          >
            <Text style={[styles.tabText, tabFiltro === 'saldo' && styles.tabTextActive]}>
              Con saldo ({clientesList.filter((c) => c.saldo > 0).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tabFiltro === 'todos' && styles.tabBtnActive]}
            onPress={() => setTabFiltro('todos')}
          >
            <Text style={[styles.tabText, tabFiltro === 'todos' && styles.tabTextActive]}>
              Todos los clientes ({clientesList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de selección de clientes */}
        <Text style={styles.sectionLabel}>
          {tabFiltro === 'saldo' ? 'Clientes con saldo pendiente:' : 'Selecciona cliente:'}
        </Text>

        {filteredClientes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {tabFiltro === 'saldo'
                ? 'No hay clientes con saldo pendiente en este momento.'
                : 'No se encontraron clientes con el criterio de búsqueda.'}
            </Text>
            {tabFiltro === 'saldo' && (
              <TouchableOpacity onPress={() => setTabFiltro('todos')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Ver todos los clientes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredClientes.map((c) => {
            const isSelected = clienteId === c.id;
            const hasSaldo = c.saldo > 0;
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.7}
                onPress={() => {
                  setClienteId(c.id);
                  if (c.saldo > 0 && !monto) {
                    setMonto(c.saldo.toString());
                  }
                }}
              >
                <View style={[styles.clientCard, isSelected && styles.clientCardActive]}>
                  <View style={styles.clientAvatar}>
                    <User size={20} color={isSelected ? colors.primary[700] : colors.neutral[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientName, isSelected && styles.clientNameActive]}>{c.nombre}</Text>
                    <Text style={styles.clientOwner}>{c.propietario || c.direccion}</Text>
                  </View>
                  <View style={styles.saldoCol}>
                    <Text style={[styles.clientSaldo, { color: hasSaldo ? colors.error[600] : colors.success[600] }]}>
                      {formatCurrency(c.saldo)}
                    </Text>
                    <Text style={styles.saldoStatus}>{hasSaldo ? 'Pendiente' : 'Al día'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Formulario de abono para el cliente seleccionado */}
        {cliente && (
          <View style={styles.formContainer}>
            <View style={styles.selectedBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedBannerTitle}>Cliente seleccionado:</Text>
                <Text style={styles.selectedBannerName}>{cliente.nombre}</Text>
              </View>
              <View style={styles.selectedSaldoBox}>
                <Text style={styles.selectedSaldoLabel}>Saldo actual</Text>
                <Text
                  style={[
                    styles.selectedSaldoValue,
                    { color: cliente.saldo > 0 ? colors.error[600] : colors.success[600] },
                  ]}
                >
                  {formatCurrency(cliente.saldo)}
                </Text>
              </View>
            </View>

            {/* Accesos rápidos de monto */}
            {cliente.saldo > 0 && (
              <View style={styles.quickMontosRow}>
                <TouchableOpacity
                  style={styles.quickMontoChip}
                  onPress={() => setMonto(cliente.saldo.toString())}
                >
                  <Text style={styles.quickMontoChipText}>Liquidar: {formatCurrency(cliente.saldo)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickMontoChip}
                  onPress={() => setMonto(Math.round(cliente.saldo / 2).toString())}
                >
                  <Text style={styles.quickMontoChipText}>50%: {formatCurrency(Math.round(cliente.saldo / 2))}</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionLabel}>Monto a abonar</Text>
            <View style={styles.montoInputWrap}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0.00"
                placeholderTextColor={colors.neutral[300]}
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.sectionLabel}>Método de pago</Text>
            <View style={styles.metodosRow}>
              <TouchableOpacity
                style={[styles.metodoBtn, metodo === 'Efectivo' && styles.metodoBtnActive]}
                onPress={() => setMetodo('Efectivo')}
              >
                <Banknote size={20} color={metodo === 'Efectivo' ? colors.neutral[0] : colors.neutral[600]} />
                <Text style={[styles.metodoText, metodo === 'Efectivo' && styles.metodoTextActive]}>Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metodoBtn, metodo === 'Transferencia' && styles.metodoBtnActive]}
                onPress={() => setMetodo('Transferencia')}
              >
                <Smartphone size={20} color={metodo === 'Transferencia' ? colors.neutral[0] : colors.neutral[600]} />
                <Text style={[styles.metodoText, metodo === 'Transferencia' && styles.metodoTextActive]}>
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            {montoNum > 0 && (
              <View style={styles.nuevoSaldoCard}>
                <Text style={styles.nuevoSaldoLabel}>Nuevo saldo estimado</Text>
                <Text
                  style={[
                    styles.nuevoSaldoValue,
                    { color: nuevoSaldo > 0 ? colors.warning[600] : colors.success[600] },
                  ]}
                >
                  {formatCurrency(nuevoSaldo)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registrarBtn, loading && { opacity: 0.7 }]}
              disabled={loading || montoNum <= 0}
              onPress={handleRegistrar}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.neutral[0]} />
              ) : (
                <Text style={styles.registrarBtnText}>Registrar Abono de {formatCurrency(montoNum || 0)}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.neutral[900],
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  tabTextActive: {
    color: colors.neutral[0],
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[700],
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: radius.sm,
  },
  emptyBtnText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
    fontWeight: fontWeight.bold,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    gap: spacing.sm,
    ...shadows.card,
  },
  clientCardActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  clientNameActive: {
    color: colors.primary[800],
  },
  clientOwner: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  saldoCol: {
    alignItems: 'flex-end',
  },
  clientSaldo: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  saldoStatus: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  formContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.neutral[0],
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    ...shadows.card,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  selectedBannerTitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  selectedBannerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  selectedSaldoBox: {
    alignItems: 'flex-end',
  },
  selectedSaldoLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  selectedSaldoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  quickMontosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickMontoChip: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quickMontoChipText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  montoInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  currencySymbol: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[500],
    marginRight: spacing.xs,
  },
  montoInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  metodosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metodoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  metodoBtnActive: {
    backgroundColor: colors.primary[600],
  },
  metodoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  metodoTextActive: {
    color: colors.neutral[0],
  },
  nuevoSaldoCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  nuevoSaldoLabel: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  nuevoSaldoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  registrarBtn: {
    backgroundColor: colors.success[600],
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  registrarBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  confirmContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  confirmClient: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[800],
    marginTop: spacing.xs,
  },
  confirmOwner: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
  },
  confirmCard: {
    backgroundColor: colors.neutral[0],
    width: '100%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  confirmLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  confirmValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  confirmLabelNuevo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  confirmValueNuevo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  confirmBtn: {
    backgroundColor: colors.primary[600],
    width: '100%',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
