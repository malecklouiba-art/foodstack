import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function DriverLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          <LinearGradient
            colors={[Colors.brand[600], Colors.brand[500]]}
            style={styles.logo}
          >
            <Text style={styles.logoEmoji}>🛵</Text>
          </LinearGradient>

          <Text style={styles.title}>Espace livreur</Text>
          <Text style={styles.subtitle}>Connectez-vous pour commencer à livrer</Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Email professionnel"
                placeholderTextColor={Colors.surface[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={Colors.surface[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Compte livreur fourni par le restaurant</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface[50] },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 48, alignItems: 'center' },
  logo:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 40 },
  title:     { fontSize: 28, fontWeight: '900', color: Colors.surface[900], marginBottom: 6 },
  subtitle:  { fontSize: 14, color: Colors.surface[400], marginBottom: 36, textAlign: 'center' },
  form: { width: '100%', gap: 14, marginBottom: 22 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputIcon: { fontSize: 17 },
  input:     { flex: 1, fontSize: 15, color: Colors.surface[900] },
  loginBtn: {
    width: '100%', backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.brand[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { marginTop: 20, fontSize: 12, color: Colors.surface[400], textAlign: 'center' },
});
