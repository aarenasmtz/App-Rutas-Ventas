import { Stack } from 'expo-router';

export default function VentaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="carrito" />
      <Stack.Screen name="pago" />
      <Stack.Screen name="confirmacion" />
    </Stack>
  );
}
