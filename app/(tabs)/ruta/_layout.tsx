import { Stack } from 'expo-router';

export default function RutaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cliente/[id]" />
      <Stack.Screen name="mapa" />
    </Stack>
  );
}
