import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Logo */}
          <LinearGradient
            colors={[Colors.brand[500], Colors.brand[700]]}
            style={styles.logoContainer}
          >
            <Text style={styles.logoEmoji}>🍽️</Text>
          </LinearGradient>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.surface[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.surface[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={isLoading}
          >
            <Text style={styles.loginBtnText}>{isLoading ? 'Connexion…' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialText}>Continuer avec Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface[50] },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },

  logoContainer: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoEmoji:     { fontSize: 36 },
  title:    { fontSize: 26, fontWeight: '900', color: Colors.surface[900], marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.surface[400], marginBottom: 28 },

  form: { width: '100%', gap: 14, marginBottom: 20 },
  inputGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.surface[700] },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 50,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputIcon: { fontSize: 16 },
  input:     { flex: 1, fontSize: 15, color: Colors.surface[900] },
  eyeIcon:   { fontSize: 16, padding: 2 },
  forgotLink:{ alignSelf: 'flex-end' },
  forgotText:{ fontSize: 13, color: Colors.brand[500], fontWeight: '600' },

  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '500', width: '100%', marginBottom: 8, textAlign: 'center' },

  loginBtn: {
    width: '100%', backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 16, gap: 12 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: Colors.surface[200] },
  dividerText:{ fontSize: 13, color: Colors.surface[400], fontWeight: '500' },

  socialBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  socialIcon: { fontSize: 18, fontWeight: '800', width: 24, textAlign: 'center' },
  socialText: { fontSize: 14, fontWeight: '600', color: Colors.surface[700] },

  registerRow:  { flexDirection: 'row', marginTop: 10 },
  registerText: { fontSize: 14, color: Colors.surface[400] },
  registerLink: { fontSize: 14, color: Colors.brand[500], fontWeight: '700' },
});
