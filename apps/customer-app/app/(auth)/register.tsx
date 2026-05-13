import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = ['#ef4444', '#f59e0b', '#10b981'];
  const strengthLabels = ['Faible', 'Moyen', 'Fort'];
  const strength = passwordStrength();

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Foodstack et commandez !</Text>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jean"
                  placeholderTextColor={Colors.surface[400]}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dupont"
                  placeholderTextColor={Colors.surface[400]}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.inputInner}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.surface[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.inputInner}
                  placeholder="Min. 8 caractères"
                  placeholderTextColor={Colors.surface[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? strengthColors[strength - 1] : Colors.surface[200] }]} />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strength > 0 ? strengthColors[strength - 1] : Colors.surface[400] }]}>
                    {strengthLabels[strength - 1] ?? ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.88}
            disabled={loading}
          >
            <Text style={styles.registerBtnText}>{loading ? 'Création…' : 'Créer mon compte'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            En créant un compte, vous acceptez nos{' '}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>.
          </Text>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface[50] },
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },

  backBtn:     { alignSelf: 'flex-start', marginBottom: 20 },
  backBtnText: { fontSize: 15, color: Colors.brand[500], fontWeight: '600' },
  title:    { fontSize: 26, fontWeight: '900', color: Colors.surface[900], marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.surface[400], marginBottom: 24 },

  form: { gap: 14, marginBottom: 20 },
  row:  { flexDirection: 'row', gap: 10 },
  inputGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.surface[700] },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14,
    height: 50, fontSize: 15, color: Colors.surface[900],
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 50,
    borderWidth: 1, borderColor: Colors.surface[200],
  },
  inputIcon:  { fontSize: 16 },
  inputInner: { flex: 1, fontSize: 15, color: Colors.surface[900] },
  eyeIcon:    { fontSize: 16, padding: 2 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 36, textAlign: 'right' },

  registerBtn: {
    backgroundColor: Colors.brand[500], borderRadius: 16,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
    shadowColor: Colors.brand[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  loginText: { fontSize: 14, color: Colors.surface[400] },
  loginLink: { fontSize: 14, color: Colors.brand[500], fontWeight: '700' },

  terms:     { fontSize: 12, color: Colors.surface[400], textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.brand[500], fontWeight: '600' },
});
