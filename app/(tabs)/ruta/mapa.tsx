import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Navigation, Layers } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ScreenHeader, Card, Badge } from '@/components/shared';

export default function MapaScreen() {
  const router = useRouter();
  const { clientes } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mapa de ruta" subtitle="Ruta Centro" onBack={() => router.back()} />

      <View style={styles.mapArea}>
        <View style={styles.mapBg}>
          {/* Simulated map roads */}
          <View style={[styles.road, { width: '100%', height: 3, top: '20%' }]} />
          <View style={[styles.road, { width: '100%', height: 3, top: '55%' }]} />
          <View style={[styles.road, { width: 3, height: '100%', left: '30%' }]} />
          <View style={[styles.road, { width: 3, height: '100%', left: '70%' }]} />

          {/* Pins */}
          {clientes.slice(0, 6).map((c, i) => {
            const positions: ViewStyle[] = [
              { top: '15%', left: '25%' },
              { top: '30%', left: '60%' },
              { top: '45%', left: '35%' },
              { top: '55%', left: '75%' },
              { top: '70%', left: '20%' },
              { top: '80%', left: '55%' },
            ];
            const pos = positions[i] || positions[0];
            const isCurrent = i === 0;
            return (
              <View key={c.id} style={[styles.pinWrap, pos]}>
                <View style={[styles.pin, isCurrent && styles.pinCurrent]}>
                  <Text style={[styles.pinText, isCurrent && styles.pinTextCurrent]}>{i + 1}</Text>
                </View>
                {isCurrent && <View style={styles.pinPulse} />}
              </View>
            );
          })}

          {/* Route line */}
          <View style={styles.routeLine1} />
          <View style={styles.routeLine2} />
          <View style={styles.routeLine3} />

          {/* Map controls */}
          <View style={styles.mapControls}>
            <View style={styles.mapControlBtn}>
              <Layers size={20} color={colors.neutral[700]} />
            </View>
            <View style={styles.mapControlBtn}>
              <Navigation size={20} color={colors.primary[600]} />
            </View>
          </View>

          {/* Demo label */}
          <View style={styles.demoLabel}>
            <Text style={styles.demoLabelText}>Vista de mapa DEMO</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Ruta Centro · 10 paradas</Text>
        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          {clientes.slice(0, 6).map((c, i) => (
            <Card key={c.id} style={styles.stopCard}>
              <View style={[styles.stopNumber, i === 0 && styles.stopNumberCurrent]}>
                <Text style={[styles.stopNumberText, i === 0 && styles.stopNumberTextCurrent]}>{i + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{c.nombre}</Text>
                <Text style={styles.stopAddress}>{c.direccion}</Text>
              </View>
              <View style={styles.stopRight}>
                {i === 0 ? (
                  <Badge label="Actual" color="azul" />
                ) : (
                  <Text style={styles.stopTime}>~{(9 + i * 0.5).toFixed(1).replace('.', ':')}0</Text>
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  mapArea: {
    flex: 1,
    margin: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapBg: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    position: 'relative',
  },
  road: {
    position: 'absolute',
    backgroundColor: colors.neutral[200],
  },
  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[600],
    zIndex: 2,
  },
  pinCurrent: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
    width: 36,
    height: 36,
  },
  pinText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  pinTextCurrent: {
    color: colors.neutral[0],
  },
  pinPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primary[600] + '30',
  },
  routeLine1: {
    position: 'absolute',
    top: '17%',
    left: '28%',
    width: '35%',
    height: 3,
    backgroundColor: colors.primary[400],
    transform: [{ rotate: '15deg' }],
  },
  routeLine2: {
    position: 'absolute',
    top: '45%',
    left: '33%',
    width: '45%',
    height: 3,
    backgroundColor: colors.primary[400],
    transform: [{ rotate: '-10deg' }],
  },
  routeLine3: {
    position: 'absolute',
    top: '68%',
    left: '20%',
    width: '40%',
    height: 3,
    backgroundColor: colors.primary[400],
    transform: [{ rotate: '20deg' }],
  },
  mapControls: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    gap: spacing.sm,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  demoLabel: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.neutral[900],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  demoLabelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[0],
  },
  bottomSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '45%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  sheetList: {
    maxHeight: 250,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberCurrent: {
    backgroundColor: colors.primary[600],
  },
  stopNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral[600],
  },
  stopNumberTextCurrent: {
    color: colors.neutral[0],
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  stopAddress: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
  stopRight: {
    alignItems: 'flex-end',
  },
  stopTime: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    fontWeight: fontWeight.medium,
  },
});
