import { Tabs } from 'expo-router';
import { Home, Map, ShoppingCart, Users, Menu } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ConnectivityBanner } from '@/components/shared';
import { View } from 'react-native';

export default function TabLayout() {
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
            borderTopColor: colors.neutral[100],
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'Inter-SemiBold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ruta"
          options={{
            title: 'Ruta',
            tabBarIcon: ({ size, color }) => <Map size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="venta"
          options={{
            title: 'Venta',
            tabBarIcon: ({ size, color }) => <ShoppingCart size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="clientes"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="mas"
          options={{
            title: 'Más',
            tabBarIcon: ({ size, color }) => <Menu size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
