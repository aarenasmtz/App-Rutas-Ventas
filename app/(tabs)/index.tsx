import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShoppingBag,
  TrendingUp,
  Wallet,
  CreditCard,
  LogOut,
  ArrowRight,
  Shield,
  User as UserIcon,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/helpers';
import { AppShell, MoneyDisplay } from '@/components/DesignSystem';
import { DataService } from '@/services/mockDataService';

export default function HomeScreen() {
  const router = useRouter();
  const { user, switchRole, logout, carrito } = useApp();
  const isAdmin = user?.rol === 'Administrador';

  const [resumen, setResumen] = useState({
    ventasHoy: 0,
    cobranzaHoy: 0,
    creditoColocadoHoy: 0,
    efectivoEnCaja: 0,
    totalPiezasVendidas: 0,
  });
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Fecha dinámica real en español
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const fechaHoyFormateada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  const loadDashboard = useCallback(async () => {
    try {
      const live = await DataService.getDashboardResumen();
      if (live) {
        setResumen({
          ventasHoy: live.ventasHoy || 0,
          cobranzaHoy: live.cobranzaHoy || 0,
          creditoColocadoHoy: live.creditoColocadoHoy || 0,
          efectivoEnCaja: live.efectivoEnCaja || 0,
          totalPiezasVendidas: live.totalPiezasVendidas || 0,
        });
        setIsLiveConnected(true);
      }
    } catch {
      setIsLiveConnected(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cartCount = carrito.length;

  return (
    <AppShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={true}
      >
        {/* 1. ENCABEZADO COMPACTO */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hola, {user?.nombre || 'Miguel'}</Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isLiveConnected ? colors.success[500] : colors.neutral[400] },
                ]}
              />
              <Text style={styles.statusText}>
                {isLiveConnected ? 'En línea' : 'Sin conexión'}
              </Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.dateText}>{fechaHoyFormateada}</Text>
            </View>
          </View>

          {/* Acciones de Cabecera: Selector compacto de Rol + Salir */}
          <View style={styles.headerActions}>
            <View style={styles.rolePill}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => switchRole('Administrador')}
                style={[styles.roleOption, isAdmin && styles.roleOptionActive]}
              >
                <Text style={[styles.roleOptionText, isAdmin && styles.roleOptionTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => switchRole('Vendedor')}
                style={[styles.roleOption, !isAdmin && styles.roleOptionActive]}
              >
                <Text style={[styles.roleOptionText, !isAdmin && styles.roleOptionTextActive]}>
                  Vendedor
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={logout}
              style={styles.logoutBtn}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={18} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. BOTÓN PRINCIPAL GRANDE: VENDER */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/venta')}
          style={[styles.venderHeroBtn, shadows.card]}
          accessibilityLabel="Iniciar venta"
        >
          <View style={styles.venderHeroIconWrap}>
            <ShoppingBag size={26} color={colors.neutral[0]} strokeWidth={2.4} />
          </View>
          <View style={styles.venderHeroTextWrap}>
            <Text style={styles.venderHeroTitle}>VENDER</Text>
            <Text style={styles.venderHeroSub}>
              {cartCount > 0 ? `Venta en curso (${cartCount} productos)` : 'Iniciar pedido rápido'}
            </Text>
          </View>
          <View style={styles.venderHeroArrowWrap}>
            <ArrowRight size={20} color={colors.neutral[0]} strokeWidth={2.6} />
          </View>
        </TouchableOpacity>

        {/* 3. RESUMEN COMPACTO: 3 INDICADORES CLAVE */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionLabel}>Resumen del día</Text>

          {/* Tarjeta 1: Ventas Hoy */}
          <View style={[styles.kpiCard, styles.kpiCardPrimary, shadows.card]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: colors.primary[50] }]}>
                <TrendingUp size={18} color={colors.primary[600]} />
              </View>
              <Text style={styles.kpiTitle}>Ventas hoy</Text>
            </View>
            <MoneyDisplay amount={resumen.ventasHoy} size="lg" color={colors.primary[800]} />
            <Text style={styles.kpiDetail}>
              {resumen.totalPiezasVendidas} piezas/paq vendidas
            </Text>
          </View>

          {/* Fila compacta de 2 columnas: Cobrado hoy y Crédito hoy */}
          <View style={styles.kpiRowDouble}>
            {/* Tarjeta 2: Cobrado Hoy */}
            <View style={[styles.kpiCardHalf, shadows.card]}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: colors.success[50] }]}>
                  <Wallet size={16} color={colors.success[700]} />
                </View>
                <Text style={styles.kpiTitleSmall}>Cobrado hoy</Text>
              </View>
              <MoneyDisplay amount={resumen.cobranzaHoy} size="md" color={colors.success[700]} />
              <Text style={styles.kpiDetailSmall}>Efectivo y transfers</Text>
            </View>

            {/* Tarjeta 3: Crédito Hoy */}
            <View style={[styles.kpiCardHalf, shadows.card]}>
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconWrap, { backgroundColor: colors.warning[50] }]}>
                  <CreditCard size={16} color={colors.warning[700]} />
                </View>
                <Text style={styles.kpiTitleSmall}>Crédito hoy</Text>
              </View>
              <MoneyDisplay amount={resumen.creditoColocadoHoy} size="md" color={colors.warning[700]} />
              <Text style={styles.kpiDetailSmall}>Fiado del día</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  metaDot: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  dateText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radius.full,
    padding: 2,
  },
  roleOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleOptionActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.card,
  },
  roleOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  roleOptionTextActive: {
    color: colors.primary[700],
    fontWeight: '800',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  /* Botón Hero Vender */
  venderHeroBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  venderHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  venderHeroTextWrap: {
    flex: 1,
  },
  venderHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.neutral[0],
    letterSpacing: 0.5,
  },
  venderHeroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  venderHeroArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Sección de Indicadores (3 KPIs) */
  kpiSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  kpiCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  kpiCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  kpiDetail: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
    fontWeight: '500',
  },
  kpiRowDouble: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCardHalf: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  kpiTitleSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  kpiDetailSmall: {
    fontSize: 10.5,
    color: colors.neutral[500],
    marginTop: 4,
    fontWeight: '500',
  },
});
