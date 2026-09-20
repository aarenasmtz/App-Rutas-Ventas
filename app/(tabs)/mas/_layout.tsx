import { Stack } from 'expo-router';

export default function MasLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="creditos" />
      <Stack.Screen name="cobranza" />
      <Stack.Screen name="devoluciones" />
      <Stack.Screen name="inventario" />
      <Stack.Screen name="carga" />
      <Stack.Screen name="gastos" />
      <Stack.Screen name="caja" />
      <Stack.Screen name="corte" />
      <Stack.Screen name="productos" />
      <Stack.Screen name="nuevo-producto" />
      <Stack.Screen name="nuevo-cliente" />
      <Stack.Screen name="rutas" />
      <Stack.Screen name="reportes" />
      <Stack.Screen name="empleados" />
      <Stack.Screen name="bitacora" />
      <Stack.Screen name="sincronizacion" />
    </Stack>
  );
}
