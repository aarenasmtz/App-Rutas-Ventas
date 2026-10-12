import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  type StyleProp,
  type ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  Minus,
  Check,
  ChevronRight,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Package,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';
import type { Producto, Cliente, PresentacionConfig, PresentacionTipo } from '@/types';

// ==========================================
// 1. APP SHELL (Responsive container)
// ==========================================
export function AppShell({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[shellStyles.outer, style]}>
      <View style={shellStyles.inner}>{children}</View>
    </View>
  );
}

const shellStyles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0f172a', // Fondo oscuro en los bordes para desktop/tablet
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 520, // Mobile-first centered frame on desktop
    backgroundColor: colors.neutral[50],
  },
});

import { useRouter } from 'expo-router';

// ==========================================
// 2. PAGE HEADER
// ==========================================
export function PageHeader({
  title,
  subtitle,
  right,
  onBack,
  badgeText,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  badgeText?: string;
}) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/mas');
    }
  };

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.leftRow}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleBackPress} style={headerStyles.backBtn}>
            <Text style={headerStyles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={headerStyles.titles}>
          <View style={headerStyles.titleRow}>
            <Text style={headerStyles.title} numberOfLines={1}>{title}</Text>
            {badgeText && (
              <View style={headerStyles.badge}>
                <Text style={headerStyles.badgeText}>{badgeText}</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={headerStyles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View style={headerStyles.right}>{right}</View>}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : spacing.md,
    paddingBottom: spacing.sm + 4,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: colors.neutral[800],
    marginTop: -3,
    fontWeight: '700',
  },
  titles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  badge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

// ==========================================
// 3. DASHBOARD TILE (Mosaico táctil grande)
// ==========================================
export function DashboardTile({
  title,
  subtitle,
  icon,
  color = colors.primary[600],
  bgColor = colors.primary[50],
  badge,
  onPress,
  isHero = false,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
  bgColor?: string;
  badge?: string;
  onPress: () => void;
  isHero?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        tileStyles.container,
        isHero ? tileStyles.hero : null,
        shadows.card,
      ]}
    >
      <View style={tileStyles.topRow}>
        <View style={[tileStyles.iconCircle, { backgroundColor: isHero ? 'rgba(255,255,255,0.2)' : bgColor }]}>
          {icon}
        </View>
        {badge && (
          <View style={[tileStyles.badge, { backgroundColor: isHero ? 'rgba(255,255,255,0.25)' : color + '18' }]}>
            <Text style={[tileStyles.badgeText, { color: isHero ? colors.neutral[0] : color }]}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={tileStyles.bottom}>
        <Text style={[tileStyles.title, isHero && tileStyles.heroText]}>{title}</Text>
        {subtitle && (
          <Text style={[tileStyles.subtitle, isHero && tileStyles.heroSubtext]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const tileStyles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 112,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  hero: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[500],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  bottom: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  heroText: {
    color: colors.neutral[0],
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
});

// ==========================================
// 4. SEARCH BAR
// ==========================================
export function SearchBar({
  value,
  onChangeText,
  placeholder = '¿Qué producto buscas?',
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <View style={[searchStyles.container, shadows.card]}>
      <Search size={20} color={colors.primary[600]} />
      <TextInput
        style={searchStyles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity activeOpacity={0.7} onPress={onClear} style={searchStyles.clearBtn}>
          <X size={16} color={colors.neutral[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md - 2 : spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
  },
});

// ==========================================
// 5. CATEGORY CARD (Mosaicos visuales de categoría)
// ==========================================
export function CategoryCard({
  nombre,
  icono,
  isActive,
  onPress,
  count,
}: {
  nombre: string;
  icono: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        catStyles.card,
        isActive ? catStyles.activeCard : null,
      ]}
    >
      <Text style={catStyles.emoji}>{icono}</Text>
      <Text style={[catStyles.name, isActive && catStyles.activeName]} numberOfLines={1}>
        {nombre}
      </Text>
      {count !== undefined && (
        <View style={[catStyles.counter, isActive && catStyles.activeCounter]}>
          <Text style={[catStyles.countText, isActive && catStyles.activeCountText]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const catStyles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[0],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  activeCard: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  emoji: {
    fontSize: 18,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
  },
  activeName: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
  counter: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginLeft: 2,
  },
  activeCounter: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[600],
    fontWeight: fontWeight.bold,
  },
  activeCountText: {
    color: colors.neutral[0],
  },
});

// ==========================================
// 6. STOCK BADGE
// ==========================================
export function StockBadge({ stockPiezas }: { stockPiezas: number }) {
  if (stockPiezas <= 0) {
    return (
      <View style={[stockStyles.badge, { backgroundColor: colors.error[50] }]}>
        <Text style={[stockStyles.text, { color: colors.error[700] }]}>Agotado</Text>
      </View>
    );
  }
  if (stockPiezas <= 10) {
    return (
      <View style={[stockStyles.badge, { backgroundColor: colors.warning[50] }]}>
        <Text style={[stockStyles.text, { color: colors.warning[700] }]}>Stock bajo: {stockPiezas} pzas</Text>
      </View>
    );
  }
  return (
    <View style={[stockStyles.badge, { backgroundColor: colors.success[50] }]}>
      <Text style={[stockStyles.text, { color: colors.success[700] }]}>{stockPiezas} pzas disponibles</Text>
    </View>
  );
}

const stockStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.semibold,
  },
});

// ==========================================
// 7. MONEY DISPLAY
// ==========================================
export function MoneyDisplay({
  amount,
  size = 'md',
  color,
  prefix = '$',
}: {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  prefix?: string;
}) {
  const sizeMap = {
    sm: { text: fontSize.sm, bold: fontWeight.semibold },
    md: { text: fontSize.base, bold: fontWeight.bold },
    lg: { text: fontSize.xl, bold: fontWeight.bold },
    xl: { text: fontSize.xxxl, bold: fontWeight.bold },
  };

  const s = sizeMap[size];
  const textColor = color || colors.neutral[900];

  return (
    <Text style={{ fontSize: s.text, fontWeight: s.bold, color: textColor }}>
      {prefix}
      {amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
    </Text>
  );
}

// ==========================================
// 8. PRODUCT CARD (Grid táctil con presentaciones)
// ==========================================
export function ProductCard({
  producto,
  onPressAdd,
  onToggleFavorito,
  specialPrice,
}: {
  producto: Producto;
  onPressAdd: () => void;
  onToggleFavorito?: () => void;
  specialPrice?: number;
}) {
  const isAgotado = producto.existencia <= 0;
  const precioUnitario = specialPrice || producto.precioBase;

  return (
    <View style={[productStyles.card, shadows.card, isAgotado && productStyles.cardDisabled]}>
      {/* Indicador de Favorito */}
      <View style={productStyles.topBar}>
        <View style={productStyles.categoryBadge}>
          <Text style={productStyles.categoryText}>{producto.categoria}</Text>
        </View>
        {onToggleFavorito && (
          <TouchableOpacity activeOpacity={0.7} onPress={onToggleFavorito} style={productStyles.favBtn}>
            <Star
              size={18}
              color={producto.favorito ? colors.warning[500] : colors.neutral[300]}
              fill={producto.favorito ? colors.warning[500] : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Marca y Nombre */}
      <View style={productStyles.middle}>
        {producto.marca && <Text style={productStyles.brandText}>{producto.marca}</Text>}
        <Text style={productStyles.titleText} numberOfLines={2}>{producto.nombre}</Text>
      </View>

      {/* Stock en piezas */}
      <View style={productStyles.stockRow}>
        <StockBadge stockPiezas={producto.existencia} />
      </View>

      {/* Presentaciones disponibles chips */}
      {producto.presentaciones && producto.presentaciones.length > 1 && (
        <View style={productStyles.presRow}>
          <Text style={productStyles.presLabel}>Formatos: </Text>
          <Text style={productStyles.presList} numberOfLines={1}>
            {producto.presentaciones.map((p) => p.tipo).join(' · ')}
          </Text>
        </View>
      )}

      {/* Pie y botón de agregar */}
      <View style={productStyles.footer}>
        <View>
          <Text style={productStyles.priceLabel}>Desde</Text>
          <MoneyDisplay amount={precioUnitario} size="md" color={colors.primary[700]} />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isAgotado}
          onPress={onPressAdd}
          style={[productStyles.addBtn, isAgotado && productStyles.addBtnDisabled]}
        >
          <Plus size={18} color={colors.neutral[0]} />
          <Text style={productStyles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const productStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    marginBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  cardDisabled: {
    opacity: 0.65,
    backgroundColor: colors.neutral[50],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryText: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[600],
    fontWeight: fontWeight.semibold,
  },
  favBtn: {
    padding: 4,
  },
  middle: {
    marginVertical: spacing.xs,
  },
  brandText: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginTop: 2,
    lineHeight: 20,
  },
  stockRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  presRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  presLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[500],
    fontWeight: fontWeight.semibold,
  },
  presList: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[700],
    fontWeight: fontWeight.medium,
    flex: 1,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  priceLabel: {
    fontSize: fontSize.xs - 1,
    color: colors.neutral[400],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  addBtnDisabled: {
    backgroundColor: colors.neutral[300],
  },
  addBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});

// ==========================================
// 9. CLIENT CARD (Táctil con acciones rápidas)
// ==========================================
export function ClientCard({
  cliente,
  onVender,
  onCobrar,
  onVerDetalle,
  onEdit,
  onDelete,
  isCurrent = false,
}: {
  cliente: Cliente;
  onVender: () => void;
  onCobrar: () => void;
  onVerDetalle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCurrent?: boolean;
}) {
  const isAtendido = cliente.estado === 'Venta realizada' || cliente.estado === 'Visitado';
  const hasSaldo = cliente.saldo > 0;

  return (
    <View style={[clientStyles.card, shadows.card, isCurrent && clientStyles.currentCard]}>
      {/* Encabezado limpio y respirable */}
      <View style={clientStyles.headerRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <View style={clientStyles.nameRow}>
            <Text style={clientStyles.businessName} numberOfLines={1}>{cliente.nombre}</Text>
            {isAtendido ? (
              <View style={clientStyles.atendidoBadge}>
                <CheckCircle2 size={11} color="#15803d" />
                <Text style={clientStyles.atendidoBadgeText}>Atendido</Text>
              </View>
            ) : cliente.distanciaMock ? (
              <View style={clientStyles.locationBadge}>
                <MapPin size={10} color={colors.primary[700]} />
                <Text style={clientStyles.locationBadgeText}>{cliente.distanciaMock}</Text>
              </View>
            ) : null}
            {isCurrent && (
              <View style={clientStyles.currentBadge}>
                <Text style={clientStyles.currentBadgeText}>En turno</Text>
              </View>
            )}
          </View>
          <Text style={clientStyles.ownerName} numberOfLines={1}>
            {cliente.propietario} · {cliente.direccion}
          </Text>
        </View>

        {/* Estado de saldo / cobranza */}
        <View style={clientStyles.saldoCol}>
          {hasSaldo ? (
            <View style={clientStyles.deudaPill}>
              <Text style={clientStyles.deudaPillLabel}>Saldo</Text>
              <Text style={clientStyles.deudaPillAmount}>{formatCurrency(cliente.saldo)}</Text>
            </View>
          ) : (
            <View style={clientStyles.alCorrientePill}>
              <Text style={clientStyles.alCorrienteText}>Al corriente</Text>
            </View>
          )}
          {onEdit && (
            <TouchableOpacity activeOpacity={0.7} onPress={onEdit} style={clientStyles.topEditBtn}>
              <Edit2 size={13} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Acciones principales: solo lo importante */}
      <View style={clientStyles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onVender}
          style={[clientStyles.btnVender, isAtendido && clientStyles.btnVenderAgain]}
        >
          <ShoppingCart size={15} color={colors.neutral[0]} />
          <Text style={clientStyles.btnVenderText}>
            {isAtendido ? '+ Vender de nuevo' : 'Vender'}
          </Text>
        </TouchableOpacity>

        {hasSaldo && (
          <TouchableOpacity activeOpacity={0.85} onPress={onCobrar} style={clientStyles.btnCobrar}>
            <Text style={clientStyles.btnCobrarText}>Cobrar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={onVerDetalle} style={clientStyles.btnVer}>
          <Text style={clientStyles.btnVerText}>Detalle</Text>
          <ChevronRight size={13} color={colors.neutral[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const clientStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1.2,
    borderColor: colors.neutral[100],
    marginBottom: spacing.sm + 2,
  },
  currentCard: {
    borderColor: colors.primary[500],
    backgroundColor: '#f8faff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  businessName: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  atendidoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  atendidoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[700],
  },
  currentBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  currentBadgeText: {
    fontSize: 9,
    color: colors.neutral[0],
    fontWeight: '700',
  },
  ownerName: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 4,
  },
  saldoCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deudaPill: {
    alignItems: 'flex-end',
    backgroundColor: colors.error[50],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  deudaPillLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.error[600],
  },
  deudaPillAmount: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.error[700],
  },
  alCorrientePill: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  alCorrienteText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  topEditBtn: {
    padding: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md - 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  btnVender: {
    flex: 2,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    gap: 6,
  },
  btnVenderAgain: {
    backgroundColor: colors.primary[700],
  },
  btnVenderText: {
    color: colors.neutral[0],
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  btnCobrar: {
    flex: 1.2,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  btnCobrarText: {
    color: colors.success[700],
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  btnVer: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    gap: 2,
  },
  btnVerText: {
    color: colors.neutral[700],
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
});

// ==========================================
// 10. PRESENTATION MODAL (Selector con cálculo de piezas en tiempo real)
// ==========================================
// ==========================================
// 10. MODAL DE CÁLCULO Y VENTA DE PRODUCTO (FLUX EXACTO DE LA IMAGEN)
// ==========================================
export function PresentationModal({
  visible,
  producto,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  producto: Producto | null;
  onClose: () => void;
  onConfirm: (presentacion: PresentacionConfig, cantidad: number, piezasTotales: number, subtotal: number) => void;
}) {
  if (!producto) return null;

  const isPeso = producto.precioPorPeso || producto.unidad === 'kg';
  const unitLabel = isPeso ? 'kg' : (producto.unidad || 'pza');
  const basePrice = producto.precioBase;

  const pesoChips = [0.250, 0.500, 0.750, 1.000, 1.250, 1.500];
  const pzaChips = [1, 2, 3, 5, 10, 12, 24];

  const presentacionesDisponibles: PresentacionConfig[] = producto.presentaciones && producto.presentaciones.length > 0
    ? producto.presentaciones
    : [
        {
          tipo: isPeso ? 'pieza' : 'pieza',
          nombre: isPeso ? 'Por Kilo / Porción' : 'Pieza Individual',
          piezasEquivalentes: 1,
          precio: basePrice,
          descripcionEquivalencia: isPeso ? `Venta por peso ($${basePrice}/kg)` : '1 pieza',
        },
      ];

  const hasMultiplePresentaciones = presentacionesDisponibles.length > 1;
  const [modoVenta, setModoVenta] = React.useState<'peso' | 'presentacion'>(isPeso ? 'peso' : 'presentacion');
  const [selectedPres, setSelectedPres] = React.useState<PresentacionConfig>(presentacionesDisponibles[0]);
  const [cantidad, setCantidad] = React.useState<number>(isPeso ? 0.500 : 1);

  React.useEffect(() => {
    if (producto) {
      if (isPeso) {
        setModoVenta('peso');
        setCantidad(0.500);
      } else {
        setModoVenta('presentacion');
        setCantidad(1);
      }
      setSelectedPres(presentacionesDisponibles[0]);
    }
  }, [producto?.id]);

  // Stepper calculations
  const handleIncrement = () => {
    if (isPeso && modoVenta === 'peso') {
      setCantidad((prev) => parseFloat((prev + 0.250).toFixed(3)));
    } else {
      setCantidad((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (isPeso && modoVenta === 'peso') {
      setCantidad((prev) => (prev > 0.250 ? parseFloat((prev - 0.250).toFixed(3)) : 0.250));
    } else {
      setCantidad((prev) => (prev > 1 ? prev - 1 : 1));
    }
  };

  // Subtotal calculation
  const currentPrice = modoVenta === 'presentacion' ? selectedPres.precio : basePrice;
  const subtotal = Math.round(cantidad * currentPrice * 100) / 100;
  const piezasTotales = modoVenta === 'presentacion' ? cantidad * selectedPres.piezasEquivalentes : cantidad;

  // Subtotal formatted as in screenshot e.g. $92.5 or $185
  const formatSubtotalDisplay = (val: number) => {
    const s = val.toFixed(2);
    return s.endsWith('0') && !s.endsWith('.00') ? s.slice(0, -1) : s.endsWith('.00') ? val.toFixed(0) : s;
  };

  const handleConfirm = () => {
    const finalPres: PresentacionConfig = modoVenta === 'presentacion' ? selectedPres : {
      tipo: 'pieza',
      nombre: isPeso ? 'Kilos / Porción' : 'Piezas',
      piezasEquivalentes: 1,
      precio: basePrice,
      descripcionEquivalencia: `${cantidad} ${unitLabel}`,
    };
    onConfirm(finalPres, cantidad, piezasTotales, subtotal);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={presModalStyles.overlay} onPress={onClose}>
        <Pressable style={presModalStyles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Top handle pill */}
          <View style={presModalStyles.handle} />

          {/* Product Title and Price */}
          <View style={presModalStyles.header}>
            <Text style={presModalStyles.title}>{producto.nombre}</Text>
            <Text style={presModalStyles.priceSubtitle}>${basePrice} / {unitLabel}</Text>
          </View>

          {/* Selector de modo si tiene presentaciones especiales de mayoreo */}
          {hasMultiplePresentaciones && (
            <View style={presModalStyles.modeTabsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setModoVenta('peso'); setCantidad(isPeso ? 0.500 : 1); }}
                style={[presModalStyles.modeTab, modoVenta === 'peso' && presModalStyles.modeTabActive]}
              >
                <Text style={[presModalStyles.modeTabText, modoVenta === 'peso' && presModalStyles.modeTabTextActive]}>
                  {isPeso ? 'Por Kilo / Gramos' : 'Por Piezas'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setModoVenta('presentacion'); setCantidad(1); }}
                style={[presModalStyles.modeTab, modoVenta === 'presentacion' && presModalStyles.modeTabActive]}
              >
                <Text style={[presModalStyles.modeTabText, modoVenta === 'presentacion' && presModalStyles.modeTabTextActive]}>
                  Cajas / Paquetes
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {modoVenta === 'presentacion' && hasMultiplePresentaciones ? (
            <View style={presModalStyles.optionsList}>
              <Text style={presModalStyles.sectionTitle}>Selecciona formato:</Text>
              {presentacionesDisponibles.map((p, idx) => {
                const isSelected = selectedPres.nombre === p.nombre;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPres(p)}
                    style={[presModalStyles.presOption, isSelected && presModalStyles.presOptionActive]}
                  >
                    <View style={presModalStyles.presLeft}>
                      <View style={[presModalStyles.radio, isSelected && presModalStyles.radioActive]}>
                        {isSelected && <View style={presModalStyles.radioInner} />}
                      </View>
                      <View>
                        <Text style={[presModalStyles.presName, isSelected && presModalStyles.presNameActive]}>
                          {p.nombre}
                        </Text>
                        <Text style={presModalStyles.presDesc}>{p.descripcionEquivalencia || `1 ${p.tipo} = ${p.piezasEquivalentes} pzas`}</Text>
                      </View>
                    </View>
                    <MoneyDisplay amount={p.precio} size="md" color={isSelected ? colors.primary[700] : colors.neutral[900]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {/* Label "Cantidad" */}
          <Text style={presModalStyles.cantidadLabel}>Cantidad</Text>

          {/* Stepper exacto: [-]  0.500 kg  [+] */}
          <View style={presModalStyles.stepperRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecrement}
              style={presModalStyles.stepperBtnRound}
            >
              <Minus size={22} color="#334155" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={presModalStyles.stepperValueContainer}>
              <Text style={presModalStyles.stepperLargeValue}>
                {isPeso && modoVenta === 'peso' ? cantidad.toFixed(3) : cantidad} {modoVenta === 'presentacion' ? selectedPres.tipo : unitLabel}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIncrement}
              style={presModalStyles.stepperBtnRound}
            >
              <Plus size={22} color="#334155" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Chips de Selección Rápida (Exacto como la imagen) */}
          <View style={presModalStyles.chipsWrap}>
            {(isPeso && modoVenta === 'peso' ? pesoChips : pzaChips).map((val) => {
              const isActive = Math.abs(cantidad - val) < 0.001;
              return (
                <TouchableOpacity
                  key={val}
                  activeOpacity={0.8}
                  onPress={() => setCantidad(val)}
                  style={[presModalStyles.chipBtn, isActive && presModalStyles.chipBtnActive]}
                >
                  <Text style={[presModalStyles.chipBtnText, isActive && presModalStyles.chipBtnTextActive]}>
                    {isPeso ? val.toFixed(3) : val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tarjeta de Subtotal (Exacto como la imagen) */}
          <View style={presModalStyles.subtotalCard}>
            <Text style={presModalStyles.subtotalTitle}>Subtotal</Text>
            <Text style={presModalStyles.subtotalBigAmount}>${formatSubtotalDisplay(subtotal)}</Text>
          </View>

          {/* Botón "Agregar al carrito" con icono de carrito */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConfirm}
            style={presModalStyles.addToCartBtn}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <Text style={presModalStyles.addToCartBtnText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const presModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  priceSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#1E293B',
  },
  optionsList: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  presOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  presOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  presLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  presName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  presNameActive: {
    color: '#1D4ED8',
  },
  presDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cantidadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 18,
  },
  stepperBtnRound: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueContainer: {
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLargeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chipBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  chipBtnActive: {
    backgroundColor: '#2563EB',
  },
  chipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  chipBtnTextActive: {
    color: '#FFFFFF',
  },
  subtotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtotalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
  },
  subtotalBigAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  addToCartBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ==========================================
// 11. CART BAR (Persistente flotante)
// ==========================================
export function CartBar({
  count,
  total,
  onPress,
}: {
  count: number;
  total: number;
  onPress: () => void;
}) {
  if (count <= 0) return null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[cartBarStyles.container, shadows.floating]}>
      <View style={cartBarStyles.left}>
        <View style={cartBarStyles.badge}>
          <Text style={cartBarStyles.badgeText}>{count}</Text>
        </View>
        <View>
          <Text style={cartBarStyles.title}>Ver carrito</Text>
          <Text style={cartBarStyles.subtitle}>{count} {count === 1 ? 'producto' : 'productos'}</Text>
        </View>
      </View>

      <View style={cartBarStyles.right}>
        <MoneyDisplay amount={total} size="md" color={colors.neutral[0]} />
        <View style={cartBarStyles.arrowCircle}>
          <ArrowRight size={18} color={colors.primary[700]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cartBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary[700],
    borderRadius: radius.xl,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  title: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ==========================================
// 12. ROLE SWITCHER (Para probar Admin vs Vendedor)
// ==========================================
export function RoleSwitcher({
  currentRole,
  onSwitch,
}: {
  currentRole: 'Administrador' | 'Vendedor';
  onSwitch: (role: 'Administrador' | 'Vendedor') => void;
}) {
  return (
    <View style={roleStyles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSwitch('Administrador')}
        style={[roleStyles.chip, currentRole === 'Administrador' && roleStyles.chipActive]}
      >
        <ShieldCheck size={14} color={currentRole === 'Administrador' ? colors.neutral[0] : colors.neutral[600]} />
        <Text style={[roleStyles.chipText, currentRole === 'Administrador' && roleStyles.chipTextActive]}>
          Miguel (Admin)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSwitch('Vendedor')}
        style={[roleStyles.chip, currentRole === 'Vendedor' && roleStyles.chipActive]}
      >
        <User size={14} color={currentRole === 'Vendedor' ? colors.neutral[0] : colors.neutral[600]} />
        <Text style={[roleStyles.chipText, currentRole === 'Vendedor' && roleStyles.chipTextActive]}>
          Vendedor
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const roleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    padding: 3,
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.neutral[0],
    fontWeight: fontWeight.bold,
  },
});

// ==========================================
// 13. LOADING SKELETON
// ==========================================
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md, padding: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skelStyles.item}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={skelStyles.text}>Cargando datos en ruta...</Text>
        </View>
      ))}
    </View>
  );
}

const skelStyles = StyleSheet.create({
  item: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    fontWeight: fontWeight.medium,
  },
});
