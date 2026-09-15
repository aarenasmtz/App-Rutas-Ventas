import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Truck, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, shadows } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function LoginScreen() {
  const { login, online, toggleOnline } = useApp();
  const [usuario, setUsuario] = useState('miguel');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!usuario.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setError('');
    login();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Truck size={36} color={colors.neutral[0]} />
          </View>
          <Text style={styles.appName}>Ruta Ventas</Text>
          <Text style={styles.tagline}>Sistema de reparto y preventa</Text>
        </View>

        <View style={[styles.form, shadows.card]}>
          <Text style={styles.formTitle}>Iniciar sesión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Usuario"
              placeholderTextColor={colors.neutral[400]}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor={colors.neutral[400]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={20} color={colors.neutral[400]} /> : <Eye size={20} color={colors.neutral[400]} />}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={toggleOnline} style={styles.connBtn}>
            {online ? <Wifi size={16} color={colors.success[600]} /> : <WifiOff size={16} color={colors.error[500]} />}
            <Text style={[styles.connText, { color: online ? colors.success[600] : colors.error[500] }]}>
              {online ? 'En línea' : 'Sin conexión'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.version}>Versión 1.0.0 · Demo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[700],
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[0],
  },
  tagline: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.xs + 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    fontFamily: 'Inter-Regular',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    fontFamily: 'Inter-Regular',
  },
  eyeBtn: {
    padding: spacing.md - 2,
  },
  error: {
    color: colors.error[600],
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  loginBtn: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  loginBtnText: {
    color: colors.neutral[0],
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  connBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  connText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  version: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
  },
});
