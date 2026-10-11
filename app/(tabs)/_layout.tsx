import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Users, Menu, Package } from 'lucide-react-native';
import { colors, radius, shadows, fontSize, fontWeight } from '@/constants/theme';
import { ConnectivityBanner } from '@/components/shared';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function TabLayout() {
  const { carrito } = useApp();
  const cartCount = carrito.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <ConnectivityBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.neutral[400],
          tabBarStyle: {
            backgroundColor: colors.neutral[0],
            borderTopColor: colors.neutral[200],
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 68,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ size, color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="clientes"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ size, color }) => <Users size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="venta"
          options={{
            title: 'Vender',
            tabBarLabel: ({ focused }) => (
              <Text
                style={[
                  styles.venderLabel,
                  { color: focused ? colors.primary[700] : colors.primary[600] },
                ]}
              >
                Vender
              </Text>
            ),
            tabBarIcon: ({ focused }) => (
              <View style={[styles.venderIconWrap, shadows.card]}>
                <ShoppingBag size={24} color={colors.neutral[0]} strokeWidth={2.4} />
                {cartCount > 0 && (
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountText}>{cartCount}</Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="inventario"
          options={{
            title: 'Inventario',
            tabBarIcon: ({ size, color }) => <Package size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="mas"
          options={{
            title: 'Más',
            tabBarIcon: ({ size, color }) => <Menu size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ruta"
          options={{
            href: null, // Oculto de la barra inferior, accesible por navegación
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  venderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    borderWidth: 3,
    borderColor: colors.neutral[0],
  },
  venderLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.warning[500],
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[0],
  },
  cartCountText: {
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: '800',
  },
});
